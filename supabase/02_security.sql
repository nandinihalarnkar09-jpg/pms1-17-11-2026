-- =====================================================================
-- 02_security.sql  —  Row Level Security (RLS)
-- Run this second, after 01_schema.sql.
--
-- How identity works:
--   Clerk signs the user in and issues a session token (a JWT).
--   The app sends that token to Supabase with every query.
--   Supabase verifies it and exposes its claims through auth.jwt().
--   The 'sub' claim is the Clerk user id, e.g. 'user_2abc...'.
--   We match it against employees.clerk_user_id to find "me".
--
-- Two words to know:
--   USING      = which existing rows you are allowed to see / touch
--   WITH CHECK = what a row is allowed to look like after you write it
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper functions
-- SECURITY DEFINER lets them read the employees table without being
-- blocked by employees' own RLS policies (which would loop forever).
-- They only ever answer questions about the CURRENT user.
-- ---------------------------------------------------------------------

-- My employee id (or null if this login is not linked to an employee)
create or replace function public.current_employee_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select e.id from public.employees e
  where e.clerk_user_id = (auth.jwt() ->> 'sub') and e.is_active
$$;

-- My manager's employee id
create or replace function public.current_manager_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select e.manager_id from public.employees e
  where e.clerk_user_id = (auth.jwt() ->> 'sub') and e.is_active
$$;

-- Am I an HR admin?
create or replace function public.is_hr_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.employees e
    where e.clerk_user_id = (auth.jwt() ->> 'sub') and e.is_active and e.role = 'hr_admin'
  )
$$;

-- Is this employee one of my direct reports?
create or replace function public.is_manager_of(emp uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.employees e
    where e.id = emp and e.manager_id = public.current_employee_id()
  )
$$;

-- Is this cycle currently open?
create or replace function public.cycle_is_open(c uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.review_cycles rc where rc.id = c and rc.status = 'open')
$$;

-- ---------------------------------------------------------------------
-- Table privileges
-- Signed-in users ('authenticated') may attempt reads/writes; RLS below
-- decides which rows. Anonymous visitors ('anon') get nothing at all.
-- ---------------------------------------------------------------------
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
revoke all on all tables in schema public from anon;

-- ---------------------------------------------------------------------
-- Turn RLS on. With RLS on and no matching policy, the answer is "no".
-- ---------------------------------------------------------------------
alter table public.employees     enable row level security;
alter table public.review_cycles enable row level security;
alter table public.goals         enable row level security;
alter table public.reviews       enable row level security;
alter table public.goal_ratings  enable row level security;

-- ---------------------------------------------------------------------
-- employees
-- ---------------------------------------------------------------------
create policy "employees: see self, my reports, my manager; HR sees all"
  on public.employees for select to authenticated
  using (
    id = (select public.current_employee_id())
    or manager_id = (select public.current_employee_id())
    or id = (select public.current_manager_id())
    or (select public.is_hr_admin())
  );

create policy "employees: HR adds"
  on public.employees for insert to authenticated
  with check ((select public.is_hr_admin()));

create policy "employees: HR edits"
  on public.employees for update to authenticated
  using ((select public.is_hr_admin()))
  with check ((select public.is_hr_admin()));

-- No delete policy: people are deactivated (is_active = false), never deleted,
-- so their review history survives.

-- ---------------------------------------------------------------------
-- review_cycles
-- ---------------------------------------------------------------------
create policy "cycles: every signed-in user can see cycles"
  on public.review_cycles for select to authenticated
  using (true);

create policy "cycles: HR creates"
  on public.review_cycles for insert to authenticated
  with check ((select public.is_hr_admin()));

create policy "cycles: HR updates"
  on public.review_cycles for update to authenticated
  using ((select public.is_hr_admin()))
  with check ((select public.is_hr_admin()));

-- ---------------------------------------------------------------------
-- goals
-- ---------------------------------------------------------------------
create policy "goals: owner, owner's manager and HR can see"
  on public.goals for select to authenticated
  using (
    employee_id = (select public.current_employee_id())
    or public.is_manager_of(employee_id)
    or (select public.is_hr_admin())
  );

