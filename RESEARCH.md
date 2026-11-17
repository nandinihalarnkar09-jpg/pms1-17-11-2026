<!--
  DRAFT. Rewrite this in your own words before you commit it. You will be questioned on
  every line in the demo. Add your own notes on the three products after you watch a demo
  video of each one (search YouTube for "<product> performance review demo").
-->

# Research Note: Performance Management Systems

**Project 2: AI Applications in New Age HR**
**Author:** _your name_  |  **Date:** _date_

## 1. KRA vs KPI vs Goal

These three words get used as if they meant the same thing, but they describe different levels of the same idea.

- A **KRA (Key Result Area)** is a broad area of the job the person is responsible for. It describes *where* to focus, not how much. A KRA usually stays the same from one year to the next because it comes from the role.
- A **KPI (Key Performance Indicator)** is the metric used to measure performance in that area. It is a number you can track.
- A **goal** is a specific target for one person in one cycle. It usually takes a KPI and attaches a target value and a deadline.

**One role, all three: Software Engineer at a services company**

| Level | Example |
|---|---|
| KRA | Delivery quality |
| KPI | Defects found after release, per quarter |
| Goal | Reduce post-release defects on the billing module from 12 to fewer than 5 per quarter by 31 March 2027, by adding automated tests for every new API. |

**In my app:** I store only **goals**, because that is what an employee writes and a manager approves each cycle. Each goal has a weightage, and the weightages must add up to 100 so that an important goal counts for more in the overall rating.

## 2. SMART goals

SMART comes from a 1981 *Management Review* article by George T. Doran. His original letters stood for Specific, Measurable, Assignable, Realistic and Time-related. Today most people read them as Specific, Measurable, Achievable, Relevant and Time-bound.

A badly written goal is one that two people could read and disagree about whether it was achieved. Here is a bad goal:

> "Improve code quality."

It names no part of the code, no measure, no target and no date. At the end of the year the employee will say it was met, the manager will say it was not, and neither can prove it. The SMART version is the goal in the table above. Other common mistakes:
- writing an activity instead of an outcome ("attend training")
- setting a target the person cannot influence
- setting ten goals so that none of them gets attention

**In my app:** each goal has a required title, a description, a weightage and a target date, so the "time-bound" part cannot be skipped.

## 3. The performance appraisal cycle

An appraisal cycle is the fixed, time-bound period an organisation uses to plan and then judge performance. In India it is usually the financial year, April to March. A typical annual cycle has these stages:

| Stage | When (typical) | Who acts | What happens |
|---|---|---|---|
| 1. Cycle launch | Start of year | HR | Creates the cycle, confirms the employee list and reporting lines |
| 2. Goal setting | First 4–6 weeks | Employee, then manager | Employee drafts goals; manager approves or sends them back with comments |
| 3. Mid-year check-in | Month 6 | Employee and manager | Progress review; goals adjusted if the business changed |
| 4. Self-appraisal | End of year | Employee | Rates themselves against each approved goal, with evidence |
| 5. Manager review | After self-appraisal | Manager | Reads the self-appraisal, rates each goal, writes a summary and gives an overall rating |
| 6. Calibration | After manager reviews | HR and senior managers | Ratings are compared across teams for consistency |
| 7. Feedback and outcomes | Final month | Manager, HR | Rating discussed with the employee; increments, promotions or improvement plans follow |

**In my app:** I build stages 1, 2, 4 and 5 completely, plus a dashboard that tracks progress. Stages 3, 6 and 7 are out of scope for this project. The review moves through four statuses: **Not Started → Self-Appraisal Submitted → Manager Reviewed → Completed**.

## 4. Self-appraisal: why ask the employee first?

- **The employee knows things the manager does not.** A manager with eight reports does not see every escalation handled or every colleague helped. The self-appraisal brings out that hidden work.
- **It makes the process feel fair.** People accept a rating more readily when they were asked first.
- **The gap is the conversation.** If an employee rates a goal 5 and the manager rates it 3, that difference is exactly what the review meeting should discuss.
- **It builds ownership.** The employee has to reread their own goals and collect evidence.

One known weakness is that self-ratings tend to run higher than manager ratings. That is why the self-rating is an input to the manager's decision and not the final rating.

**In my app:** the employee cannot see the manager's ratings until the review is completed. The manager sees the self-appraisal side by side with their own form.

## 5. Rating scales

A rating scale turns a judgement into a number that can be compared and reported.

