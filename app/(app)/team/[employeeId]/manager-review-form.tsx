"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { RatingSelect } from "@/components/rating-select";
import { Card, FormMessage, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import type { RatedGoal } from "@/components/review-view";
import { ratingText } from "@/lib/labels";
import type { ActionState, Review } from "@/lib/types";

/** Self-appraisal on the left, manager input on the right, goal by goal. */
export function ManagerReviewForm({
  action,
  goals,
  review,
  employeeName,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  goals: RatedGoal[];
  review: Review;
  employeeName: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const f = state.fields;

  return (
    <form action={formAction} className="space-y-4">
      {goals.map((g, i) => (
        <Card key={g.id} title={<>{i + 1}. {g.title} <span className="font-normal text-slate-500">· {g.weightage}%</span></>}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{employeeName}&apos;s self-appraisal</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{ratingText(g.rating?.self_rating)}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{g.rating?.self_comment || "—"}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor={`mcomment_${g.id}`} className={labelClass}>Your comment</label>
                <textarea id={`mcomment_${g.id}`} name={`mcomment_${g.id}`} rows={3} maxLength={4000} className={inputClass}
                  defaultValue={f?.[`mcomment_${g.id}`] ?? g.rating?.manager_comment ?? ""} />
              </div>
              <div>
                <label htmlFor={`mrating_${g.id}`} className={labelClass}>Your rating</label>
                <RatingSelect id={`mrating_${g.id}`} name={`mrating_${g.id}`} defaultValue={f?.[`mrating_${g.id}`] ?? g.rating?.manager_rating} />
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Card title="Overall">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall self-rating</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{ratingText(review.overall_self_rating)}</p>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="overall_manager_rating" className={labelClass}>Overall rating</label>
              <RatingSelect id="overall_manager_rating" name="overall_manager_rating" defaultValue={f?.overall_manager_rating ?? review.overall_manager_rating} />
            </div>
            <div>
              <label htmlFor="manager_summary" className={labelClass}>Summary</label>
              <textarea id="manager_summary" name="manager_summary" rows={4} maxLength={6000} className={inputClass}
                defaultValue={f?.manager_summary ?? review.manager_summary ?? ""}
                placeholder="Strengths, areas to develop, and what you'd like to see next cycle." />
            </div>
          </div>
        </div>
      </Card>

      <FormMessage error={state.error} success={state.success} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="intent" value="save" className={secondaryButtonClass}>Save</SubmitButton>
        <SubmitButton name="intent" value="complete" pendingText="Completing…">Complete review</SubmitButton>
      </div>
      <p className="text-xs text-slate-500">Completing locks the review. {employeeName} can then read your ratings and summary.</p>
    </form>
  );
}
