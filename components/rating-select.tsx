import { RATING_LABELS } from "@/lib/labels";
import { inputClass } from "./ui";

/** A 1–5 rating dropdown where every option shows its label. */
export function RatingSelect({
  id,
  name,
  defaultValue,
  required,
}: {
  id: string;
  name: string;
  defaultValue?: number | string | null;
  required?: boolean;
}) {
  return (
    // `key` re-creates the <select> when its default changes. React only applies a
    // select's defaultValue on first render, so without this a form reset after
    // "Save" would jump back to "Choose a rating…".
    <select
      key={String(defaultValue ?? "")}
      id={id}
      name={name}
      required={required}
      defaultValue={defaultValue ? String(defaultValue) : ""}
      className={inputClass}
    >
      <option value="">Choose a rating…</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n} · {RATING_LABELS[n]}
        </option>
      ))}
    </select>
  );
}
