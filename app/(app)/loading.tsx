// Shown instantly while a signed-in page loads its data.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-48 rounded bg-slate-200" />
      <div className="h-4 w-72 rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-lg bg-slate-200" />
        <div className="h-24 rounded-lg bg-slate-200" />
        <div className="h-24 rounded-lg bg-slate-200" />
      </div>
      <div className="h-48 rounded-lg bg-slate-200" />
    </div>
  );
}
