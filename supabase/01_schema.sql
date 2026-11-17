-- =====================================================================
-- 01_schema.sql  —  Tables for the Performance Management System
-- Run this first in the Supabase SQL Editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- employees
-- One table for everyone. A "manager" is just an employee whose id
-- appears in someone else's manager_id. That self-reference is what
-- builds the reporting hierarchy.
-- ---------------------------------------------------------------------
create table public.employees (
  id               uuid primary key default gen_random_uuid(),
  clerk_user_id    text unique,                       -- filled on first sign-in
  full_name        text not null check (length(trim(full_name)) > 0),
  email            text not null unique
                     check (email = lower(email) and position('@' in email) > 1),
  designation      text,
  department       text,
  date_of_joining  date,
  -- FK to the same table: "who does this person report to?"
  -- on delete set null: if a manager row were ever deleted, reports keep their record.
  manager_id       uuid references public.employees (id) on delete set null,
  role             text not null default 'employee'
                     check (role in ('employee', 'manager', 'hr_admin')),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  constraint employees_not_own_manager check (manager_id is null or manager_id <> id)
);

create index employees_manager_id_idx on public.employees (manager_id);

-- ---------------------------------------------------------------------
-- review_cycles
-- A time-bound period, e.g. "FY 2026–27 Annual". draft -> open -> closed.
-- ---------------------------------------------------------------------
create table public.review_cycles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  -- FK: which HR admin created the cycle (kept for the audit trail).
  created_by  uuid references public.employees (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint review_cycles_dates_valid check (end_date > start_date)
);

-- Only ONE cycle may be open at a time. A partial unique index enforces
-- this in the database, so even a buggy screen cannot open two.
create unique index review_cycles_only_one_open
  on public.review_cycles (status) where status = 'open';

-- ---------------------------------------------------------------------
-- goals
-- The PLAN: what the employee intends to achieve this cycle.
-- Ratings are NOT stored here — they live in goal_ratings.
-- ---------------------------------------------------------------------
create table public.goals (
  id               uuid primary key default gen_random_uuid(),
  -- FK: whose goal this is.
  employee_id      uuid not null references public.employees (id),
  -- FK: which cycle it belongs to, so next year's goals never mix with this year's.
  cycle_id         uuid not null references public.review_cycles (id),
  title            text not null check (length(trim(title)) > 0),
  description      text,
  weightage        integer not null check (weightage between 1 and 100),
  target_date      date not null,
  status           text not null default 'draft'
                     check (status in ('draft', 'submitted', 'approved', 'sent_back')),
  manager_comment  text,                               -- reason when sent back
  created_at       timestamptz not null default now()
);

create index goals_employee_cycle_idx on public.goals (employee_id, cycle_id);

-- ---------------------------------------------------------------------
-- reviews
-- One row per employee per cycle. This row IS the workflow:
-- not_started -> self_submitted -> manager_reviewed -> completed
-- ---------------------------------------------------------------------
create table public.reviews (
  id                      uuid primary key default gen_random_uuid(),
  -- FK: the employee being reviewed.
  employee_id             uuid not null references public.employees (id),
  -- FK: the manager responsible for this review (a snapshot, so history
  -- still shows the right reviewer if the reporting line changes later).
  manager_id              uuid references public.employees (id) on delete set null,
  -- FK: the cycle this review belongs to.
  cycle_id                uuid not null references public.review_cycles (id),
  status                  text not null default 'not_started'
                            check (status in ('not_started', 'self_submitted',
                                              'manager_reviewed', 'completed')),
  overall_self_rating     smallint check (overall_self_rating between 1 and 5),
  overall_manager_rating  smallint check (overall_manager_rating between 1 and 5),
  manager_summary         text,
  submitted_at            timestamptz,                -- when the self-appraisal was submitted
  reviewed_at             timestamptz,                -- when the manager completed the review
  created_at              timestamptz not null default now(),
  constraint reviews_one_per_employee_per_cycle unique (employee_id, cycle_id)
);

create index reviews_cycle_idx on public.reviews (cycle_id);

-- ---------------------------------------------------------------------
-- goal_ratings
-- The OUTCOME, goal by goal: the line items behind a review.
-- ---------------------------------------------------------------------
create table public.goal_ratings (
  id               uuid primary key default gen_random_uuid(),
  -- FK: which review this line belongs to. Deleting a review deletes its lines.
  review_id        uuid not null references public.reviews (id) on delete cascade,
  -- FK: which goal is being rated.
  goal_id          uuid not null references public.goals (id) on delete cascade,
  self_comment     text,
  self_rating      smallint check (self_rating between 1 and 5),
  manager_comment  text,
  manager_rating   smallint check (manager_rating between 1 and 5),
  created_at       timestamptz not null default now(),
  constraint goal_ratings_one_per_goal unique (review_id, goal_id)
);
