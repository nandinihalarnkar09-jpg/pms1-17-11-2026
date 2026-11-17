import { notFound } from "next/navigation";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { loadRatedGoals } from "@/lib/reviews";
import { isUuid } from "@/lib/validation";
import type { Employee, Review, ReviewCycle } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { ReviewView } from "@/components/review-view";

type ReviewWithNames = Review & {
  employee: Pick<Employee, "full_name" | "designation"> | null;
  cycle: Pick<ReviewCycle, "name"> | null;
};

/**
 * Read-only view of one review, e.g. /reviews/<id>.
 * Try changing the id in the URL to someone else's review: Row Level Security
 * returns no row, so this page shows "Not found". Nothing leaks.
 */
export default async function ReviewDetailPage({ params }: PageProps<"/reviews/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const me = await requireMe();
  const supabase = createUserClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("*, employee:employees!reviews_employee_id_fkey(full_name, designation), cycle:review_cycles(name)")
    .eq("id", id)
    .maybeSingle<ReviewWithNames>();
  if (!review) notFound();

  const goals = await loadRatedGoals(supabase, review.employee_id, review.cycle_id, review.id);
  // The employee sees the manager's part only after completion. Their manager and HR can always see it.
  const isOwn = review.employee_id === me.id;
  const showManager = !isOwn || review.status === "completed";

  return (
    <>
      <PageHeader
        title={isOwn ? "My review" : `Review: ${review.employee?.full_name ?? "Employee"}`}
        description={`${review.cycle?.name ?? ""}${review.employee?.designation ? ` · ${review.employee.designation}` : ""}`}
      />
      <ReviewView review={review} goals={goals} showManager={showManager} />
    </>
  );
}
