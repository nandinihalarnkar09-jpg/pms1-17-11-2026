import Link from "next/link";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { getOpenCycle, summariseGoals } from "@/lib/data";
import { loadRatedGoals } from "@/lib/reviews";
import { formatDate, ratingText } from "@/lib/labels";
import type { Goal, Review, ReviewCycle } from "@/lib/types";
import { Card, EmptyState, PageHeader, ReviewStatusBadge, TextLink } from "@/components/ui";
import { ReviewView } from "@/components/review-view";
import { SelfAppraisalForm } from "./self-appraisal-form";

type PastReview = Review & { cycle: Pick<ReviewCycle, "name" | "end_date"> | null };

export default async function MyReviewPage() {
  const me = await requireMe();
  const supabase = createUserClient();
  const cycle = await getOpenCycle(supabase);

  // Completed reviews from earlier cycles: "view their own past reviews and ratings".
  const { data: past } = await supabase
    .from("reviews")
    .select("*, cycle:review_cycles(name, end_date)")
    .eq("employee_id", me.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });
  const history = ((past ?? []) as PastReview[]).filter((r) => r.cycle_id !== cycle?.id);

  return (
    <>
      <PageHeader title="My Review" description={cycle ? cycle.name : "Self-appraisal and past reviews"} />
      {cycle ? <CurrentReview meId={me.id} cycle={cycle} /> : (
        <EmptyState title="No review cycle is open">The self-appraisal opens once HR starts a review cycle and your goals are approved.</EmptyState>
      )}

      <h2 className="mb-3 mt-10 text-lg font-semibold text-slate-900">Past reviews</h2>
      {history.length === 0 ? (
        <p className="text-sm text-slate-500">No completed reviews from earlier cycles yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {history.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <div>
                <p className="font-medium text-slate-900">{r.cycle?.name}</p>
                <p className="text-xs text-slate-500">Completed {formatDate(r.reviewed_at)} · Overall: {ratingText(r.overall_manager_rating)}</p>
              </div>
              <TextLink href={`/reviews/${r.id}`}>View</TextLink>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

async function CurrentReview({ meId, cycle }: { meId: string; cycle: ReviewCycle }) {
  const supabase = createUserClient();
  const [{ data: goalRows }, { data: review }] = await Promise.all([
    supabase.from("goals").select("status, weightage").eq("employee_id", meId).eq("cycle_id", cycle.id),
    supabase.from("reviews").select("*").eq("employee_id", meId).eq("cycle_id", cycle.id).maybeSingle<Review>(),
  ]);
  const summary = summariseGoals((goalRows ?? []) as Pick<Goal, "status" | "weightage">[]);

  if (!summary.allApproved) {
    return (
      <EmptyState title="Your goals need to be approved first" action={<Link href="/goals" className="text-sm font-medium text-indigo-700 hover:underline">Go to My Goals →</Link>}>
        You have {summary.count} goal(s): {summary.approved} approved, {summary.submitted} awaiting approval, {summary.draft} draft, {summary.sentBack} sent back. Total weightage {summary.total} / 100.
      </EmptyState>
    );
  }

  const goals = await loadRatedGoals(supabase, meId, cycle.id, review?.id ?? null);

  if (!review || review.status === "not_started") {
    return (
      <>
        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <ReviewStatusBadge status="not_started" />
            <p className="text-sm text-slate-600">Rate yourself against each approved goal. Be specific, because your manager reads this before writing their review.</p>
          </div>
        </Card>
        <SelfAppraisalForm goals={goals} overall={review?.overall_self_rating ?? null} />
      </>
    );
  }

  // Submitted: read-only. The manager's ratings appear only once the review is completed.
  return (
    <>
      {review.status !== "completed" && (
        <p className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Submitted. Your manager&apos;s ratings will appear here once they complete the review.
        </p>
      )}
      <ReviewView review={review} goals={goals} showManager={review.status === "completed"} />
    </>
  );
}
