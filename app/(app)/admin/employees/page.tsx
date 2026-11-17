import Link from "next/link";
import { requireHr } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/labels";
import type { Employee } from "@/lib/types";
import { Badge, EmptyState, PageHeader, buttonClass } from "@/components/ui";

type Row = Employee & { manager: { full_name: string } | null };

export default async function EmployeesPage() {
  await requireHr();
  const supabase = createUserClient();
  const { data } = await supabase
    .from("employees")
    .select("*, manager:employees!employees_manager_id_fkey(full_name)")
    .order("is_active", { ascending: false })
    .order("full_name");
  const employees = (data ?? []) as Row[];

  return (
    <>
      <PageHeader
        title="Employees"
        description={`${employees.filter((e) => e.is_active).length} active`}
        action={<Link href="/admin/employees/new" className={buttonClass}>Add employee</Link>}
      />
      {employees.length === 0 ? (
        <EmptyState title="No employees yet" action={<Link href="/admin/employees/new" className={buttonClass}>Add the first employee</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((e) => (
                <tr key={e.id} className={e.is_active ? "" : "text-slate-400"}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{e.full_name}</p>
                    <p className="text-xs text-slate-500">{e.email}</p>
                  </td>
                  <td className="px-4 py-3">{e.designation ?? "—"}</td>
                  <td className="px-4 py-3">{e.department ?? "—"}</td>
                  <td className="px-4 py-3">{e.manager?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[e.role]}</td>
                  <td className="px-4 py-3">
                    {e.is_active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}
                    {!e.clerk_user_id && e.is_active && <span className="ml-2 text-xs text-slate-500">not signed in yet</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/employees/${e.id}/edit`} className="font-medium text-indigo-700 hover:underline">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
