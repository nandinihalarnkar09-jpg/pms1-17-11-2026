import { notFound } from "next/navigation";
import { requireMe } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { getOpenCycle } from "@/lib/data";
import type { Goal } from "@/lib/types";
import { Card, PageHeader } from "@/components/ui";
import { GoalForm } from "../../goal-form";
import { updateGoal } from "../../actions";

export default async function EditGoalPage({ params }: PageProps<"/goals/[id]/edit">) {
  const { id } = await params;
  const me = await requireMe();
  const supabase = createUserClient();
  const cycle = await getOpenCycle(supabase);
  if (!cycle) notFound();

  const { data: goals } = await supabase.from("goals").select("*").eq("employee_id", me.id).eq("cycle_id", cycle.id);
  const goal = (goals as Goal[] | null)?.find((g) => g.id === id);
  // Only your own draft or sent-back goals can be edited. Anything else is "not found".
  if (!goal || (goal.status !== "draft" && goal.status !== "sent_back")) notFound();

  const othersTotal = (goals as Goal[]).filter((g) => g.id !== id).reduce((s, g) => s + g.weightage, 0);

  return (
    <>
      <PageHeader title="Edit goal" description={cycle.name} />
      <Card className="max-w-2xl">
        <GoalForm
          action={updateGoal.bind(null, goal.id)}
          goal={goal}
          remaining={100 - othersTotal - goal.weightage}
          cycleStart={cycle.start_date}
          cycleEnd={cycle.end_date}
        />
      </Card>
    </>
  );
}
