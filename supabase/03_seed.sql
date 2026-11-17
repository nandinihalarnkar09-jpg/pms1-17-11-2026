-- =====================================================================
-- 03_seed.sql  —  Test people so you can sign in as all three roles.
-- Run this third.
--
-- BEFORE RUNNING: change the manager's email to YOUR real email address,
-- the same one you used to sign up for Resend. On a free Resend account,
-- email can only be delivered to that address, and the manager is the
-- person who receives the "self-appraisal submitted" email.
--
-- The +clerk_test addresses are Clerk test accounts. In a Clerk
-- development instance, any email containing "+clerk_test" signs in with
-- the verification code 424242, and no real email is sent. That gives you
-- several test users without needing several inboxes.
--
-- Emails must be lowercase.
-- =====================================================================

with hr as (
  insert into public.employees (full_name, email, designation, department, date_of_joining, role)
  values ('Asha Rao', 'hr+clerk_test@example.com', 'HR Manager', 'People', '2021-04-01', 'hr_admin')
  returning id
),
mgr as (
  insert into public.employees (full_name, email, designation, department, date_of_joining, role)
  values ('Vikram Mehta', 'your.real.email@gmail.com', 'Engineering Manager', 'Engineering', '2020-07-15', 'manager')
  returning id
)
insert into public.employees (full_name, email, designation, department, date_of_joining, role, manager_id)
select v.full_name, v.email, v.designation, v.department, v.doj::date, 'employee', mgr.id
from mgr,
  (values
    ('Priya Sharma', 'priya+clerk_test@example.com', 'Software Engineer', 'Engineering', '2023-01-09'),
    ('Rahul Nair',   'rahul+clerk_test@example.com', 'QA Engineer',       'Engineering', '2024-06-03')
  ) as v(full_name, email, designation, department, doj);

-- Check the result: four rows, two of them reporting to Vikram.
select e.full_name, e.email, e.role, m.full_name as manager
from public.employees e
left join public.employees m on m.id = e.manager_id
order by e.role desc, e.full_name;
