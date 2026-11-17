// Small helpers that read and validate form fields on the server.
// Never trust the browser: these run again on the server even if the form
// already has `required` / `min` / `max` attributes.

export function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

/** Whole number in a range, or null if missing / not a number / out of range. */
export function intInRange(raw: string, min: number, max: number): number | null {
  if (!/^-?\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n >= min && n <= max ? n : null;
}

/** A rating on the 1–5 scale, or null. */
export function rating(raw: string): number | null {
  return intInRange(raw, 1, 5);
}

/** "YYYY-MM-DD" that is a real calendar date, or null. */
export function isoDate(raw: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === raw ? raw : null;
}

export function isEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

export function isUuid(raw: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw);
}

/** Collect the text fields of a form so it can be re-filled after an error. */
export function echo(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) out[key] = value;
  });
  return out;
}
