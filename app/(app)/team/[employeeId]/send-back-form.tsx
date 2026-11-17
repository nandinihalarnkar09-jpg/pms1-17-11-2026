"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, inputClass, secondaryButtonClass } from "@/components/ui";
import type { ActionState } from "@/lib/types";

/** "Send back" opens a small form where a comment is required. */
export function SendBackForm({ action }: { action: (prev: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, {});

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={secondaryButtonClass}>
        Send back
      </button>
    );
  }
  return (
    <form action={formAction} className="w-full space-y-2">
      <label htmlFor="comment" className="sr-only">Comment</label>
      <textarea name="comment" id="comment" required minLength={5} rows={2} className={inputClass} placeholder="What should they change? (required)" />
      <FormMessage error={state.error} />
      <div className="flex gap-2">
        <SubmitButton pendingText="Sending…">Send back with comment</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className={secondaryButtonClass}>Cancel</button>
      </div>
    </form>
  );
}
