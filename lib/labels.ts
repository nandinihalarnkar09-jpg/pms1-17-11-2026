// Human-readable labels for statuses and ratings, used everywhere in the UI.
import type { CycleStatus, GoalStatus, ReviewStatus, Role } from "./types";

export const APP_NAME = "PMS1";

// 5-point scale with a label on every point (see RESEARCH.md section 5).
export const RATING_LABELS: Record<number, string> = {
  1: "Unsatisfactory",
  2: "Needs improvement",
  3: "Meets expectations",
  4: "Exceeds expectations",
  5: "Outstanding",
};

export function ratingText(rating: number | null | undefined): string {
  if (!rating) return "—";
  return `${rating} · ${RATING_LABELS[rating]}`;
}

export const ROLE_LABELS: Record<Role, string> = {
  employee: "Employee",
  manager: "Manager",
  hr_admin: "HR Admin",
};

export const CYCLE_STATUS_LABELS: Record<CycleStatus, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  sent_back: "Sent back",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  not_started: "Not Started",
  self_submitted: "Self-Appraisal Submitted",
  manager_reviewed: "Manager Reviewed",
  completed: "Completed",
};

export const REVIEW_STATUS_ORDER: ReviewStatus[] = [
  "not_started",
  "self_submitted",
  "manager_reviewed",
  "completed",
];

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  // Dates from Postgres arrive as "2027-03-31" (date) or ISO timestamps.
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
