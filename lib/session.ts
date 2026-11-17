import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createUserClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";
import type { Employee } from "./types";

/** The signed-in employee, plus how many people report to them. */
export type Me = Employee & { reportCount: number };

export type SessionResult =
  | { me: Me }
  | {
      me: null;
      reason: "no_employee" | "inactive" | "already_linked" | "token_rejected";
      email?: string;
      detail?: string;
    };

/**
 * Who is signed in, as an employee?
 *
 * 1. Ask Clerk for the signed-in user id.
 * 2. Look up the employee row whose clerk_user_id matches (through RLS).
 * 3. First sign-in only: no row matches yet, so find the row by the user's
 *    email address and save the Clerk id onto it (admin client, server-side).
 *
 * Runs on the SERVER: Clerk's secret key and Supabase's secret key never
 * reach the browser. `cache` makes it run once per request even though the
 * layout and the page both call it.
 */
export const getSession = cache(async (): Promise<SessionResult> => {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createUserClient();
  const first = await supabase
    .from("employees")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle<Employee>();

  if (first.data) return { me: await withReportCount(first.data) };

  // ---- First sign-in: link this Clerk user to an employee row by email ----
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email) return { me: null, reason: "no_employee" };

  const admin = createAdminClient();
  const { data: match } = await admin
    .from("employees")
    .select("id, clerk_user_id, is_active")
    .eq("email", email)
    .maybeSingle<{ id: string; clerk_user_id: string | null; is_active: boolean }>();

  if (!match) return { me: null, reason: "no_employee", email };
  if (!match.is_active) return { me: null, reason: "inactive", email };
  if (match.clerk_user_id && match.clerk_user_id !== userId) {
    return { me: null, reason: "already_linked", email };
  }
  if (!match.clerk_user_id) {
    await admin
      .from("employees")
      .update({ clerk_user_id: userId })
      .eq("id", match.id)
      .is("clerk_user_id", null);
  }

  // Read again through RLS. If the row is linked but still invisible, Supabase
  // is not accepting Clerk's token (the Clerk <-> Supabase integration is not
  // configured), so say that clearly instead of failing silently.
  const second = await supabase
    .from("employees")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle<Employee>();

  if (second.data) return { me: await withReportCount(second.data) };
  return {
    me: null,
    reason: "token_rejected",
    email,
    detail: second.error?.message ?? first.error?.message,
  };
});

async function withReportCount(employee: Employee): Promise<Me> {
  const supabase = createUserClient();
  const { count } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("manager_id", employee.id)
    .eq("is_active", true);
  return { ...employee, reportCount: count ?? 0 };
}

/** Use on every signed-in page: returns the employee or sends them to /not-set-up. */
export async function requireMe(): Promise<Me> {
  const session = await getSession();
  if (!session.me) redirect("/not-set-up");
  return session.me;
}

/** HR-only pages. Everyone else gets a 404, so the page's existence isn't revealed. */
export async function requireHr(): Promise<Me> {
  const me = await requireMe();
  if (me.role !== "hr_admin") notFound();
  return me;
}

export function isManager(me: Me): boolean {
  return me.reportCount > 0 || me.role === "manager";
}
