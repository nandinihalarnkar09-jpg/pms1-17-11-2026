import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { buttonClass, secondaryButtonClass } from "@/components/ui";

const features = [
  {
    title: "Goals that add up",
    body: "Employees set weighted goals for the cycle. Weightages must total 100, and managers approve or send them back with a comment.",
  },
  {
    title: "Two views, side by side",
    body: "The employee writes a self-appraisal goal by goal. The manager reviews it next to their own ratings and writes the summary.",
  },
  {
    title: "One record, always findable",
    body: "HR runs the cycle, tracks who has and hasn't submitted, and every past review stays searchable for the next promotion discussion.",
  },
];

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight text-slate-900">
          PMS<span className="text-indigo-700">1</span>
        </span>
        <Show when="signed-in" fallback={<Link href="/sign-in" className={secondaryButtonClass}>Sign in</Link>}>
          <Link href="/dashboard" className={secondaryButtonClass}>Go to dashboard</Link>
        </Show>
      </header>

      <section className="py-16 sm:py-24">
        <p className="text-sm font-medium uppercase tracking-widest text-indigo-700">Performance Management System</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Run the whole appraisal cycle without email and Excel.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Goals, self-appraisals and manager reviews for a 200-person team, with every rating stored, searchable and secure.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Show when="signed-in" fallback={<Link href="/sign-in" className={buttonClass}>Sign in</Link>}>
            <Link href="/dashboard" className={buttonClass}>Open my dashboard</Link>
          </Show>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map((f, i) => (
          <div key={f.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-indigo-700">0{i + 1}</p>
            <h2 className="mt-2 text-base font-semibold text-slate-900">{f.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="mt-auto pt-16 text-xs text-slate-500">
        Built with Next.js, Clerk, Supabase, Resend and Vercel.
      </footer>
    </main>
  );
}
