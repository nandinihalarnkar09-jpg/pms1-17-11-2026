import { requireHr } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import type { Employee } from "@/lib/types";
import { Card, PageHeader } from "@/components/ui";
import { EmployeeForm } from "../employee-form";
import { createEmployee } from "../actions";

export default async function NewEmployeePage() {
  await requireHr();
  const supabase = createUserClient();
  const { data } = await supabase.from("employees").select("id, full_name, designation").eq("is_active", true).order("full_name");
  return (
    <>
      <PageHeader title="Add employee" description="They'll be linked to their login the first time they sign in with this email." />
      <Card className="max-w-3xl">
        <EmployeeForm action={createEmployee} managers={(data ?? []) as Employee[]} />
      </Card>
    </>
  );
}
