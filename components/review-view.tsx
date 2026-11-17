// Read-only display of a review: each goal with the employee's self-rating and,
// when allowed, the manager's rating side by side.
import { ratingText, formatDate } from "@/lib/labels";
import type { Goal, GoalRating, Review } from "@/lib/types";
import { Card, ReviewStatusBadge } from "./ui";

export type RatedGoal = Pick<Goal, "id" | "title" | "description" | "weightage"> & {
  rating: GoalRating | null;
};

export function ReviewView({
  review,
  goals,
  showManager,
}: {
  review: Review;
  goals: RatedGoal[];
  showManager: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <ReviewStatusBadge status={review.status} />
        {review.submitted_at && <span>Self-appraisal submitted {formatDate(review.submitted_at)}</span>}
        {review.reviewed_at && <span>· Completed {formatDate(review.reviewed_at)}</span>}
      </div>

      {goals.map((g) => (
        <Card key={g.id} title={<>{g.title} <span className="font-normal text-slate-500">· {g.weightage}%</span></>}>
          <div className={`grid gap-4 ${showManager ? "md:grid-cols-2" : ""}`}>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Self-appraisal</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{ratingText(g.rating?.self_rating)}</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{g.rating?.self_comment || "—"}</p>
            </div>
            {showManager && (
              <div className="rounded-md bg-indigo-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Manager</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{ratingText(g.rating?.manager_rating)}</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{g.rating?.manager_comment || "—"}</p>
              </div>
            )}
          </div>
        </Card>
      ))}

      <Card title="Overall">
        <div className={`grid gap-4 ${showManager ? "md:grid-cols-2" : ""}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall self-rating</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{ratingText(review.overall_self_rating)}</p>
          </div>
          {showManager && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Overall manager rating</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{ratingText(review.overall_manager_rating)}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{review.manager_summary || "—"}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
