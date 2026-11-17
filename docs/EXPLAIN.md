# Explain-it guide

Your instructor will pick a file at random and ask what it does. For each file below: what it is for, and the one or two things worth saying out loud.

## How a request flows (say this first)

1. The browser asks for a page, e.g. `/goals`.
2. **`proxy.ts`** runs first. If you aren't signed in to Clerk, it redirects you to `/sign-in`.
3. The page is a **Server Component**: it runs on the server, never in the browser.
4. It calls **`requireMe()`** (`lib/session.ts`), which asks Clerk "who is this?" and looks up the matching row in `employees`.
5. It queries Supabase with **`createUserClient()`**, which attaches the user's Clerk token. Supabase checks the token and applies **Row Level Security**, so it only returns rows this person may see.
6. Forms call **Server Actions** (`actions.ts` files). They validate the input on the server, write to Supabase (RLS checks again), maybe send an email, and refresh the page with `revalidatePath`.

## Root files

| File | What it does |
|---|---|
| `proxy.ts` | Runs before every request. In Next.js 16, `middleware.ts` was renamed `proxy.ts`. Public routes: `/`, `/sign-in`, `/sign-up`; everything else needs a Clerk session (`auth.protect()`). |
| `vercel.json` | Pins Vercel's server functions to Singapore (`sin1`), the same region as the Supabase database, so each query is fast. |
| `next.config.ts` | Next.js settings. Cache Components is **off on purpose**: every page depends on who is signed in, so pages render fresh per request. |
| `.env.example` | The list of environment variables with fake values. The real ones are in `.env.local` (git-ignored) and in Vercel. |
| `.gitignore` | Keeps `node_modules`, build output and **all `.env*` files except `.env.example`** out of git. |
| `package.json` | Dependencies: `next`, `react`, `@clerk/nextjs`, `@supabase/supabase-js`, `resend`, `server-only`, `geist` (font). |

## `supabase/`

| File | What it does |
|---|---|
| `01_schema.sql` | Creates the 5 tables. Key points: `employees.manager_id` references `employees.id` (self-reference = hierarchy); goals and reviews have `cycle_id`; `unique (employee_id, cycle_id)` on reviews; a **partial unique index** allows only one `open` cycle. |
| `02_security.sql` | Turns on RLS and writes the policies. Helper functions (`current_employee_id()`, `is_hr_admin()`, `is_manager_of()`) read `auth.jwt() ->> 'sub'`, the Clerk user id inside the token. `USING` = which rows you can touch; `WITH CHECK` = what the row may look like after your change. Example: an employee can update their goal, but `WITH CHECK` only allows `draft/sent_back/submitted`, so they can never set it to `approved`. |
| `03_seed.sql` | Four test people: HR, a manager, and two employees reporting to the manager. |

## `lib/` (the logic)

| File | What it does |
|---|---|
| `supabase/server.ts` | `createUserClient()`: a Supabase client that sends the **user's Clerk token**. Subject to RLS. Used for almost everything. |
| `supabase/admin.ts` | `createAdminClient()`: uses the **secret key**, which bypasses RLS. Used for **one job only**: linking a new login to its employee row. `import "server-only"` makes the build fail if browser code ever imports it. |
| `session.ts` | `getSession()` / `requireMe()` / `requireHr()`. Finds the employee for the signed-in Clerk user. **First sign-in:** no row has this Clerk id yet, so it looks up the row by email (admin client) and saves the Clerk id onto it. Wrapped in React `cache()` so it runs once per request. |
| `data.ts` | `getOpenCycle()`, `summariseGoals()` (totals, counts, "all approved and = 100?"), `buildProgressRows()` (one row per employee for team/HR views), `nextStepForEmployee()` (dashboard hint). |
| `reviews.ts` | `loadRatedGoals()`: approved goals paired with their rating lines. Shared by the self-appraisal form, the manager form and the read-only view. |
| `report.ts` | `loadReport()`: company-wide rows for the HR dashboard, report page and CSV. |
| `email.ts` | `sendEmail()` via Resend. **Never throws**: email is a side effect, not a dependency. Runs only on the server because the API key is secret. `escapeHtml()` stops names from injecting HTML. |
| `validation.ts` | Server-side form checks: `intInRange`, `rating` (1–5), `isoDate`, `isEmail`, `isUuid`. The server re-checks everything even if the form has `required`. |
| `labels.ts` | Display text: rating labels (1 Unsatisfactory … 5 Outstanding), status labels, date formatting. |
| `types.ts` | TypeScript types for each table and `ActionState` (what a form action returns). |

## `app/` (pages and actions)

