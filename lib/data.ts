import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Employee, Goal, Review, ReviewCycle, ReviewStatus } from "./types";

/** The single open cycle, or null. (The database allows only one.) */
export async function getOpenCycle(supabase: SupabaseClient): Promise<ReviewCycle | null> {
  const { data } = await supabase
    .from("review_cycles")
    .select("*")
    .eq("status", "open")
    .maybeSingle<ReviewCycle>();
  return data;
}

/**
 * Adds each employee's manager name. We look names up in code rather than
 * with a Supabase embed, because embedding `employees` inside `employees`
 * (a self-referencing foreign key) is ambiguous to the API and returns an error.
 */
export function withManagerNames<T extends Pick<Employee, "manager_id">>(
  employees: T[],
  everyone: Pick<Employee, "id" | "full_name">[],
): (T & { manager: { full_name: string } | null })[] {
  const nameById = new Map(everyone.map((e) => [e.id, e.full_name]));
  return employees.map((e) => ({
    ...e,
    manager: e.manager_id ? { full_name: nameById.get(e.manager_id) ?? "—" } : null,
  }));
}

/** Totals and counts for one employee's goals in a cycle. */
export function summariseGoals(goals: Pick<Goal, "status" | "weightage">[]) {
  const total = goals.reduce((sum, g) => sum + g.weightage, 0);
  const count = (s: Goal["status"]) => goals.filter((g) => g.status === s).length;
  const approved = count("approved");
  return {
    total,
    count: goals.length,
    draft: count("draft"),
    submitted: count("submitted"),
    approved,
    sentBack: count("sent_back"),
    allApproved: goals.length > 0 && approved === goals.length && total === 100,
  };
}

export type GoalSummary = ReturnType<typeof summariseGoals>;

export type ProgressReview = Pick<
  Review,
  "id" | "employee_id" | "status" | "overall_self_rating" | "overall_manager_rating"
>;

/** One row per employee for the team and HR views. */
export type ProgressRow = {
  employee: Employee & { manager?: { full_name: string } | null };
  goals: GoalSummary;
  review: ProgressReview | null;
  reviewStatus: ReviewStatus; // no review row yet = not_started
};

export function buildProgressRows(
  employees: ProgressRow["employee"][],
  goals: Pick<Goal, "employee_id" | "status" | "weightage">[],
  reviews: ProgressReview[],
): ProgressRow[] {
  return employees.map((employee) => {
    const review = reviews.find((r) => r.employee_id === employee.id) ?? null;
    return {
      employee,
      goals: summariseGoals(goals.filter((g) => g.employee_id === employee.id)),
      review,
      reviewStatus: review?.status ?? "not_started",
    };
  });
}

/** The next thing an employee should do, shown on their dashboard. */
export function nextStepForEmployee(
  cycle: ReviewCycle | null,
  goals: GoalSummary,
  reviewStatus: ReviewStatus,
): { text: string; href?: string; cta?: string } {
  if (!cycle) return { text: "No review cycle is open right now. HR will open one when it is time." };
  if (reviewStatus === "completed")
    return { text: "Your review is complete. You can read your manager's ratings and summary.", href: "/review", cta: "View my review" };
  if (reviewStatus === "self_submitted" || reviewStatus === "manager_reviewed")
    return { text: "Your self-appraisal is submitted. Waiting for your manager to complete the review." };
  if (goals.allApproved)
    return { text: "All your goals are approved. Complete your self-appraisal.", href: "/review", cta: "Start self-appraisal" };
  if (goals.sentBack > 0)
    return { text: "Your manager sent back a goal. Update it and resubmit.", href: "/goals", cta: "Fix my goals" };
  if (goals.submitted > 0 && goals.draft === 0)
    return { text: "Your goals are waiting for your manager's approval." };
  if (goals.count === 0)
    return { text: "Add your goals for this cycle. Weightages must total 100.", href: "/goals", cta: "Add goals" };
  return { text: `Your goals add up to ${goals.total} of 100. Finish them and submit for approval.`, href: "/goals", cta: "Go to my goals" };
}
