"use client";

// Catches unexpected errors on signed-in pages so the user never sees a blank screen.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-white p-6">
      <h1 className="text-lg font-semibold text-slate-900">Something went wrong.</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page could not load. Try again. If it keeps happening, check the browser console and the Vercel logs.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-slate-500">Reference: {error.digest}</p>}
      <button onClick={reset} className="mt-4 rounded-md bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800">
        Try again
      </button>
    </div>
  );
}
