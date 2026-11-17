import { notFound } from "next/navigation";
import { requireHr } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";
import type { Employee } from "@/lib/types";
import { Card, PageHeader } from "@/components/ui";
import { EmployeeForm } from "../../employee-form";
import { updateEmployee } from "../../actions";

export default async function EditEmployeePage({ params }: PageProps<"/admin/employees/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  await requireHr();
  const supabase = createUserClient();
  const [{ data: employee }, { data: managers }] = await Promise.all([
    supabase.from("employees").select("*").eq("id", id).maybeSingle<Employee>(),
    supabase.from("employees").select("id, full_name, designation").eq("is_active", true).neq("id", id).order("full_name"),
  ]);
  if (!employee) notFound();
  return (
    <>
      <PageHeader title={`Edit ${employee.full_name}`} />
      <Card className="max-w-3xl">
        <EmployeeForm action={updateEmployee.bind(null, id)} employee={employee} managers={(managers ?? []) as Employee[]} />
      </Card>
    </>
  );
}
