"use server";

import { revalidatePath } from "next/cache";
import { requireHr } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { echo, isoDate, text } from "@/lib/validation";
import type { ActionState, CycleStatus } from "@/lib/types";

export async function createCycle(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireHr();
  const name = text(formData, "name");
  const start = isoDate(text(formData, "start_date"));
  const end = isoDate(text(formData, "end_date"));
  if (!name) return { error: "Name is required, e.g. FY 2026–27 Annual.", fields: echo(formData) };
  if (!start || !end) return { error: "Start and end dates are required.", fields: echo(formData) };
  if (end <= start) return { error: "End date must be after the start date.", fields: echo(formData) };

  const supabase = createUserClient();
  const { error } = await supabase
    .from("review_cycles")
    .insert({ name, start_date: start, end_date: end, status: "draft", created_by: me.id });
  if (error) return { error: error.message, fields: echo(formData) };

  revalidatePath("/admin/cycles");
  return { success: `Cycle "${name}" created as Draft. Open it when you're ready.` };
}

// Allowed moves: draft -> open, open -> closed, closed -> open (reopen).
const allowed: Record<CycleStatus, CycleStatus[]> = {
  draft: ["open"],
  open: ["closed"],
  closed: ["open"],
};

export async function setCycleStatus(cycleId: string, next: CycleStatus, _prev: ActionState): Promise<ActionState> {
  await requireHr();
  const supabase = createUserClient();
  const { data: cycle } = await supabase.from("review_cycles").select("status").eq("id", cycleId).maybeSingle<{ status: CycleStatus }>();
  if (!cycle) return { error: "Cycle not found." };
  if (!allowed[cycle.status].includes(next)) return { error: `A ${cycle.status} cycle can't be moved to ${next}.` };

  const { error } = await supabase.from("review_cycles").update({ status: next }).eq("id", cycleId);
  if (error) {
    // The partial unique index review_cycles_only_one_open rejects a second open cycle.
    if (error.message.includes("review_cycles_only_one_open") || error.code === "23505") {
      return { error: "Another cycle is already open. Close it first. Only one cycle can be open at a time." };
    }
    return { error: error.message };
  }
  revalidatePath("/admin/cycles");
  revalidatePath("/dashboard");
  return {};
}
