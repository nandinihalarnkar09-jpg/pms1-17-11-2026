import { requireHr } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/labels";
import type { ReviewCycle } from "@/lib/types";
import { Card, CycleStatusBadge, EmptyState, PageHeader } from "@/components/ui";
import { CreateCycleForm, CycleStatusButton } from "./cycle-forms";

export default async function CyclesPage() {
  await requireHr();
  const supabase = createUserClient();
  const { data } = await supabase.from("review_cycles").select("*").order("start_date", { ascending: false });
  const cycles = (data ?? []) as ReviewCycle[];

  return (
    <>
      <PageHeader title="Review cycles" description="Only one cycle can be open at a time. Employees set goals and self-appraise in the open cycle." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {cycles.length === 0 ? (
            <EmptyState title="No cycles yet">Create your first cycle, then open it so employees can add goals.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {cycles.map((c) => (
                <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900">{c.name}</h3>
                      <CycleStatusBadge status={c.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{formatDate(c.start_date)} – {formatDate(c.end_date)}</p>
                  </div>
                  <CycleStatusButton cycleId={c.id} status={c.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <Card title="New cycle">
          <CreateCycleForm />
        </Card>
      </div>
    </>
  );
}
