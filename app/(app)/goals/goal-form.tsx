"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import type { ActionState, Goal } from "@/lib/types";

/** Add a goal, or edit one (when `goal` is passed). Errors come back from the server action. */
export function GoalForm({
  action,
  goal,
  remaining,
  cycleStart,
  cycleEnd,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  goal?: Goal;
  remaining: number;
  cycleStart: string;
  cycleEnd: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const f = state.fields;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title" className={labelClass}>Title</label>
        <input id="title" name="title" required maxLength={200} className={inputClass}
          defaultValue={f?.title ?? goal?.title ?? ""}
          placeholder="e.g. Reduce post-release defects on billing from 12 to under 5 per quarter" />
      </div>
      <div>
        <label htmlFor="description" className={labelClass}>Description <span className="font-normal text-slate-500">(how you&apos;ll achieve and measure it)</span></label>
        <textarea id="description" name="description" rows={3} maxLength={2000} className={inputClass}
          defaultValue={f?.description ?? goal?.description ?? ""} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="weightage" className={labelClass}>Weightage (%)</label>
          <input id="weightage" name="weightage" type="number" required min={1} max={100} step={1} inputMode="numeric"
            className={inputClass} defaultValue={f?.weightage ?? goal?.weightage ?? ""} />
          <p className="mt-1 text-xs text-slate-500">{remaining} left to reach 100.</p>
        </div>
        <div>
          <label htmlFor="target_date" className={labelClass}>Target date</label>
          <input id="target_date" name="target_date" type="date" required min={cycleStart} max={cycleEnd}
            className={inputClass} defaultValue={f?.target_date ?? goal?.target_date ?? ""} />
        </div>
      </div>
      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton>{goal ? "Save changes" : "Add goal"}</SubmitButton>
        {goal && <Link href="/goals" className={secondaryButtonClass}>Cancel</Link>}
      </div>
    </form>
  );
}