create policy "goals: owner creates drafts in the open cycle"
  on public.goals for insert to authenticated
  with check (
    employee_id = (select public.current_employee_id())
    and status = 'draft'
    and public.cycle_is_open(cycle_id)
  );

-- The owner may edit a draft or sent-back goal and submit it,
-- but can never set it to 'approved' themselves.
create policy "goals: owner edits and submits"
  on public.goals for update to authenticated
  using (
    employee_id = (select public.current_employee_id())
    and status in ('draft', 'sent_back')
    and public.cycle_is_open(cycle_id)
  )
  with check (
    employee_id = (select public.current_employee_id())
    and status in ('draft', 'sent_back', 'submitted')
    and public.cycle_is_open(cycle_id)
  );

-- The manager may only act on submitted goals, and only approve or send back.
create policy "goals: manager approves or sends back"
  on public.goals for update to authenticated
  using (public.is_manager_of(employee_id) and status = 'submitted')
  with check (public.is_manager_of(employee_id) and status in ('approved', 'sent_back'));

create policy "goals: owner deletes drafts"
  on public.goals for delete to authenticated
  using (
    employee_id = (select public.current_employee_id())
    and status in ('draft', 'sent_back')
  );

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create policy "reviews: employee, their manager and HR can see"
  on public.reviews for select to authenticated
  using (
    employee_id = (select public.current_employee_id())
    or public.is_manager_of(employee_id)
    or (select public.is_hr_admin())
  );

create policy "reviews: employee starts their own review"
  on public.reviews for insert to authenticated
  with check (
    employee_id = (select public.current_employee_id())
    and manager_id is not distinct from (select public.current_manager_id())
    and status = 'not_started'
    and public.cycle_is_open(cycle_id)
  );

-- The employee can only move their review to 'self_submitted', and can never
-- write the manager's fields.
create policy "reviews: employee saves and submits self-appraisal"
  on public.reviews for update to authenticated
  using (
    employee_id = (select public.current_employee_id())
    and status = 'not_started'
    and public.cycle_is_open(cycle_id)
  )
  with check (
    employee_id = (select public.current_employee_id())
    and status in ('not_started', 'self_submitted')
    and overall_manager_rating is null
    and manager_summary is null
    and reviewed_at is null
    and public.cycle_is_open(cycle_id)
  );

-- The manager can act only after the self-appraisal is in, and can only move
-- it forward to 'manager_reviewed' or 'completed'. They record themselves as
-- the reviewer.
create policy "reviews: manager reviews and completes"
  on public.reviews for update to authenticated
  using (
    public.is_manager_of(employee_id)
    and status in ('self_submitted', 'manager_reviewed')
  )
  with check (
    public.is_manager_of(employee_id)
    and status in ('manager_reviewed', 'completed')
    and manager_id = (select public.current_employee_id())
  );

-- ---------------------------------------------------------------------
-- goal_ratings
-- "You can see a rating line if you can see the review it belongs to."
-- The subquery on reviews is itself filtered by the reviews policies.
-- ---------------------------------------------------------------------
create policy "goal_ratings: visible with their review"
  on public.goal_ratings for select to authenticated
  using (exists (select 1 from public.reviews r where r.id = review_id));

create policy "goal_ratings: employee adds self ratings"
  on public.goal_ratings for insert to authenticated
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.employee_id = (select public.current_employee_id())
        and r.status = 'not_started'
    )
    and exists (
      select 1 from public.goals g
      where g.id = goal_id
        and g.employee_id = (select public.current_employee_id())
        and g.status = 'approved'
    )
    and manager_rating is null
    and manager_comment is null
  );

create policy "goal_ratings: employee edits self ratings"
  on public.goal_ratings for update to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.employee_id = (select public.current_employee_id())
        and r.status = 'not_started'
    )
  )
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and r.employee_id = (select public.current_employee_id())
        and r.status = 'not_started'
    )
    and manager_rating is null
    and manager_comment is null
  );

create policy "goal_ratings: manager adds manager ratings"
  on public.goal_ratings for update to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and public.is_manager_of(r.employee_id)
        and r.status in ('self_submitted', 'manager_reviewed')
    )
  )
  with check (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and public.is_manager_of(r.employee_id)
        and r.status in ('self_submitted', 'manager_reviewed')
    )
  );
