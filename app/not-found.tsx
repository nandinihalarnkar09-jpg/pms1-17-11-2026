import Link from "next/link";

// Shown for unknown URLs, AND when someone opens a record they aren't allowed to see.
// We deliberately don't say "forbidden", so the URL doesn't reveal that the record exists.
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm font-semibold text-indigo-700">404</p>
        <h1 className="mt-2 text-xl font-semibold text-slate-900">Not found</h1>
        <p className="mt-2 text-sm text-slate-600">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
