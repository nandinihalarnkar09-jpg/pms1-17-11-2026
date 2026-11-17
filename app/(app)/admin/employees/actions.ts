"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireHr } from "@/lib/session";
import { createUserClient } from "@/lib/supabase/server";
import { echo, isEmail, isUuid, isoDate, text } from "@/lib/validation";
import type { ActionState, Employee, Role } from "@/lib/types";

const ROLES: Role[] = ["employee", "manager", "hr_admin"];

type Parsed = {
  full_name: string;
  email: string;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  manager_id: string | null;
  role: Role;
  is_active: boolean;
};

function parse(formData: FormData): { error: string } | { value: Parsed } {
  const full_name = text(formData, "full_name");
  const email = text(formData, "email").toLowerCase();
  const doj = text(formData, "date_of_joining");
  const manager = text(formData, "manager_id");
  const role = text(formData, "role") as Role;

  if (!full_name) return { error: "Full name is required." };
  if (!isEmail(email)) return { error: "Enter a valid email address. It must match the email they will sign in with." };
  if (doj && !isoDate(doj)) return { error: "Date of joining is not a valid date." };
  if (manager && !isUuid(manager)) return { error: "Choose a manager from the list." };
  if (!ROLES.includes(role)) return { error: "Choose a role." };

  return {
    value: {
      full_name,
      email,
      designation: text(formData, "designation") || null,
      department: text(formData, "department") || null,
      date_of_joining: doj || null,
      manager_id: manager || null,
      role,
      is_active: formData.get("is_active") !== null,
    },
  };
}

/** Walk up the chain from the proposed manager. If we reach the employee, it's a loop. */
function createsLoop(all: Pick<Employee, "id" | "manager_id">[], employeeId: string, managerId: string | null) {
  const byId = new Map(all.map((e) => [e.id, e.manager_id]));
  let current = managerId;
  for (let i = 0; current && i < 1000; i++) {
    if (current === employeeId) return true;
    current = byId.get(current) ?? null;
  }
  return false;
}

/** A person chosen as someone's manager gets the 'manager' role if they were a plain employee. */
async function promoteManager(managerId: string | null) {
  if (!managerId) return;
  const supabase = createUserClient();
  await supabase.from("employees").update({ role: "manager" }).eq("id", managerId).eq("role", "employee");
}

function friendly(message: string) {
  if (message.includes("employees_email_key") || message.includes("duplicate key")) {
    return "An employee with this email already exists.";
  }
  return message;
}

export async function createEmployee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireHr();
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, fields: echo(formData) };

  const supabase = createUserClient();
  const { error } = await supabase.from("employees").insert(parsed.value);
  if (error) return { error: friendly(error.message), fields: echo(formData) };
  await promoteManager(parsed.value.manager_id);

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}

export async function updateEmployee(employeeId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireHr();
  const parsed = parse(formData);
  if ("error" in parsed) return { error: parsed.error, fields: echo(formData) };
  if (parsed.value.manager_id === employeeId) return { error: "Someone can't be their own manager.", fields: echo(formData) };

  const supabase = createUserClient();
  const { data: all } = await supabase.from("employees").select("id, manager_id");
  if (createsLoop((all ?? []) as Employee[], employeeId, parsed.value.manager_id)) {
    return { error: "That manager reports (directly or indirectly) to this person. That would create a loop.", fields: echo(formData) };
  }

  const { error } = await supabase.from("employees").update(parsed.value).eq("id", employeeId);
  if (error) return { error: friendly(error.message), fields: echo(formData) };
  await promoteManager(parsed.value.manager_id);

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}