| Scale | Typical labels | Strength | Weakness |
|---|---|---|---|
| 3-point | Below / Meets / Exceeds | Simple and quick; little room for argument | Almost everyone lands on "Meets", so it does not separate people well |
| 4-point | Unsatisfactory / Needs improvement / Strong / Outstanding | No middle option, so the manager has to lean one way | Feels harsh; "average" performers get pushed up or down |
| 5-point | 1 Unsatisfactory … 3 Meets expectations … 5 Outstanding | Most familiar; enough detail to show real differences | Ratings bunch up on 3 |

**Why some companies remove the middle option:** managers tend to give the safe middle score to avoid a hard conversation. This is called **central tendency bias**. With an even number of points, the manager has to decide whether the person is slightly above or slightly below the bar.

**In my app:** I use a **5-point scale with a written label on every point**. To counter central tendency bias, **every rating needs a comment**, so a "3" has to be explained just like a "5".

## 6. Normalisation, calibration and the bell curve

- **Calibration** is a meeting where managers compare their proposed ratings so that a "4" in one team means the same as a "4" in another. It corrects managers who rate everyone too generously or too strictly.
- **Normalisation** goes further. It adjusts ratings to fit a fixed distribution, usually a **bell curve** (also called forced distribution or stack ranking). A common split is 20% top performers, 70% middle and 10% bottom.

**Why the bell curve is controversial:**
- It assumes every team contains a fixed share of weak performers. A team of five strong people is still forced to label someone as below par.
- It sets colleagues against each other, because your rating depends on someone else being rated lower. Microsoft ended stack ranking in November 2013 after years of criticism that it damaged teamwork.
- Indian IT followed: Infosys dropped forced ranking in late 2015, and TCS said in 2016 that its appraisals no longer used curve fitting.
- Defenders, most famously former GE CEO Jack Welch, argue that honestly separating top and bottom performers is kinder in the long run than rating everyone "average".
- Deloitte's 2015 research found that ratings often reveal more about the person giving them than about the person being rated. This supports calibration, but it also shows that a single number is a weak basis for forcing people into a curve.

**In my app:** normalisation and calibration are **out of scope**, as the brief says. The HR report shows the spread of overall ratings, which is what a calibration meeting would start from.

## 7. OKRs vs traditional KRA-based appraisals

| | OKRs | KRA-based appraisal |
|---|---|---|
| Structure | One qualitative Objective plus 3–5 measurable Key Results | Role-based KRAs, each measured by KPIs |
| Cadence | Usually quarterly | Usually annual |
| Ambition | Deliberately stretching; at Google, scoring about 60–70% is considered healthy | Targets are expected to be met in full |
| Visibility | Often public across the company | Private between employee, manager and HR |
| Link to pay | Ideally kept separate from compensation | Directly drives the rating and the increment |
| Origin | Andy Grove at Intel in the 1970s; John Doerr brought it to Google in 1999 | Grew out of Management by Objectives (Drucker, 1954) |

The main difference is purpose. OKRs are meant to **align and stretch** the organisation. KRA appraisals are meant to **evaluate and reward** the individual. If you tie stretch OKRs to salary, people quietly set easy OKRs.

**In my app:** I follow the KRA/goal model, because the brief's problem is an annual appraisal that feeds rating decisions.

## 8. Three real PMS products

_These notes come from each vendor's public product pages and screenshots. **Add your own likes and dislikes after watching a demo video of each.**_

**Keka (India).** Keka's performance module is organised into Goals, 1:1 Meetings, Continuous Feedback, PIP (performance improvement plans), Reviews, Skills, a Dashboard and Reports. Goals can come from templates or be bulk-assigned by admins, and can be linked to tools like Jira.
- *Like:* goals and reviews are separate modules. That matches my data model, where a goal is the plan and a rating is the outcome.
- *Dislike / question:* _your observation_

**Lattice (US).** Lattice is built around review cycles that can be annual, quarterly or project-based. When setting up a cycle, HR chooses review directions (for example, downward, from manager to report) and which employees are included. The admin progress screen shows how many reviews are completed, still in progress or not started.
- *Like:* that completion progress bar is exactly what an HR admin needs. I am building a version of it on my HR dashboard.
- *Dislike:* Capterra's review summary notes that some users find goal tracking and reporting complex. That is a reminder to keep my screens simple.

