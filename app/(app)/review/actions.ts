"use server";

import { revalidatePath } from "next/cache";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { getOpenCycle, summariseGoals } from "@/lib/data";
import { appUrl, emailTemplate, escapeHtml, sendEmail } from "@/lib/email";
import { echo, rating, text } from "@/lib/validation";
import type { ActionState, Employee, Goal, Review } from "@/lib/types";

/**
 * Save or submit the self-appraisal. The form has two buttons:
 *   intent=save    keeps it as a draft (partial answers allowed)
 *   intent=submit  needs a comment and rating for every goal, locks it, emails the manager
 */
export async function saveSelfAppraisal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireMe();
  const intent = text(formData, "intent") === "submit" ? "submit" : "save";
  const fields = echo(formData);
  const supabase = createUserClient();

  const cycle = await getOpenCycle(supabase);
  if (!cycle) return { error: "There is no open review cycle.", fields };

  const { data: goalRows } = await supabase
    .from("goals")
    .select("id, title, status, weightage")
    .eq("employee_id", me.id)
    .eq("cycle_id", cycle.id);
  const goals = (goalRows ?? []) as Pick<Goal, "id" | "title" | "status" | "weightage">[];
  if (!summariseGoals(goals).allApproved) {
    return { error: "All your goals must be approved before the self-appraisal.", fields };
  }
  if (intent === "submit" && !me.manager_id) {
    return { error: "You don't have a manager assigned yet. Ask HR to set your manager before submitting.", fields };
  }

  // Read and validate one comment + rating per goal.
  const lines = [];
  for (const g of goals) {
    const comment = text(formData, `comment_${g.id}`);
    const rawRating = text(formData, `rating_${g.id}`);
    const value = rawRating ? rating(rawRating) : null;
    if (rawRating && value === null) return { error: `Invalid rating for "${g.title}".`, fields };
    if (comment.length > 4000) return { error: `Comment for "${g.title}" is too long.`, fields };
    if (intent === "submit" && (!comment || value === null)) {
      return { error: `Add a comment and a rating for "${g.title}" before submitting.`, fields };
    }
    lines.push({ goal_id: g.id, self_comment: comment || null, self_rating: value });
  }
  const rawOverall = text(formData, "overall_self_rating");
  const overall = rawOverall ? rating(rawOverall) : null;
  if (intent === "submit" && overall === null) return { error: "Choose an overall self-rating before submitting.", fields };

  // Find or create this cycle's review row (one per employee per cycle).
  let { data: review } = await supabase
    .from("reviews")
    .select("*")
    .eq("employee_id", me.id)
    .eq("cycle_id", cycle.id)
    .maybeSingle<Review>();
  if (!review) {
    const created = await supabase
      .from("reviews")
      .insert({ employee_id: me.id, manager_id: me.manager_id, cycle_id: cycle.id, status: "not_started" })
      .select()
      .single<Review>();
    if (created.error) return { error: `Could not start the review: ${created.error.message}`, fields };
    review = created.data;
  }
  if (review.status !== "not_started") return { error: "This self-appraisal has already been submitted.", fields };

  // Upsert = insert the line, or update it if it already exists (unique review_id + goal_id).
  const upsert = await supabase
    .from("goal_ratings")
    .upsert(lines.map((l) => ({ ...l, review_id: review.id })), { onConflict: "review_id,goal_id" });
  if (upsert.error) return { error: `Could not save ratings: ${upsert.error.message}`, fields };

  const update =
    intent === "submit"
      ? { overall_self_rating: overall, status: "self_submitted", submitted_at: new Date().toISOString() }
      : { overall_self_rating: overall };
  const saved = await supabase.from("reviews").update(update).eq("id", review.id);
  if (saved.error) return { error: `Could not save: ${saved.error.message}`, fields };

  revalidatePath("/review");
  revalidatePath("/dashboard");
  if (intent === "save") return { success: "Draft saved. You can come back and finish it later." };

  // Email the manager. This is a side effect: if it fails, the submission still stands.
  const { data: manager } = await supabase
    .from("employees")
    .select("full_name, email")
    .eq("id", me.manager_id!)
    .maybeSingle<Pick<Employee, "full_name" | "email">>();
  let emailed = false;
  if (manager) {
    const result = await sendEmail({
      to: manager.email,
      subject: `${me.full_name} submitted their self-appraisal (${cycle.name})`,
      html: emailTemplate({
        heading: "A self-appraisal is ready for your review",
        body: `Hi ${escapeHtml(manager.full_name)},<br><br><strong>${escapeHtml(me.full_name)}</strong> has submitted their self-appraisal for <strong>${escapeHtml(cycle.name)}</strong>. Please review it, rate each goal and complete the review.`,
        ctaLabel: "Open the review",
        ctaUrl: await appUrl(`/team/${me.id}`),
      }),
    });
    emailed = result.ok;
  }
  return {
    success: emailed
      ? "Self-appraisal submitted. Your manager has been emailed."
      : "Self-appraisal submitted. (The email to your manager could not be sent, but your submission is saved.)",
  };
}
