-- ============================================================================
-- Nexai Reactivation Engine — Milestone 1 schema
-- Foundation + contact intake. Multi-client from day one; every data row is
-- scoped to an organisation. Marketing consent is NEVER assumed.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enumerated types (mirror src/lib/contacts/types.ts)
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('nexai_admin', 'org_member');

create type public.org_status as enum ('active', 'archived');

create type public.eligibility_status as enum (
  'pending_review',
  'eligible',
  'ineligible'
);

create type public.suppression_reason as enum (
  'unsubscribed',
  'complaint',
  'hard_bounce',
  'manual_exclusion'
);

create type public.import_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

create type public.evidence_type as enum (
  'signup_form',
  'double_opt_in',
  'purchase',
  'contract',
  'verbal',
  'imported_documentation',
  'other'
);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users, holds the application role
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'nexai_admin',
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application profile per auth user. Milestone 1 users are Nexai administrators.';

-- ---------------------------------------------------------------------------
-- organisations: the client companies Nexai manages
-- ---------------------------------------------------------------------------
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  org_code text not null unique,
  name text not null,
  legal_name text,
  contact_email text,
  contact_phone text,
  website text,
  notes text,
  status public.org_status not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organisations_name_not_blank check (length(btrim(name)) > 0),
  constraint organisations_org_code_format
    check (org_code ~ '^[A-Z0-9][A-Z0-9-]{1,38}$')
);

create index organisations_status_idx on public.organisations (status);

create trigger organisations_set_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- org_members: maps users to the organisations they may access
-- (Milestone 1 relies on the nexai_admin role; this table makes scoped
--  per-client logins a data change in Milestone 2, not a rewrite.)
-- ---------------------------------------------------------------------------
create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'org_member',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index org_members_user_idx on public.org_members (user_id);
create index org_members_org_idx on public.org_members (org_id);

-- ---------------------------------------------------------------------------
-- import_batches: one row per CSV upload, with the outcome summary
-- ---------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  filename text not null,
  status public.import_status not null default 'completed',
  column_mapping jsonb not null default '{}'::jsonb,
  total_rows integer not null default 0,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  pending_review_count integer not null default 0,
  duplicate_count integer not null default 0,
  malformed_count integer not null default 0,
  missing_email_count integer not null default 0,
  notes text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index import_batches_org_created_idx
  on public.import_batches (org_id, created_at desc);

-- ---------------------------------------------------------------------------
-- contacts: imported/created customer records (scoped to one organisation)
-- ---------------------------------------------------------------------------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  import_batch_id uuid references public.import_batches(id) on delete set null,
  email text not null,
  email_normalized text not null,
  first_name text,
  last_name text,
  customer_status text,
  last_purchase_date date,
  phone text,
  custom_fields jsonb not null default '{}'::jsonb,
  eligibility_status public.eligibility_status not null default 'pending_review',
  suppression_reason public.suppression_reason,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_email_normalized_not_blank
    check (length(btrim(email_normalized)) > 0),
  constraint contacts_unique_email_per_org unique (org_id, email_normalized),
  -- A suppression reason only makes sense on an ineligible contact.
  constraint contacts_suppression_requires_ineligible check (
    suppression_reason is null or eligibility_status = 'ineligible'
  )
);

create index contacts_org_eligibility_idx
  on public.contacts (org_id, eligibility_status);
create index contacts_org_batch_idx
  on public.contacts (org_id, import_batch_id);
create index contacts_org_created_idx
  on public.contacts (org_id, created_at desc);

create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- permission_evidence: consent/permission records, stored SEPARATELY from
-- the contact. A contact may only become 'eligible' when evidence exists.
-- ---------------------------------------------------------------------------
create table public.permission_evidence (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  org_id uuid not null references public.organisations(id) on delete cascade,
  evidence_type public.evidence_type not null,
  source text,
  captured_at timestamptz,
  document_url text,
  notes text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index permission_evidence_contact_idx
  on public.permission_evidence (contact_id);
create index permission_evidence_org_idx
  on public.permission_evidence (org_id);

-- ---------------------------------------------------------------------------
-- audit_log: append-only trail of sensitive actions
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organisations(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_org_created_idx
  on public.audit_log (org_id, created_at desc);
create index audit_log_actor_created_idx
  on public.audit_log (actor_id, created_at desc);