| Path | What it does |
|---|---|
| `layout.tsx` | Root HTML, fonts, and `<ClerkProvider>` (inside `<body>`, per Clerk Core 3). |
| `page.tsx` | Landing page. `<Show when="signed-in">` is the Clerk Core 3 replacement for the old `<SignedIn>`. |
| `sign-in/[[...sign-in]]/page.tsx` | Clerk's sign-in component. `[[...sign-in]]` is an optional catch-all route so Clerk's multi-step flow works. |
| `not-set-up/page.tsx` | Shown when a Clerk user has no employee record ("contact HR"), or when Supabase rejects the token (setup problem). |
| `(app)/layout.tsx` | The signed-in shell. `(app)` is a **route group**: it shares a layout without adding to the URL. It builds the nav from the role: HR sees Employees/Cycles/Report; anyone with reports sees My Team. |
| `(app)/dashboard/page.tsx` | One page, three sections: My progress (everyone), My team (managers), Company (HR). |
| `(app)/goals/page.tsx` + `actions.ts` | Goal list, weightage bar, add form, submit. Actions: `createGoal` (total can't exceed 100), `updateGoal`, `deleteGoal`, `submitGoals` (total must be exactly 100, then email the manager). |
| `(app)/review/page.tsx` + `actions.ts` | Self-appraisal. One action, two buttons (`intent=save` / `intent=submit`). Submit requires a comment + rating for every goal, sets status `self_submitted`, then emails the manager. If the email fails, the submission is still saved. |
| `(app)/reviews/[id]/page.tsx` | Read-only review view, and **the URL-tampering test page**: change the id and RLS returns nothing, so you see "Not found". |
| `(app)/team/page.tsx` | Manager's list of direct reports with goal and review status. |
| `(app)/team/[employeeId]/page.tsx` + `../actions.ts` | Approve / send back goals (comment required), then the side-by-side review. `saveManagerReview`: `save` → `manager_reviewed`; `complete` → `completed` (locked), then emails the employee. |
| `(app)/admin/employees/*` | HR directory. `createsLoop()` stops A→B→A manager loops. Choosing someone as a manager upgrades their role to `manager`. |
| `(app)/admin/cycles/*` | Create a cycle; open, close, or reopen it. If another cycle is open, the database's unique index rejects it and we show a friendly message. |
| `(app)/admin/report/page.tsx` | Completion counts, rating spread, filterable table, link to CSV. |
| `api/report/route.ts` | CSV download (HR only). Quotes every cell, and prefixes `= + - @` with `'` to stop spreadsheet formula injection. |
| `api/test-email/route.ts` | Sends a test email **to yourself only**, to prove Resend works. |
| `(app)/loading.tsx`, `(app)/error.tsx`, `not-found.tsx` | Loading skeleton, friendly error with retry, and the 404 page. No blank white screens. |

## `components/`

| File | What it does |
|---|---|
| `ui.tsx` | Small building blocks: Card, Badge, status badges, EmptyState, ProgressBar, Stat, FormMessage, button classes. |
| `submit-button.tsx` | Client component using `useFormStatus` to disable the button and show "Saving…". |
| `nav-links.tsx` | Client component (needs `usePathname`) to highlight the current page. |
| `review-view.tsx` | Read-only review: self on the left, manager on the right. |
| `rating-select.tsx` | The 1–5 dropdown with labels. |

## Likely questions, short answers

- **Why one employees table?** A manager is an employee with reports. Two tables would duplicate people and break when someone is promoted.
- **Why are ratings not on the goals table?** A goal is the plan, set at the start; a rating is the outcome, set at the end. Separate tables keep the plan unchanged and let one review own its rating lines.
- **What is RLS?** Row Level Security: Postgres filters rows per user, based on policies. Here the user is identified from the Clerk token (`auth.jwt()->>'sub'`).
- **Why does the email route have to be server-side?** The Resend key is a secret. Browser code is visible to anyone, so the key would leak.
- **What happens if email fails?** `sendEmail` catches the error and returns `{ok:false}`. The submission is already saved; the success message says the email couldn't be sent.
- **Where does the Clerk user get linked to an employee?** `lib/session.ts`, on the first sign-in, by matching email, on the server, with the admin client.
- **What is `"use server"` / `"use client"`?** `"use server"` marks Server Actions (functions the browser can call that run on the server). `"use client"` marks components that run in the browser (needed for hooks like `useActionState`).
- **What is `revalidatePath`?** It tells Next.js to re-render that page with fresh data after a change.
- **Why does a form keep its values after "Save"?** React resets a form after its action runs. The save actions return the typed values (`fields`), the form re-fills from them, and the rating `<select>` has a `key` so it re-creates itself with the saved choice.
- **Why not show the manager's name with a Supabase join?** `employees.manager_id` points back to `employees`, so the API can't tell which direction to join. We load everyone and map `manager_id` to a name in code (`withManagerNames`).
- **Why `notFound()` rather than "access denied"?** It doesn't confirm that someone else's record exists.
