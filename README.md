# Nexai Reactivation Engine

An AI customer-database reactivation system for UK SMBs. Nexai administrators
import a client's customer database, check marketing eligibility, and (in later
milestones) run AI-assisted reactivation campaigns.

> **This repository contains Milestone 1 only: Foundation and Contact Intake.**
> Email sending, AI campaigns, reply classification, and billing are
> intentionally **not** built yet — see [Deferred to Milestone 2](#deferred-to-milestone-2).

---

## What Milestone 1 includes

- **Authentication** — secure admin login (Supabase Auth); all app routes are
  protected; no public access to customer data.
- **Client management** — create, view and edit client organisations, each with
  a unique organisation ID. Multi-client from day one.
- **Database + security** — Supabase Postgres with SQL migrations, indexes,
  constraints, **Row Level Security on every table**, and an append-only
  **audit trail**.
- **CSV import** — upload up to 5,000 contacts, preview, map columns, normalise
  emails, detect duplicates and malformed addresses. Imported contacts are never
  assumed to have marketing consent.
- **Marketing eligibility** — `pending_review` / `eligible` / `ineligible`, with
  permission evidence stored separately and suppression reasons
  (`unsubscribed`, `complaint`, `hard_bounce`, `manual_exclusion`). Nothing is
  auto-approved.
- **Contact management** — searchable, filterable table; per-contact detail;
  import summaries (accepted / rejected / pending).
- **Dashboard** — Overview, Clients, Contacts, Imports, Settings. Responsive on
  desktop and mobile.
- **Demo data** — clearly-labelled fictional data so you can explore without
  real personal information.

## Tech stack

| Area      | Choice                                  |
| --------- | --------------------------------------- |
| Framework | Next.js 16 (App Router) + React 19      |
| Language  | TypeScript (strict)                     |
| Styling   | Tailwind CSS v4 (tokens in `globals.css`) |
| Backend   | Supabase (Postgres + Auth)              |
| Access    | Server-side via `@supabase/ssr`, RLS    |
| Validation| Zod                                     |
| CSV        | PapaParse                               |
| Tests     | Vitest                                  |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the **Project URL**, the **anon /
   publishable** key, and the **service_role** key.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable                        | Where used        | Notes                                             |
| ------------------------------- | ----------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser + server  | Project URL. Safe to expose.                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server  | Anon/publishable key. Safe to expose; RLS guards data. |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server only**   | Full admin, bypasses RLS. Never expose or commit. |

`.env.local` is git-ignored. **Never commit real credentials.**

### 4. Apply the database migrations

**Option A — Supabase SQL editor (simplest).** In the dashboard, open
**SQL Editor** and run these files in order:

1. `supabase/migrations/20261123090000_schema.sql`
2. `supabase/migrations/20261123090001_security.sql`
3. `supabase/migrations/20261123090002_views.sql`

**Option B — Supabase CLI.**

```bash
npx supabase link --project-ref <your-ref>
npx supabase db push
```

### 5. (Optional) Load demo data

Run `supabase/seed.sql` in the SQL editor. It inserts **fictional** clients and
contacts using reserved `example.com` / `example.org` addresses, so you can test
everything without real data. Safe to re-run; **do not run against production.**

### 6. Create the first admin

There is no public sign-up. In Supabase **Authentication → Users**, click
**Add user**, set an email and password, and confirm. A matching `nexai_admin`
profile is created automatically by a database trigger on first sign-in.

> Recommended: in **Authentication → Providers → Email**, disable
> "Allow new users to sign up" so only invited admins exist.

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in. Try an import
with `samples/demo-contacts.csv` (fictional; includes a duplicate, a malformed
address, and a blank email to demonstrate rejection handling).

---

## Scripts

```bash
npm run dev         # start the dev server
npm run build       # production build
npm run start       # run the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest (CSV parsing, dedupe, eligibility, org codes)
```

## Project structure

```
src/
  app/
    login/                     # public admin login
    auth/signout/              # sign-out route
    api/imports/               # CSV import commit (route handler)
    (dashboard)/               # protected: layout runs requireUser()
      overview/ clients/ contacts/ imports/ settings/
  components/                  # UI primitives, brand logo, dashboard shell
  lib/
    contacts/                  # pure logic: csv, email, dates, dedupe, eligibility (+ tests)
    supabase/                  # browser / server / admin clients, typed Database
    auth.ts  audit.ts  validation.ts  org-code.ts  utils.ts
  proxy.ts                     # session refresh + route protection (Next 16 proxy)
supabase/
  migrations/                  # schema, security (RLS), reporting view
  seed.sql                     # fictional demo data
samples/demo-contacts.csv      # fictional CSV for testing import
```

## Security model

- **RLS everywhere, deny by default.** Every table has RLS enabled. Only the
  `authenticated` role has table grants; `anon` has none, so there is no public
  access to customer data.
- **Organisation isolation.** Every row is scoped by `org_id`. Access policies
  pass for a Nexai admin (`is_nexai_admin()`) or an `org_members` match
  (`is_org_member()`), so scoped per-client logins are a data change in a later
  milestone, not a rewrite.
- **Secrets stay server-side.** The service-role key is only used in
  `src/lib/supabase/admin.ts` (guarded by `server-only`) and never shipped to
  the browser.
- **Audit trail.** Client changes, imports and eligibility changes append to
  `audit_log` (visible under Settings). The log has no update/delete policies, so
  entries are effectively append-only.
- **Consent is never assumed.** Imports always set `pending_review`; marking a
  contact `eligible` requires recorded permission evidence.

## What is tested

Pure logic is unit-tested with Vitest (no live database needed):

- email normalisation + malformed detection
- CSV parsing, blank-line handling, the 5,000-row cap
- import processing: duplicates (in-file + against existing), malformed/missing
  email rejection, and the **pending-review default** (never auto-eligible)
- eligibility rule enforcement (no eligible status without evidence)
- organisation-code generation

Access control and organisation isolation are enforced by the SQL RLS policies
in `supabase/migrations/20261123090001_security.sql`; verify them against your
own Supabase project.

---

## Deferred to Milestone 2

Per the Milestone 1 scope, the following are **intentionally not built**:

- Email provider (Brevo) integration and live sending
- AI-assisted campaigns (OpenAI)
- Reply classification and human follow-up
- Verified sales tracking, billing and commission
- Automatic marketing approvals

Do not begin Milestone 2 without approval.
