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

## Live end-to-end test on the Vercel URL (17 Nov 2026)

The full Section 10 flow was run on https://pms1-17-11-2026.vercel.app, then the data was reset.

| Check | Result |
|---|---|
| HR creates "FY 2026–27 Annual", opens it; a second open cycle is refused | ✅ |
| HR adds an employee with a manager, edits them; a manager loop (A→B→A) is refused | ✅ |
| Employee adds goals; total 90 is refused ("must total exactly 100"); total 100 submits | ✅ |
| Weightage over 100 is blocked; goal edit and delete work | ✅ |
| Manager sends a goal back with a required comment; employee edits and resubmits; manager approves | ✅ |
| Empty self-appraisal is refused; completed one submits and locks | ✅ |
| **Email "… submitted their self-appraisal" delivered to the manager's inbox** (Resend log: Delivered) | ✅ |
| Manager saves (Manager Reviewed), then completes; incomplete completion is refused | ✅ |
| HR report shows Completed, rating spread and CSV download | ✅ |
| Another employee opening that review / team page / HR pages by URL → "Not found"; CSV → 403 | ✅ |
| Signed-out visitor → redirected to /sign-in; unknown login → "Your account is not yet set up" | ✅ |
| Phone viewport (375 px): no horizontal scrolling, all pages usable | ✅ |

**Bugs found by this test and fixed:**
- The HR employee list and report were empty because Supabase can't embed `employees` inside `employees`. Manager names are now looked up in code (`withManagerNames` in `lib/data.ts`).
- "Save" on the self-appraisal and manager review blanked the form (React resets forms after an action). Actions now return the typed values, and the rating dropdowns are keyed so they keep their selection.
- Every action took ~8 s because Vercel ran in the US and Supabase is in Singapore. `vercel.json` now pins functions to `sin1`, and actions take under 1 s.
- Dates were formatted in the server's UTC day (an evening submission in India showed yesterday's date). They are now shown in India time (`lib/labels.ts`).

**Re-checked on 18 Nov 2026 after the fixes:** draft saves keep text and ratings across repeated saves and a page reload; every page loads without errors for HR, manager and employee; the production domain is public to signed-out visitors; the database was reset to the four seed employees.

## Testing checklist (Section 12)

- [x] HR / Manager / Employee logins work
- [x] Create a review cycle and open it
- [x] Add an employee and assign a manager
- [x] Create, edit and delete a goal
- [x] Weightage validation triggers when the total is not 100
- [x] Submit goals for approval
- [x] Manager approves, and sends back with a comment
- [x] Submit a self-appraisal
- [x] Manager review saves and completes
- [x] Email received
- [x] Employee A cannot open Employee B's review by editing the URL
- [x] All of the above on the live Vercel URL

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "Your account is not yet set up" | No employee row with that email | HR adds the person with the exact sign-in email (lowercase). |
| "Database rejected your login token" | Clerk ↔ Supabase integration missing | Activate it at dashboard.clerk.com/setup/supabase, and add Clerk under Supabase → Third-Party Auth. |
| Email not arriving | Free Resend can only send to the account's own email | Make the manager's email the Resend sign-up email; check spam. |
| Works locally, not on Vercel | Env vars missing in Vercel | Settings → Environment Variables, then redeploy. |
