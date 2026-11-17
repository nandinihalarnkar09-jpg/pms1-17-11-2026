"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage } from "@/components/ui";
import { submitGoals } from "./actions";

/** "Submit for approval" button. The server checks the total is exactly 100. */
export function SubmitGoalsForm({ total, pendingCount }: { total: number; pendingCount: number }) {
  const [state, formAction] = useActionState(submitGoals, {});
  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-slate-600">
        {pendingCount} goal(s) ready to submit. Current total: <strong className={total === 100 ? "text-emerald-700" : "text-amber-700"}>{total} / 100</strong>
      </p>
      <FormMessage error={state.error} success={state.success} />
      <SubmitButton pendingText="Submitting…">Submit goals for approval</SubmitButton>
    </form>
  );
}
