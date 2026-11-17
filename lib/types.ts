// TypeScript shapes for the five database tables (see supabase/01_schema.sql).

export type Role = "employee" | "manager" | "hr_admin";

export type Employee = {
  id: string;
  clerk_user_id: string | null;
  full_name: string;
  email: string;
  designation: string | null;
  department: string | null;
  date_of_joining: string | null;
  manager_id: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
};

export type CycleStatus = "draft" | "open" | "closed";

export type ReviewCycle = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  created_by: string | null;
  created_at: string;
};

export type GoalStatus = "draft" | "submitted" | "approved" | "sent_back";

export type Goal = {
  id: string;
  employee_id: string;
  cycle_id: string;
  title: string;
  description: string | null;
  weightage: number;
  target_date: string;
  status: GoalStatus;
  manager_comment: string | null;
  created_at: string;
};

export type ReviewStatus =
  | "not_started"
  | "self_submitted"
  | "manager_reviewed"
  | "completed";

export type Review = {
  id: string;
  employee_id: string;
  manager_id: string | null;
  cycle_id: string;
  status: ReviewStatus;
  overall_self_rating: number | null;
  overall_manager_rating: number | null;
  manager_summary: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type GoalRating = {
  id: string;
  review_id: string;
  goal_id: string;
  self_comment: string | null;
  self_rating: number | null;
  manager_comment: string | null;
  manager_rating: number | null;
  created_at: string;
};

// What every form's server action returns, so the form can show a message.
export type ActionState = {
  error?: string;
  success?: string;
  // Echo of submitted values so a form can keep what the user typed after an error.
  fields?: Record<string, string>;
};
