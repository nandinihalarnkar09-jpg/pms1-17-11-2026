# Data Model

Five tables. GitHub renders the diagram below automatically.

```mermaid
erDiagram
    employees ||--o{ employees : "manages (manager_id)"
    employees ||--o{ review_cycles : "creates (created_by)"
    employees ||--o{ goals : "owns (employee_id)"
    review_cycles ||--o{ goals : "contains (cycle_id)"
    employees ||--o{ reviews : "is reviewed (employee_id)"
    employees ||--o{ reviews : "reviews (manager_id)"
    review_cycles ||--o{ reviews : "contains (cycle_id)"
    reviews ||--o{ goal_ratings : "has lines (review_id)"
    goals ||--o{ goal_ratings : "is rated in (goal_id)"

    employees {
        uuid id PK
        text clerk_user_id UK "set on first sign-in"
        text full_name
        text email UK "lowercase"
        text designation
        text department
        date date_of_joining
        uuid manager_id FK "-> employees.id"
        text role "employee | manager | hr_admin"
        bool is_active
    }
    review_cycles {
        uuid id PK
        text name "FY 2026-27 Annual"
        date start_date
        date end_date
        text status "draft | open | closed"
        uuid created_by FK
    }
    goals {
        uuid id PK
        uuid employee_id FK
        uuid cycle_id FK
        text title
        text description
        int weightage "1-100, total = 100"
        date target_date
        text status "draft | submitted | approved | sent_back"
        text manager_comment
    }
    reviews {
        uuid id PK
        uuid employee_id FK
        uuid manager_id FK "who reviewed"
        uuid cycle_id FK
        text status "not_started | self_submitted | manager_reviewed | completed"
        int overall_self_rating "1-5"
        int overall_manager_rating "1-5"
        text manager_summary
        timestamptz submitted_at
        timestamptz reviewed_at
    }
    goal_ratings {
        uuid id PK
        uuid review_id FK
        uuid goal_id FK
        text self_comment
        int self_rating "1-5"
        text manager_comment
        int manager_rating "1-5"
    }
```

## Why each table exists

| Table | One row means… | Key rule |
|---|---|---|
| `employees` | One person in the company | `manager_id` points back into the same table. A manager is simply someone who appears as another person's `manager_id`. |
| `review_cycles` | One appraisal period | A partial unique index allows only **one** open cycle at a time. |
| `goals` | One thing an employee plans to achieve in a cycle | Linked to a cycle, so years never mix. Weightages must total 100 before submitting. |
| `reviews` | One employee's appraisal for one cycle | `unique (employee_id, cycle_id)`. Its `status` column **is** the workflow. |
| `goal_ratings` | The self and manager rating for one goal | Kept separate from `goals`, because a goal is the plan and a rating is the outcome. |

## The two workflows

**Goal status**

```mermaid
stateDiagram-v2
    [*] --> draft : employee creates
    draft --> submitted : employee submits (total = 100)
    submitted --> approved : manager approves
    submitted --> sent_back : manager sends back + comment
    sent_back --> submitted : employee edits and resubmits
    approved --> [*]
```

**Review status**

```mermaid
stateDiagram-v2
    [*] --> not_started : all goals approved
    not_started --> self_submitted : employee submits self-appraisal (email to manager)
    self_submitted --> manager_reviewed : manager saves ratings
    manager_reviewed --> manager_reviewed : manager edits
    manager_reviewed --> completed : manager completes (locked)
    self_submitted --> completed : manager completes directly
    completed --> [*]
```

## Who can see and change what (Row Level Security)

All five tables have RLS turned on. The rules live in `supabase/02_security.sql`.

| Table | Read | Write |
|---|---|---|
| employees | yourself, your direct reports, your manager; HR reads everyone | HR only |
| review_cycles | every signed-in user | HR only |
| goals | owner, owner's manager, HR | owner: create/edit/submit drafts in the open cycle. Manager: approve or send back submitted goals. |
| reviews | employee, their manager, HR | employee: save/submit while `not_started`. Manager: save/complete after submission. HR: read-only. |
| goal_ratings | anyone who can see the parent review | employee: self fields before submitting. Manager: manager fields after submission. |

The anonymous (signed-out) key has **no** table access at all.
