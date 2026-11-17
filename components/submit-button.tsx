"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { buttonClass } from "./ui";

/** A submit button that disables itself and shows a label while the form's action runs. */
export function SubmitButton({
  children,
  pendingText = "Saving…",
  className = buttonClass,
  name,
  value,
}: {
  children: ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  // When a form has two buttons (e.g. Save / Submit), only the clicked one shows "pending".
  const isThisButton = !name || data?.get(name) === value;
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={className}>
      {pending && isThisButton ? pendingText : children}
    </button>
  );
}
