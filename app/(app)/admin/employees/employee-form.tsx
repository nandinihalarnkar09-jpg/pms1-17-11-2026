"use client";

import { useActionState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, inputClass, labelClass, secondaryButtonClass } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/labels";
import type { ActionState, Employee } from "@/lib/types";

export function EmployeeForm({
  action,
  employee,
  managers,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  employee?: Employee;
  managers: Pick<Employee, "id" | "full_name" | "designation">[];
}) {
  const [state, formAction] = useActionState(action, {});
  const f = state.fields;
  const v = (key: keyof Employee) => f?.[key] ?? (employee?.[key] as string | null | undefined) ?? "";

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className={labelClass}>Full name</label>
          <input id="full_name" name="full_name" required className={inputClass} defaultValue={v("full_name")} />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Work email</label>
          <input id="email" name="email" type="email" required className={inputClass} defaultValue={v("email")} />
          <p className="mt-1 text-xs text-slate-500">They must sign in with exactly this email.</p>
        </div>
        <div>
          <label htmlFor="designation" className={labelClass}>Designation</label>
          <input id="designation" name="designation" className={inputClass} defaultValue={v("designation")} />
        </div>
        <div>
          <label htmlFor="department" className={labelClass}>Department</label>
          <input id="department" name="department" className={inputClass} defaultValue={v("department")} />
        </div>
        <div>
          <label htmlFor="date_of_joining" className={labelClass}>Date of joining</label>
          <input id="date_of_joining" name="date_of_joining" type="date" className={inputClass} defaultValue={v("date_of_joining")} />
        </div>
        <div>
          <label htmlFor="manager_id" className={labelClass}>Manager</label>
          <select key={`m-${v("manager_id")}`} id="manager_id" name="manager_id" className={inputClass} defaultValue={v("manager_id")}>
            <option value="">No manager</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}{m.designation ? ` · ${m.designation}` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="role" className={labelClass}>Role</label>
          <select key={`r-${v("role")}`} id="role" name="role" className={inputClass} defaultValue={v("role") || "employee"}>
            {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">Anyone chosen as a manager is upgraded to Manager automatically.</p>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input id="is_active" name="is_active" type="checkbox" className="h-4 w-4 rounded border-slate-300"
            defaultChecked={f ? f.is_active === "on" : employee ? employee.is_active : true} />
          <label htmlFor="is_active" className="text-sm text-slate-700">Active</label>
        </div>
      </div>
      <FormMessage error={state.error} />
      <div className="flex gap-2">
        <SubmitButton>{employee ? "Save changes" : "Add employee"}</SubmitButton>
        <Link href="/admin/employees" className={secondaryButtonClass}>Cancel</Link>
      </div>
    </form>
  );
}
