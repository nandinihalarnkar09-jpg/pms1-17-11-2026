import Link from "next/link";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { buildProgressRows, getOpenCycle, type ProgressReview } from "@/lib/data";
import type { Employee, Goal } from "@/lib/types";
import { EmptyState, PageHeader, ReviewStatusBadge, Stat, secondaryButtonClass } from "@/components/ui";

export default async function MyTeamPage() {
  const me = await requireMe();
  const supabase = createUserClient();
  const cycle = await getOpenCycle(supabase);

  const { data: reports } = await supabase
    .from("employees")
    .select("*")
    .eq("manager_id", me.id)
    .eq("is_active", true)
    .order("full_name");
  const team = (reports ?? []) as Employee[];

  if (team.length === 0) {
    return (
      <>
        <PageHeader title="My Team" />
        <EmptyState title="Nobody reports to you yet">When HR sets you as someone&apos;s manager, they&apos;ll appear here.</EmptyState>
      </>
    );
  }

  const ids = team.map((t) => t.id);
  const [{ data: goals }, { data: reviews }] = cycle
    ? await Promise.all([
        supabase.from("goals").select("employee_id, status, weightage").eq("cycle_id", cycle.id).in("employee_id", ids),
        supabase.from("reviews").select("id, employee_id, status, overall_self_rating, overall_manager_rating").eq("cycle_id", cycle.id).in("employee_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const rows = buildProgressRows(team, (goals ?? []) as Goal[], (reviews ?? []) as ProgressReview[]);

  const needApproval = rows.filter((r) => r.goals.submitted > 0).length;
  const needReview = rows.filter((r) => r.reviewStatus === "self_submitted" || r.reviewStatus === "manager_reviewed").length;
  const completed = rows.filter((r) => r.reviewStatus === "completed").length;

  return (
    <>
      <PageHeader title="My Team" description={cycle ? cycle.name : "No review cycle is open"} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Goals to approve" value={needApproval} hint="people with submitted goals" />
        <Stat label="Reviews to write" value={needReview} hint="self-appraisals submitted" />
        <Stat label="Completed" value={`${completed} / ${rows.length}`} />
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Goals</th>
              <th className="px-4 py-3">Review status</th>
              <th className="px-4 py-3"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ employee, goals: g, reviewStatus }) => (
              <tr key={employee.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{employee.full_name}</p>
                  <p className="text-xs text-slate-500">{employee.designation ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {g.count === 0 ? "No goals yet" : `${g.approved}/${g.count} approved · ${g.total}%`}
                  {g.submitted > 0 && <span className="ml-2 font-medium text-blue-700">{g.submitted} to approve</span>}
                </td>
                <td className="px-4 py-3"><ReviewStatusBadge status={reviewStatus} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/team/${employee.id}`} className={secondaryButtonClass}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
