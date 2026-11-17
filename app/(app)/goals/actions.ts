"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { getOpenCycle } from "@/lib/data";
import { appUrl, emailTemplate, escapeHtml, sendEmail } from "@/lib/email";
import { echo, intInRange, isoDate, text } from "@/lib/validation";
import type { ActionState, Employee, Goal, Review, ReviewCycle } from "@/lib/types";

// Everything here runs on the server. The browser only sends form data.
// Row Level Security is the final lock; these checks give clear error messages.

type Loaded =
  | { error: string }
  | { cycle: ReviewCycle; goals: Goal[]; review: Review | null };

/** Load my goals and review for the open cycle, plus the "can I still edit?" rule. */
async function loadMyCycle(employeeId: string): Promise<Loaded> {
  const supabase = createUserClient();
  const cycle = await getOpenCycle(supabase);
  if (!cycle) return { error: "There is no open review cycle." };
  const [{ data: goals }, { data: review }] = await Promise.all([
    supabase.from("goals").select("*").eq("employee_id", employeeId).eq("cycle_id", cycle.id),
    supabase.from("reviews").select("*").eq("employee_id", employeeId).eq("cycle_id", cycle.id).maybeSingle<Review>(),
  ]);
  if (review && review.status !== "not_started") {
    return { error: "Your self-appraisal is already submitted, so goals are locked for this cycle." };
  }
  return { cycle, goals: (goals ?? []) as Goal[], review };
}

function validateGoal(formData: FormData, cycle: ReviewCycle) {
  const title = text(formData, "title");
  const description = text(formData, "description");
  const weightage = intInRange(text(formData, "weightage"), 1, 100);
  const target = isoDate(text(formData, "target_date"));

  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Keep the title under 200 characters." };
  if (description.length > 2000) return { error: "Keep the description under 2000 characters." };
  if (weightage === null) return { error: "Weightage must be a whole number from 1 to 100." };
  if (!target) return { error: "Target date is required." };
  if (target < cycle.start_date || target > cycle.end_date) {
    return { error: `Target date must fall inside the cycle (${cycle.start_date} to ${cycle.end_date}).` };
  }
  return { value: { title, description: description || null, weightage, target_date: target } };
}

export async function createGoal(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireMe();
  const loaded = await loadMyCycle(me.id);
  if ("error" in loaded) return { error: loaded.error, fields: echo(formData) };

  const parsed = validateGoal(formData, loaded.cycle);
  if ("error" in parsed) return { error: parsed.error, fields: echo(formData) };

  const currentTotal = loaded.goals.reduce((s, g) => s + g.weightage, 0);
  if (currentTotal + parsed.value.weightage > 100) {
    return {
      error: `That would bring your total to ${currentTotal + parsed.value.weightage}. The total can't go over 100. You have ${100 - currentTotal} left.`,
      fields: echo(formData),
    };
  }

  const supabase = createUserClient();
  const { error } = await supabase.from("goals").insert({
    ...parsed.value,
    employee_id: me.id,
    cycle_id: loaded.cycle.id,
    status: "draft",
  });
  if (error) return { error: `Could not save the goal: ${error.message}`, fields: echo(formData) };

  revalidatePath("/goals");
  return { success: "Goal added." };
}

export async function updateGoal(goalId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireMe();
  const loaded = await loadMyCycle(me.id);
  if ("error" in loaded) return { error: loaded.error, fields: echo(formData) };

  const goal = loaded.goals.find((g) => g.id === goalId);
  if (!goal) return { error: "Goal not found." };
  if (goal.status !== "draft" && goal.status !== "sent_back") {
    return { error: "Only draft or sent-back goals can be edited." };
  }

  const parsed = validateGoal(formData, loaded.cycle);
  if ("error" in parsed) return { error: parsed.error, fields: echo(formData) };

  const othersTotal = loaded.goals.filter((g) => g.id !== goalId).reduce((s, g) => s + g.weightage, 0);
  if (othersTotal + parsed.value.weightage > 100) {
    return {
      error: `That would bring your total to ${othersTotal + parsed.value.weightage}. The most this goal can be is ${100 - othersTotal}.`,
      fields: echo(formData),
    };
  }

  const supabase = createUserClient();
  const { error } = await supabase.from("goals").update(parsed.value).eq("id", goalId).eq("employee_id", me.id);
  if (error) return { error: `Could not save: ${error.message}`, fields: echo(formData) };

  revalidatePath("/goals");
  redirect("/goals");
}

export async function deleteGoal(goalId: string): Promise<void> {
  const me = await requireMe();
  const loaded = await loadMyCycle(me.id);
  if ("error" in loaded) return;
  const supabase = createUserClient();
  // RLS only allows deleting your own draft / sent-back goals.
  await supabase.from("goals").delete().eq("id", goalId).eq("employee_id", me.id).in("status", ["draft", "sent_back"]);
  revalidatePath("/goals");
}

export async function submitGoals(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const me = await requireMe();
  const loaded = await loadMyCycle(me.id);
  if ("error" in loaded) return { error: loaded.error };

  if (!me.manager_id) {
    return { error: "You don't have a manager assigned yet. Ask HR to set your manager before submitting." };
  }
  const pending = loaded.goals.filter((g) => g.status === "draft" || g.status === "sent_back");
  if (pending.length === 0) return { error: "There are no draft or sent-back goals to submit." };

  const total = loaded.goals.reduce((s, g) => s + g.weightage, 0);
  if (total !== 100) {
    return { error: `Your weightages add up to ${total}. They must total exactly 100 before you can submit.` };
  }

  const supabase = createUserClient();
  const { error } = await supabase
    .from("goals")
    .update({ status: "submitted" })
    .in("id", pending.map((g) => g.id))
    .eq("employee_id", me.id);
  if (error) return { error: `Could not submit: ${error.message}` };

  // Tell the manager. A failed email never undoes the submission.
  const { data: manager } = await supabase
    .from("employees")
    .select("full_name, email")
    .eq("id", me.manager_id)
    .maybeSingle<Pick<Employee, "full_name" | "email">>();
  if (manager) {
    await sendEmail({
      to: manager.email,
      subject: `${me.full_name} submitted goals for ${loaded.cycle.name}`,
      html: emailTemplate({
        heading: "Goals waiting for your approval",
        body: `Hi ${escapeHtml(manager.full_name)},<br><br><strong>${escapeHtml(me.full_name)}</strong> submitted ${pending.length} goal(s) for <strong>${escapeHtml(loaded.cycle.name)}</strong>. Please approve them or send them back with a comment.`,
        ctaLabel: "Review goals",
        ctaUrl: await appUrl(`/team/${me.id}`),
      }),
    });
  }

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  return { success: "Goals submitted to your manager for approval." };
}
