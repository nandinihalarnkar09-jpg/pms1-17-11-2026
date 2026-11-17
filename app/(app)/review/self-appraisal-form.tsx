"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { RatingSelect } from "@/components/rating-select";
import { Card, FormMessage, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import type { RatedGoal } from "@/components/review-view";
import type { ActionState } from "@/lib/types";
import { saveSelfAppraisal } from "./actions";

/** One comment + rating per approved goal, then an overall rating. */
export function SelfAppraisalForm({ goals, overall }: { goals: RatedGoal[]; overall: number | null }) {
  const [state, formAction] = useActionState<ActionState, FormData>(saveSelfAppraisal, {});
  const f = state.fields;

  return (
    <form action={formAction} className="space-y-4">
      {goals.map((g, i) => (
        <Card key={g.id} title={<>{i + 1}. {g.title} <span className="font-normal text-slate-500">· {g.weightage}%</span></>}>
          {g.description && <p className="mb-3 whitespace-pre-line text-sm text-slate-600">{g.description}</p>}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label htmlFor={`comment_${g.id}`} className={labelClass}>What did you achieve? <span className="font-normal text-slate-500">(evidence, numbers, examples)</span></label>
              <textarea id={`comment_${g.id}`} name={`comment_${g.id}`} rows={4} maxLength={4000} className={inputClass}
                defaultValue={f?.[`comment_${g.id}`] ?? g.rating?.self_comment ?? ""} />
            </div>
            <div>
              <label htmlFor={`rating_${g.id}`} className={labelClass}>Self-rating</label>
              <RatingSelect id={`rating_${g.id}`} name={`rating_${g.id}`} defaultValue={f?.[`rating_${g.id}`] ?? g.rating?.self_rating} />
            </div>
          </div>
        </Card>
      ))}

      <Card title="Overall self-rating">
        <div className="max-w-sm">
          <label htmlFor="overall_self_rating" className={labelClass}>How would you rate your year overall?</label>
          <RatingSelect id="overall_self_rating" name="overall_self_rating" defaultValue={f?.overall_self_rating ?? overall} />
        </div>
      </Card>

      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="intent" value="save" className={secondaryButtonClass}>Save draft</SubmitButton>
        <SubmitButton name="intent" value="submit" pendingText="Submitting…">Submit to my manager</SubmitButton>
      </div>
      <p className="text-xs text-slate-500">After you submit, you can&apos;t change your answers. Your manager will see them next to their own review.</p>
    </form>
  );
}
