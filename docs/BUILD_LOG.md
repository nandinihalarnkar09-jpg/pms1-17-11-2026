# Build log: lab manual steps → what was done → how to verify

## Part B: the first 8 steps

| Step | Done | How to verify |
|---|---|---|
| 1. Cursor installed | On your laptop (not part of the repo). | `node -v`, `npm -v`, `git --version` all print versions. |
| 2. New Next.js project | `create-next-app` 16.4 (TypeScript, Tailwind, ESLint, App Router), new folder, not inside the ATS repo. | Commit *"Scaffold Next.js 16 app…"* |
| 3. GitHub | Repo `pms1-17-11-2026`; `.env.local` is git-ignored. | No `.env.local` on GitHub; `git log` shows a feature-per-commit history. |
| 4. Vercel | Project imported from GitHub; every push to `main` redeploys. | Live URL opens on a phone. |
| 5. Supabase + tables | `supabase/01_schema.sql`, `02_security.sql`, `03_seed.sql` run in the SQL Editor. | Table Editor shows 5 tables and 4 employees. |
| 6. Employee directory + cycles | `/admin/employees`, `/admin/cycles` | HR can add an employee and open a cycle. |
| 7. Clerk login linked to an employee | `proxy.ts`, `lib/session.ts`; Clerk ↔ Supabase third-party auth enabled in both dashboards. | Signing in as HR shows admin menus; an employee doesn't see them; `/dashboard` while signed out redirects to sign-in. |
| 8. Email | Resend sending-only key; `lib/email.ts`; `/api/test-email` | Sign in as the manager, open `/api/test-email`, and a real email arrives. |

## Section 11: build order (stages 9–12)

| Stage | Where |
|---|---|
| 6. Goals: create, edit, submit | `app/(app)/goals/*` |
| 7. Manager approval | `app/(app)/team/[employeeId]`, `team/actions.ts` |
| 8. Self-appraisal | `app/(app)/review/*` |
| 9. Manager review + overall rating | `team/[employeeId]/manager-review-form.tsx` |
| 10. Dashboards + completion report | `app/(app)/dashboard`, `app/(app)/admin/report`, `app/api/report` (CSV) |
| 11. Email notification | self-appraisal submitted → manager (plus three more) |
| 12. Polish | Empty states, loading skeleton, error page, 404, mobile layout, README |

## Security tests run before deploying

The SQL was executed in a local Postgres (PGlite) with a stand-in for Supabase's `auth.jwt()`, acting as each user. **51 of 51 checks passed**, including:

- Priya sees only herself and her manager in `employees`; Rahul cannot see Priya.
- The anonymous key reads nothing (`permission denied`).
- An employee cannot create a cycle, add a goal for someone else, approve their own goal, complete their own review, or write a manager rating.
- A second open cycle is rejected by the unique index.
- After submitting, the employee can't edit their self-appraisal; after completing, the manager can't edit the review.
- HR can read everything but cannot edit goals or reviews.

## Testing checklist (Section 12)

- [ ] HR / Manager / Employee logins work
- [ ] Create a review cycle and open it
- [ ] Add an employee and assign a manager
- [ ] Create, edit and delete a goal
- [ ] Weightage validation triggers when the total is not 100
- [ ] Submit goals for approval
- [ ] Manager approves, and sends back with a comment
- [ ] Submit a self-appraisal
- [ ] Manager review saves and completes
- [ ] Email received
- [ ] Employee A cannot open Employee B's review by editing the URL
- [ ] All of the above on the live Vercel URL

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Your account is not yet set up" | No employee row with that email | HR adds the person with the exact sign-in email (lowercase). |
| "Database rejected your login token" | Clerk ↔ Supabase integration missing | Activate it at dashboard.clerk.com/setup/supabase, and add Clerk under Supabase → Third-Party Auth. |
| Email not arriving | Free Resend can only send to the account's own email | Make the manager's email the Resend sign-up email; check spam. |
| Works locally, not on Vercel | Env vars missing in Vercel | Settings → Environment Variables, then redeploy. |
