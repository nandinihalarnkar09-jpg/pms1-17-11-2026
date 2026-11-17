"use server";

import { revalidatePath } from "next/cache";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { appUrl, emailTemplate, escapeHtml, sendEmail } from "@/lib/email";
import { echo, rating, text } from "@/lib/validation";
import type { ActionState, Employee, Goal, Review, ReviewCycle } from "@/lib/types";

// Manager actions. RLS only lets a manager change goals/reviews of their
// DIRECT reports, and only in the right status. These checks add clear messages.

async function assertMyReport(employeeId: string) {
  const me = await requireMe();
  const supabase = createUserClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, email, manager_id")
    .eq("id", employeeId)
    .eq("manager_id", me.id)
    .maybeSingle<Pick<Employee, "id" | "full_name" | "email" | "manager_id">>();
  return { me, supabase, employee };
}

function refresh(employeeId: string) {
  revalidatePath(`/team/${employeeId}`);
  revalidatePath("/team");
  revalidatePath("/dashboard");
}

export async function approveGoal(employeeId: string, goalId: string): Promise<void> {
  const { supabase, employee } = await assertMyReport(employeeId);
  if (!employee) return;
  await supabase
    .from("goals")
    .update({ status: "approved", manager_comment: null })
    .eq("id", goalId)
    .eq("employee_id", employeeId)
    .eq("status", "submitted");
  refresh(employeeId);
}

export async function approveAllGoals(employeeId: string): Promise<void> {
  const { supabase, employee } = await assertMyReport(employeeId);
  if (!employee) return;
  await supabase
    .from("goals")
    .update({ status: "approved", manager_comment: null })
    .eq("employee_id", employeeId)
    .eq("status", "submitted");
  refresh(employeeId);
}

export async function sendBackGoal(
  employeeId: string,
  goalId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const comment = text(formData, "comment");
  if (comment.length < 5) return { error: "A comment is required when sending a goal back. Tell them what to change." };
  if (comment.length > 2000) return { error: "Keep the comment under 2000 characters." };

  const { supabase, employee } = await assertMyReport(employeeId);
  if (!employee) return { error: "This person is not your direct report." };

  const { data, error } = await supabase
    .from("goals")
    .update({ status: "sent_back", manager_comment: comment })
    .eq("id", goalId)
    .eq("employee_id", employeeId)
    .eq("status", "submitted")
    .select("id, title, cycle_id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only submitted goals can be sent back." };

  const goal = data[0] as Pick<Goal, "id" | "title" | "cycle_id">;
  await sendEmail({
    to: employee.email,
    subject: `A goal was sent back: ${goal.title}`,
    html: emailTemplate({
      heading: "Your manager sent back a goal",
      body: `Hi ${escapeHtml(employee.full_name)},<br><br>Your goal <strong>${escapeHtml(goal.title)}</strong> was sent back with this comment:<br><br><em>${escapeHtml(comment)}</em><br><br>Please update it and resubmit.`,
      ctaLabel: "Open my goals",
      ctaUrl: await appUrl("/goals"),
    }),
  });

  refresh(employeeId);
  return { success: "Sent back." };
}

/**
 * Save or complete the manager review. intent=save keeps it editable
 * (status: manager_reviewed); intent=complete requires every field and locks it.
 */
export async function saveManagerReview(
  employeeId: string,
  reviewId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const intent = text(formData, "intent") === "complete" ? "complete" : "save";
  const fields = echo(formData);
  const { me, supabase, employee } = await assertMyReport(employeeId);
  if (!employee) return { error: "This person is not your direct report.", fields };

  const { data: review } = await supabase
    .from("reviews")
    .select("*, cycle:review_cycles(name)")
    .eq("id", reviewId)
    .eq("employee_id", employeeId)
    .maybeSingle<Review & { cycle: Pick<ReviewCycle, "name"> | null }>();
  if (!review) return { error: "Review not found.", fields };
  if (review.status !== "self_submitted" && review.status !== "manager_reviewed") {
    return { error: review.status === "completed" ? "This review is already completed." : "The self-appraisal hasn't been submitted yet.", fields };
  }

  const { data: lines } = await supabase.from("goal_ratings").select("id, goal_id").eq("review_id", reviewId);
  const { data: goalRows } = await supabase.from("goals").select("id, title").in("id", (lines ?? []).map((l) => l.goal_id));
  const titleOf = new Map((goalRows ?? []).map((g) => [g.id as string, g.title as string]));

  const updates: { id: string; manager_comment: string | null; manager_rating: number | null }[] = [];
  for (const line of lines ?? []) {
    const comment = text(formData, `mcomment_${line.goal_id}`);
    const raw = text(formData, `mrating_${line.goal_id}`);
    const value = raw ? rating(raw) : null;
    const title = titleOf.get(line.goal_id) ?? "a goal";
    if (raw && value === null) return { error: `Invalid rating for "${title}".`, fields };
    if (comment.length > 4000) return { error: `Comment for "${title}" is too long.`, fields };
    if (intent === "complete" && (!comment || value === null)) {
      return { error: `Add your comment and rating for "${title}" before completing.`, fields };
    }
    updates.push({ id: line.id, manager_comment: comment || null, manager_rating: value });
  }

  const rawOverall = text(formData, "overall_manager_rating");
  const overall = rawOverall ? rating(rawOverall) : null;
  const summary = text(formData, "manager_summary");
  if (summary.length > 6000) return { error: "The summary is too long.", fields };
  if (intent === "complete" && (overall === null || !summary)) {
    return { error: "Give an overall rating and write a summary before completing.", fields };
  }

  for (const u of updates) {
    const { error } = await supabase
      .from("goal_ratings")
      .update({ manager_comment: u.manager_comment, manager_rating: u.manager_rating })
      .eq("id", u.id);
    if (error) return { error: `Could not save ratings: ${error.message}`, fields };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      overall_manager_rating: overall,
      manager_summary: summary || null,
      manager_id: me.id, // record who actually reviewed
      status: intent === "complete" ? "completed" : "manager_reviewed",
      ...(intent === "complete" ? { reviewed_at: new Date().toISOString() } : {}),
    })
    .eq("id", reviewId);
  if (error) return { error: `Could not save the review: ${error.message}`, fields };

  if (intent === "complete") {
    await sendEmail({
      to: employee.email,
      subject: `Your review for ${review.cycle?.name ?? "this cycle"} is complete`,
      html: emailTemplate({
        heading: "Your performance review is complete",
        body: `Hi ${escapeHtml(employee.full_name)},<br><br>${escapeHtml(me.full_name)} has completed your review for <strong>${escapeHtml(review.cycle?.name ?? "this cycle")}</strong>. You can now read their ratings and summary.`,
        ctaLabel: "Read my review",
        ctaUrl: await appUrl("/review"),
      }),
    });
  }

  refresh(employeeId);
  return { success: intent === "complete" ? "Review completed." : "Saved. The review is now marked Manager Reviewed. Complete it when you're ready." };
}
