import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { getSession } from "@/lib/session";
import { secondaryButtonClass } from "@/components/ui";

// Shown when someone signs in with Clerk but we can't match them to an employee.
export default async function NotSetUpPage() {
  const session = await getSession();
  if (session.me) redirect("/dashboard");

  const messages = {
    no_employee: {
      title: "Your account is not yet set up.",
      body: "Please contact HR. They need to add you as an employee using the same email address you signed in with.",
    },
    inactive: {
      title: "Your employee record is inactive.",
      body: "Please contact HR if you think this is a mistake.",
    },
    already_linked: {
      title: "This employee record is linked to a different login.",
      body: "Someone already signed in as this employee with another account. Please contact HR.",
    },
    token_rejected: {
      title: "Your account is linked, but the database rejected your login token.",
      body: "This is a setup problem, not something you did. The Clerk ↔ Supabase integration is not configured yet (Supabase → Authentication → Sign In / Providers → Third-Party Auth → Clerk).",
    },
  } as const;
  const m = messages[session.reason];

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">{m.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{m.body}</p>
        {session.email && (
          <p className="mt-3 text-xs text-slate-500">
            Signed in as <span className="font-mono">{session.email}</span>
          </p>
        )}
        {session.reason === "token_rejected" && session.detail && (
          <p className="mt-2 break-words font-mono text-xs text-red-600">{session.detail}</p>
        )}
        <div className="mt-5">
          <SignOutButton redirectUrl="/">
            <button className={secondaryButtonClass}>Sign out</button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
