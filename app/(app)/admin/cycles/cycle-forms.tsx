"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import type { ActionState, CycleStatus } from "@/lib/types";
import { createCycle, setCycleStatus } from "./actions";

export function CreateCycleForm() {
  const [state, formAction] = useActionState(createCycle, {});
  const f = state.fields;
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>Cycle name</label>
        <input id="name" name="name" required className={inputClass} placeholder="FY 2026–27 Annual" defaultValue={f?.name ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_date" className={labelClass}>Start date</label>
          <input id="start_date" name="start_date" type="date" required className={inputClass} defaultValue={f?.start_date ?? "2026-04-01"} />
        </div>
        <div>
          <label htmlFor="end_date" className={labelClass}>End date</label>
          <input id="end_date" name="end_date" type="date" required className={inputClass} defaultValue={f?.end_date ?? "2027-03-31"} />
        </div>
      </div>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton>Create cycle</SubmitButton>
    </form>
  );
}

const labels: Record<CycleStatus, { to: CycleStatus; label: string } | null> = {
  draft: { to: "open", label: "Open cycle" },
  open: { to: "closed", label: "Close cycle" },
  closed: { to: "open", label: "Reopen" },
};

export function CycleStatusButton({ cycleId, status }: { cycleId: string; status: CycleStatus }) {
  const move = labels[status]!;
  const [state, formAction] = useActionState<ActionState>(setCycleStatus.bind(null, cycleId, move.to), {});
  return (
    <form action={formAction} className="space-y-2">
      <SubmitButton className={secondaryButtonClass} pendingText="Updating…">{move.label}</SubmitButton>
      <FormMessage error={state.error} />
    </form>
  );
}
