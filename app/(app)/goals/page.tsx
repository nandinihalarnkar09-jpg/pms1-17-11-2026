import Link from "next/link";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { getOpenCycle, summariseGoals } from "@/lib/data";
import { formatDate } from "@/lib/labels";
import type { Goal, Review } from "@/lib/types";
import {
  Card,
  EmptyState,
  GoalStatusBadge,
  PageHeader,
  ProgressBar,
  dangerButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import { GoalForm } from "./goal-form";
import { SubmitGoalsForm } from "./submit-goals-form";
import { createGoal, deleteGoal } from "./actions";

export default async function MyGoalsPage() {
  const me = await requireMe();
  const supabase = createUserClient();
  const cycle = await getOpenCycle(supabase);

  if (!cycle) {
    return (
      <>
        <PageHeader title="My Goals" />
        <EmptyState title="No review cycle is open">
          Goals are set inside a review cycle. HR will open one, and then you can add your goals here.
        </EmptyState>
      </>
    );
  }

  const [{ data: goalRows }, { data: review }] = await Promise.all([
    supabase.from("goals").select("*").eq("employee_id", me.id).eq("cycle_id", cycle.id).order("created_at"),
    supabase.from("reviews").select("status").eq("employee_id", me.id).eq("cycle_id", cycle.id).maybeSingle<Pick<Review, "status">>(),
  ]);
  const goals = (goalRows ?? []) as Goal[];
  const summary = summariseGoals(goals);
  const locked = !!review && review.status !== "not_started";
  const editable = (g: Goal) => !locked && (g.status === "draft" || g.status === "sent_back");
  const pendingCount = summary.draft + summary.sentBack;
  const canAdd = !locked && !summary.allApproved && summary.total < 100;

  return (
    <>
      <PageHeader
        title="My Goals"
        description={<>{cycle.name} · {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}</>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Weightage">
            <ProgressBar value={summary.total} label={`${summary.total} of 100 allocated`} />
            {summary.allApproved && (
              <p className="mt-3 text-sm text-emerald-700">
                All goals are approved. Next step: <Link href="/review" className="font-medium underline">complete your self-appraisal</Link>.
              </p>
            )}
            {locked && <p className="mt-3 text-sm text-slate-600">Your self-appraisal is submitted, so goals are locked.</p>}
          </Card>

          {goals.length === 0 ? (
            <EmptyState title="No goals yet">
              Add 3–5 goals using the form. Make each one specific and measurable, with a target date, and make the weightages add up to 100.
            </EmptyState>
          ) : (
            <ul className="space-y-3">
              {goals.map((g) => (
                <li key={g.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium text-slate-900">{g.title}</h3>
                    <GoalStatusBadge status={g.status} />
                  </div>
                  {g.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{g.description}</p>}
                  <p className="mt-2 text-xs text-slate-500">
                    Weightage <strong className="text-slate-700">{g.weightage}%</strong> · Target {formatDate(g.target_date)}
                  </p>
                  {g.status === "sent_back" && g.manager_comment && (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <strong>Manager&apos;s comment:</strong> {g.manager_comment}
                    </p>
                  )}
                  {editable(g) && (
                    <div className="mt-3 flex gap-2">
                      <Link href={`/goals/${g.id}/edit`} className={secondaryButtonClass}>Edit</Link>
                      <form action={deleteGoal.bind(null, g.id)}>
                        <button type="submit" className={dangerButtonClass}>Delete</button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!locked && pendingCount > 0 && (
            <Card title="Submit for approval">
              <SubmitGoalsForm total={summary.total} pendingCount={pendingCount} />
            </Card>
          )}
        </div>

        <div>
          {canAdd ? (
            <Card title="Add a goal">
              <GoalForm action={createGoal} remaining={100 - summary.total} cycleStart={cycle.start_date} cycleEnd={cycle.end_date} />
            </Card>
          ) : (
            !locked && !summary.allApproved && (
              <Card title="Add a goal">
                <p className="text-sm text-slate-600">You have allocated all 100. To add another goal, lower the weightage of a draft goal first.</p>
              </Card>
            )
          )}
          <Card title="Tips for a good goal" className="mt-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li><strong>Specific</strong>: name the system, client or process.</li>
              <li><strong>Measurable</strong>: include a number to hit.</li>
              <li><strong>Time-bound</strong>: set a target date inside the cycle.</li>
              <li>Give the most important goal the highest weightage.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
