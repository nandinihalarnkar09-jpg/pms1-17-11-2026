import Link from "next/link";
import { requireHr } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { loadReport } from "@/lib/report";
import { RATING_LABELS, REVIEW_STATUS_LABELS, REVIEW_STATUS_ORDER, ratingText } from "@/lib/labels";
import type { ReviewStatus } from "@/lib/types";
import {
  EmptyState,
  PageHeader,
  ProgressBar,
  ReviewStatusBadge,
  Stat,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";

export default async function ReportPage({ searchParams }: PageProps<"/admin/report">) {
  await requireHr();
  const sp = await searchParams;
  const cycleId = typeof sp.cycle === "string" ? sp.cycle : undefined;
  const statusFilter = typeof sp.status === "string" ? (sp.status as ReviewStatus) : undefined;

  const supabase = createUserClient();
  const { cycles, cycle, rows } = await loadReport(supabase, cycleId);

  if (!cycle) {
    return (
      <>
        <PageHeader title="Completion report" />
        <EmptyState title="No cycles yet" action={<Link href="/admin/cycles" className={secondaryButtonClass}>Create a cycle</Link>} />
      </>
    );
  }

  const count = (s: ReviewStatus) => rows.filter((r) => r.reviewStatus === s).length;
  const completed = count("completed");
  const shown = statusFilter && REVIEW_STATUS_ORDER.includes(statusFilter) ? rows.filter((r) => r.reviewStatus === statusFilter) : rows;
  const distribution = [1, 2, 3, 4, 5].map((n) => ({
    n,
    count: rows.filter((r) => r.reviewStatus === "completed" && r.review?.overall_manager_rating === n).length,
  }));
  const maxDist = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <>
      <PageHeader
        title="Completion report"
        description={`${cycle.name} · ${rows.length} active employees`}
        action={
          <a href={`/api/report?cycle=${cycle.id}`} className={secondaryButtonClass}>
            Download CSV
          </a>
        }
      />

      <form className="mb-6 flex flex-wrap items-end gap-3" action="/admin/report">
        <div>
          <label htmlFor="cycle" className="mb-1 block text-xs font-medium text-slate-600">Cycle</label>
          <select id="cycle" name="cycle" defaultValue={cycle.id} className={inputClass}>
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-xs font-medium text-slate-600">Review status</label>
          <select id="status" name="status" defaultValue={statusFilter ?? ""} className={inputClass}>
            <option value="">All</option>
            {REVIEW_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{REVIEW_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className={secondaryButtonClass}>Apply</button>
      </form>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REVIEW_STATUS_ORDER.map((s) => (
          <Link key={s} href={`/admin/report?cycle=${cycle.id}&status=${s}`} className="block">
            <Stat label={REVIEW_STATUS_LABELS[s]} value={count(s)} />
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Company completion</p>
          <ProgressBar value={completed} max={rows.length} label={`${completed} of ${rows.length} reviews completed`} />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">Overall rating spread (completed reviews)</p>
          <ul className="space-y-1.5">
            {distribution.map((d) => (
              <li key={d.n} className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-40 shrink-0">{d.n} · {RATING_LABELS[d.n]}</span>
                <span className="h-2 rounded bg-indigo-500" style={{ width: `${(d.count / maxDist) * 60}%`, minWidth: d.count ? 6 : 0 }} />
                <span>{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState title="Nobody matches this filter" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Goals</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Self</th>
                <th className="px-4 py-3">Manager rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map(({ employee, goals, review, reviewStatus }) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3">
                    {review ? (
                      <Link href={`/reviews/${review.id}`} className="font-medium text-indigo-700 hover:underline">{employee.full_name}</Link>
                    ) : (
                      <span className="font-medium text-slate-900">{employee.full_name}</span>
                    )}
                    <p className="text-xs text-slate-500">{employee.designation ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">{employee.department ?? "—"}</td>
                  <td className="px-4 py-3">{employee.manager?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{goals.count === 0 ? "None" : `${goals.approved}/${goals.count} approved`}</td>
                  <td className="px-4 py-3"><ReviewStatusBadge status={reviewStatus} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">{ratingText(review?.overall_self_rating)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{ratingText(review?.overall_manager_rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
