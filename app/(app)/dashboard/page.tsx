import Link from "next/link";
import { isManager, requireMe, type Me } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { buildProgressRows, getOpenCycle, nextStepForEmployee, summariseGoals, type ProgressReview } from "@/lib/data";
import { loadReport } from "@/lib/report";
import { REVIEW_STATUS_LABELS, REVIEW_STATUS_ORDER, formatDate } from "@/lib/labels";
import type { Employee, Goal, Review, ReviewCycle } from "@/lib/types";
import { Card, EmptyState, PageHeader, ProgressBar, ReviewStatusBadge, Stat, TextLink, buttonClass } from "@/components/ui";

// One landing page, three views. Everyone sees their own progress; managers also
// see their team; HR also sees the whole company.
export default async function DashboardPage() {
  const me = await requireMe();
  const supabase = createUserClient();
  const cycle = await getOpenCycle(supabase);

  return (
    <>
      <PageHeader
        title={`Hello, ${me.full_name.split(" ")[0]}`}
        description={cycle ? <>Open cycle: <strong>{cycle.name}</strong> · {formatDate(cycle.start_date)} – {formatDate(cycle.end_date)}</> : "No review cycle is open right now."}
      />
      <div className="space-y-8">
        {me.role === "hr_admin" && <CompanySection cycle={cycle} />}
        {isManager(me) && <TeamSection me={me} cycle={cycle} />}
        <MySection me={me} cycle={cycle} />
      </div>
    </>
  );
}

async function MySection({ me, cycle }: { me: Me; cycle: ReviewCycle | null }) {
  const supabase = createUserClient();
  const [{ data: goals }, { data: review }] = cycle
    ? await Promise.all([
        supabase.from("goals").select("status, weightage").eq("employee_id", me.id).eq("cycle_id", cycle.id),
        supabase.from("reviews").select("status").eq("employee_id", me.id).eq("cycle_id", cycle.id).maybeSingle<Pick<Review, "status">>(),
      ])
    : [{ data: [] }, { data: null }];
  const summary = summariseGoals((goals ?? []) as Pick<Goal, "status" | "weightage">[]);
  const reviewStatus = review?.status ?? "not_started";
  const next = nextStepForEmployee(cycle, summary, reviewStatus);

  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-slate-900">My progress</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2" title="Next step">
          <p className="text-sm text-slate-700">{next.text}</p>
          {next.href && <Link href={next.href} className={`${buttonClass} mt-4`}>{next.cta}</Link>}
        </Card>
        <Card title="This cycle">
          {cycle ? (
            <div className="space-y-3 text-sm">
              <ProgressBar value={summary.total} label={`Goals: ${summary.total} / 100 weightage`} />
              <p className="text-slate-600">{summary.count} goal(s) · {summary.approved} approved{summary.submitted ? ` · ${summary.submitted} awaiting approval` : ""}{summary.sentBack ? ` · ${summary.sentBack} sent back` : ""}</p>
              <div className="flex items-center gap-2"><span className="text-slate-600">Review:</span> <ReviewStatusBadge status={reviewStatus} /></div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Nothing to do until a cycle opens.</p>
          )}
        </Card>
      </div>
    </section>
  );
}

async function TeamSection({ me, cycle }: { me: Me; cycle: ReviewCycle | null }) {
  const supabase = createUserClient();
  const { data: reports } = await supabase.from("employees").select("*").eq("manager_id", me.id).eq("is_active", true).order("full_name");
  const team = (reports ?? []) as Employee[];
  if (team.length === 0) return null;

  const ids = team.map((t) => t.id);
  const [{ data: goals }, { data: reviews }] = cycle
    ? await Promise.all([
        supabase.from("goals").select("employee_id, status, weightage").eq("cycle_id", cycle.id).in("employee_id", ids),
        supabase.from("reviews").select("id, employee_id, status, overall_self_rating, overall_manager_rating").eq("cycle_id", cycle.id).in("employee_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const rows = buildProgressRows(team, (goals ?? []) as Goal[], (reviews ?? []) as ProgressReview[]);
  const completed = rows.filter((r) => r.reviewStatus === "completed").length;
  const actions = rows.filter((r) => r.goals.submitted > 0 || r.reviewStatus === "self_submitted" || r.reviewStatus === "manager_reviewed");

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">My team</h2>
        <TextLink href="/team">View team →</TextLink>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Team completion">
          <ProgressBar value={completed} max={rows.length} label={`${completed} of ${rows.length} reviews completed`} />
        </Card>
        <Card className="md:col-span-2" title="Needs your action">
          {actions.length === 0 ? (
            <p className="text-sm text-slate-600">Nothing waiting on you right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {actions.map((r) => (
                <li key={r.employee.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <span className="font-medium text-slate-900">{r.employee.full_name}</span>
                  <span className="text-slate-600">
                    {r.goals.submitted > 0 ? `${r.goals.submitted} goal(s) to approve` : r.reviewStatus === "self_submitted" ? "Self-appraisal ready to review" : "Review saved, not completed"}
                  </span>
                  <TextLink href={`/team/${r.employee.id}`}>Open</TextLink>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}

async function CompanySection({ cycle }: { cycle: ReviewCycle | null }) {
  if (!cycle) {
    return (
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Company</h2>
        <EmptyState title="No cycle is open" action={<Link href="/admin/cycles" className={buttonClass}>Create or open a cycle</Link>}>
          Open a review cycle so employees can start adding goals.
        </EmptyState>
      </section>
    );
  }
  const { rows } = await loadReport(createUserClient(), cycle.id);
  const count = (s: (typeof REVIEW_STATUS_ORDER)[number]) => rows.filter((r) => r.reviewStatus === s).length;
  const withGoalsApproved = rows.filter((r) => r.goals.allApproved).length;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Company: {cycle.name}</h2>
        <TextLink href="/admin/report">Full report →</TextLink>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Active employees" value={rows.length} hint={`${withGoalsApproved} with goals approved`} />
        {REVIEW_STATUS_ORDER.map((s) => (
          <Stat key={s} label={REVIEW_STATUS_LABELS[s]} value={count(s)} />
        ))}
      </div>
      <Card className="mt-4">
        <ProgressBar value={count("completed")} max={rows.length} label="Reviews completed across the company" />
      </Card>
    </section>
  );
}
