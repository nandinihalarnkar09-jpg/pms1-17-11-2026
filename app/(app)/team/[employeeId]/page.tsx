import { notFound } from "next/navigation";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { getOpenCycle, summariseGoals } from "@/lib/data";
import { loadRatedGoals } from "@/lib/reviews";
import { formatDate } from "@/lib/labels";
import { isUuid } from "@/lib/validation";
import type { Employee, Goal, Review } from "@/lib/types";
import { Card, EmptyState, GoalStatusBadge, PageHeader, ReviewStatusBadge } from "@/components/ui";
import { ReviewView } from "@/components/review-view";
import { approveAllGoals, approveGoal, saveManagerReview, sendBackGoal } from "../actions";
import { SendBackForm } from "./send-back-form";
import { ManagerReviewForm } from "./manager-review-form";
import { SubmitButton } from "@/components/submit-button";

export default async function TeamMemberPage({ params }: PageProps<"/team/[employeeId]">) {
  const { employeeId } = await params;
  if (!isUuid(employeeId)) notFound();
  const me = await requireMe();
  const supabase = createUserClient();

  // Only your direct reports. Anyone else's id in the URL shows "Not found".
  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("manager_id", me.id)
    .maybeSingle<Employee>();
  if (!employee) notFound();

  const cycle = await getOpenCycle(supabase);
  if (!cycle) {
    return (
      <>
        <PageHeader title={employee.full_name} description={employee.designation ?? undefined} />
        <EmptyState title="No review cycle is open" />
      </>
    );
  }

  const [{ data: goalRows }, { data: review }] = await Promise.all([
    supabase.from("goals").select("*").eq("employee_id", employeeId).eq("cycle_id", cycle.id).order("created_at"),
    supabase.from("reviews").select("*").eq("employee_id", employeeId).eq("cycle_id", cycle.id).maybeSingle<Review>(),
  ]);
  const goals = (goalRows ?? []) as Goal[];
  const summary = summariseGoals(goals);
  const reviewStatus = review?.status ?? "not_started";
  const ratedGoals = review ? await loadRatedGoals(supabase, employeeId, cycle.id, review.id) : [];

  return (
    <>
      <PageHeader
        title={employee.full_name}
        description={<>{employee.designation ?? "—"} · {employee.department ?? "—"} · {cycle.name}</>}
        action={<ReviewStatusBadge status={reviewStatus} />}
      />

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Goals <span className="text-sm font-normal text-slate-500">· total {summary.total} / 100</span></h2>
          {summary.submitted > 1 && (
            <form action={approveAllGoals.bind(null, employeeId)}>
              <SubmitButton pendingText="Approving…">Approve all {summary.submitted} submitted</SubmitButton>
            </form>
          )}
        </div>
        {goals.length === 0 ? (
          <EmptyState title="No goals yet">{employee.full_name} hasn&apos;t added any goals for this cycle.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {goals.map((g) => (
              <li key={g.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-medium text-slate-900">{g.title}</h3>
                  <GoalStatusBadge status={g.status} />
                </div>
                {g.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{g.description}</p>}
                <p className="mt-2 text-xs text-slate-500">Weightage <strong className="text-slate-700">{g.weightage}%</strong> · Target {formatDate(g.target_date)}</p>
                {g.status === "sent_back" && g.manager_comment && (
                  <p className="mt-2 text-sm text-amber-800">Your comment: {g.manager_comment}</p>
                )}
                {g.status === "submitted" && (
                  <div className="mt-3 flex flex-wrap items-start gap-2">
                    <form action={approveGoal.bind(null, employeeId, g.id)}>
                      <SubmitButton pendingText="Approving…">Approve</SubmitButton>
                    </form>
                    <SendBackForm action={sendBackGoal.bind(null, employeeId, g.id)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="review">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Review</h2>
        {!review || review.status === "not_started" ? (
          <EmptyState title="Waiting for the self-appraisal">
            {summary.allApproved
              ? `${employee.full_name}'s goals are approved. You can review once they submit their self-appraisal.`
              : "Goals need to be submitted and approved first."}
          </EmptyState>
        ) : review.status === "completed" ? (
          <ReviewView review={review} goals={ratedGoals} showManager />
        ) : (
          <ManagerReviewForm
            action={saveManagerReview.bind(null, employeeId, review.id)}
            goals={ratedGoals}
            review={review}
            employeeName={employee.full_name}
          />
        )}
      </section>
      {review?.submitted_at && (
        <Card className="mt-6">
          <p className="text-xs text-slate-500">Self-appraisal submitted {formatDate(review.submitted_at)}{review.reviewed_at ? ` · Review completed ${formatDate(review.reviewed_at)}` : ""}</p>
        </Card>
      )}
    </>
  );
}