**Darwinbox (India).** Darwinbox emphasises goal plans with cascading (company goals broken down to teams and individuals), regular check-ins, performance journals, multi-stakeholder feedback and role-wise dashboards.
- *Like:* role-wise dashboards. I give each of my three roles its own landing page.
- *Dislike / question:* _your observation_

**Screens all three share:** a goals list per employee, a review form, a manager's team view, and an HR completion report. These became my core screens.

## 9. Sensitive data and who must never see it

| Data | Why it is sensitive | Who must never see it |
|---|---|---|
| Self and manager ratings, overall rating | Drives salary, promotion and exit decisions | Peers and anyone outside the reporting line |
| Manager comments and review summary | Candid judgement about a person | Other employees. The employee should not see the manager's draft until the review is completed. |
| Goals and achievement comments | Can reveal personal performance problems | Peers and other teams |
| Personal details (email, date of joining) | Personal data | Anyone without a business need |
| Future: salary, PIP status | Highly sensitive | Everyone except HR and the direct manager. Not stored in this project. |

India's **Digital Personal Data Protection Act, 2023** became operational when its Rules were notified on 13 November 2025, with most obligations taking effect by May 2027. Under it, an employer is responsible for protecting the employee data it processes.

**How my app enforces this:**
1. **Supabase Row Level Security.** The database itself only returns rows a user is allowed to see: your own records, your direct reports' records, or everything if you are HR.
2. **Server-side checks.** Every page and action re-checks permissions, so changing an ID in the URL shows "not found" instead of someone else's review.
3. **No secrets in the repo.** All keys live in `.env.local` and in Vercel environment variables. The Supabase service key is used on the server only, for one job: linking a new login to its employee record.

## 10. How this research shaped my design

| Research finding | Design decision |
|---|---|
| A manager is just an employee with reports | One `employees` table with a `manager_id` pointing back to the same table |
| Goals belong to a time-bound cycle | Every goal and review has a `cycle_id`; only one cycle can be open at a time |
| A goal is the plan, a rating is the outcome | Separate `goals` and `goal_ratings` tables |
| Goals differ in importance | Each goal has a weightage; the total must equal 100 before submitting |
| Central tendency bias | 5-point scale with labels, and a required comment for every rating |
| Ratings are sensitive | Row Level Security on every table, plus server-side checks |
| A review is a workflow, not a form | One `reviews` row per employee per cycle, with a status that only moves forward |

## Sources

- Doran, G. T. (1981). "There's a S.M.A.R.T. way to write management's goals and objectives." *Management Review* 70(11). Summary: [Wikipedia – SMART criteria](https://en.wikipedia.org/wiki/SMART_criteria)
- Buckingham, M. & Goodall, A. (2015). "Reinventing Performance Management." *Harvard Business Review*. [HBR Store listing](https://store.hbr.org/product/reinventing-performance-management/R1504B)
- SHRM (2013). ["'Stack Ranking' Ends at Microsoft, Generating Heated Debate"](https://www.shrm.org/topics-tools/news/benefits-compensation/stack-ranking-ends-microsoft-generating-heated-debate)
- CNN Money (2013). ["Microsoft kills employee-ranking system"](https://money.cnn.com/2013/11/13/technology/enterprise/microsoft-stack-ranking/index.html)
- Business Standard (2016). ["TCS does away with Bell Curve model"](https://www.business-standard.com/article/companies/tcs-does-away-with-bell-curve-model-116041900657_1.html)
- InfoQ (2015). ["Infosys Scraps Bell Curve for Performance Evaluation"](https://www.infoq.com/news/2015/09/bell-curve)
- What Matters. ["The OKR Origin Story"](https://www.whatmatters.com/stories/the-origin-story)
- Enrich Labs. ["OKRs: Complete Guide 2026"](https://www.enrichlabs.ai/blog/okrs-complete-guide-2026) (Google's 60–70% scoring)
- Keka Help Center. ["Performance"](https://help.keka.com/admin/performance)
- Lattice. ["Performance reviews"](https://lattice.com/performance/reviews)
- Capterra. ["Lattice Software Review"](https://capterra.com/p/151676/Lattice/)
- Darwinbox. ["Performance Management System"](https://explore.darwinbox.com/org/performance-management-system)
- Mondaq (2025). ["Digital Personal Data Protection Rules, 2025 – Notified"](https://www.mondaq.com/india/data-protection/1708164/digital-personal-data-protection-rules-2025-notified)
