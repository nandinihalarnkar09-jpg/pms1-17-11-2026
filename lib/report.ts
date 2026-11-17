import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildProgressRows, withManagerNames, type ProgressReview, type ProgressRow } from "./data";
import type { Employee, Goal, ReviewCycle } from "./types";

/** Company-wide completion data for one cycle (HR only: RLS lets HR read everything). */
export async function loadReport(
  supabase: SupabaseClient,
  cycleId: string | undefined,
): Promise<{ cycles: ReviewCycle[]; cycle: ReviewCycle | null; rows: ProgressRow[] }> {
  const { data: cycleRows } = await supabase.from("review_cycles").select("*").order("start_date", { ascending: false });
  const cycles = (cycleRows ?? []) as ReviewCycle[];
  const cycle =
    cycles.find((c) => c.id === cycleId) ?? cycles.find((c) => c.status === "open") ?? cycles[0] ?? null;
  if (!cycle) return { cycles, cycle: null, rows: [] };

  const [{ data: employees }, { data: goals }, { data: reviews }] = await Promise.all([
    supabase.from("employees").select("*").order("department").order("full_name"),
    supabase.from("goals").select("employee_id, status, weightage").eq("cycle_id", cycle.id),
    supabase
      .from("reviews")
      .select("id, employee_id, status, overall_self_rating, overall_manager_rating")
      .eq("cycle_id", cycle.id),
  ]);

  const everyone = (employees ?? []) as Employee[];
  const active = withManagerNames(everyone.filter((e) => e.is_active), everyone);
  return {
    cycles,
    cycle,
    rows: buildProgressRows(
      active,
      (goals ?? []) as Goal[],
      (reviews ?? []) as ProgressReview[],
    ),
  };
}
