import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RatedGoal } from "@/components/review-view";
import type { Goal, GoalRating } from "./types";

/**
 * The approved goals of one employee in one cycle, each paired with its rating
 * line (if any) from the given review. Used by the self-appraisal form, the
 * manager review form and the read-only view.
 */
export async function loadRatedGoals(
  supabase: SupabaseClient,
  employeeId: string,
  cycleId: string,
  reviewId: string | null,
): Promise<RatedGoal[]> {
  const [{ data: goals }, { data: ratings }] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, description, weightage")
      .eq("employee_id", employeeId)
      .eq("cycle_id", cycleId)
      .eq("status", "approved")
      .order("created_at"),
    reviewId
      ? supabase.from("goal_ratings").select("*").eq("review_id", reviewId)
      : Promise.resolve({ data: [] as GoalRating[] }),
  ]);
  const byGoal = new Map((ratings ?? []).map((r: GoalRating) => [r.goal_id, r]));
  return ((goals ?? []) as Pick<Goal, "id" | "title" | "description" | "weightage">[]).map((g) => ({
    ...g,
    rating: byGoal.get(g.id) ?? null,
  }));
}
