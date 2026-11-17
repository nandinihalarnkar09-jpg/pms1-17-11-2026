"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** The navigation links. A client component only so it can highlight the current page. */
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Main">
      <ul className="flex gap-1 whitespace-nowrap">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  active ? "bg-indigo-50 text-indigo-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
