import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { NavLinks } from "@/components/nav-links";
import { Badge } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/labels";
import { isManager, requireMe } from "@/lib/session";

// Shell for every signed-in page. The navigation is built from the employee's
// role, so each role sees different menus.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const me = await requireMe();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/goals", label: "My Goals" },
    { href: "/review", label: "My Review" },
  ];
  if (isManager(me)) links.push({ href: "/team", label: "My Team" });
  if (me.role === "hr_admin") {
    links.push(
      { href: "/admin/employees", label: "Employees" },
      { href: "/admin/cycles", label: "Cycles" },
      { href: "/admin/report", label: "Report" },
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
              PMS<span className="text-indigo-700">1</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-900">{me.full_name}</p>
                <p className="text-xs text-slate-500">{me.designation ?? "—"}</p>
              </div>
              <Badge tone={me.role === "hr_admin" ? "indigo" : me.role === "manager" ? "blue" : "gray"}>
                {ROLE_LABELS[me.role]}
              </Badge>
              <UserButton />
            </div>
          </div>
          <div className="pb-2">
            <NavLinks links={links} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
