-- =====================================================================
-- 04_reset_demo.sql  —  Clear rehearsal data before the real demo.
-- Deletes all cycles, goals, reviews and ratings. KEEPS the employees
-- (and their linked logins), so everyone can still sign in.
-- Run in the Supabase SQL Editor. This cannot be undone.
-- =====================================================================

begin;
delete from public.goal_ratings;
delete from public.reviews;
delete from public.goals;
delete from public.review_cycles;
commit;

-- Should print four zeros
select
  (select count(*) from public.review_cycles) as cycles,
  (select count(*) from public.goals)         as goals,
  (select count(*) from public.reviews)       as reviews,
  (select count(*) from public.goal_ratings)  as goal_ratings;
