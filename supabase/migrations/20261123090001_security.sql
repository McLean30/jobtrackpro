-- ============================================================================
-- Nexai Reactivation Engine — Milestone 1 security
-- Row Level Security, access-helper functions, auth provisioning, grants.
--
-- Access model (Milestone 1): every signed-in user is a Nexai administrator
-- and may operate across all client organisations. RLS still scopes every
-- row by organisation and denies by default, so nothing leaks to the public
-- or to a future org-scoped member who is not authorised for that org.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Access helpers. SECURITY DEFINER so they can read profiles/org_members
-- without being blocked by (or recursing into) those tables' own policies.
-- ---------------------------------------------------------------------------
create or replace function public.is_nexai_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'nexai_admin'
  );
$$;

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.user_id = auth.uid() and m.org_id = target_org
  );
$$;

create or replace function public.has_org_access(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_nexai_admin() or public.is_org_member(target_org);
$$;

-- ---------------------------------------------------------------------------
-- Auto-provision a profile when a new auth user is created.
-- Milestone 1: new users are Nexai administrators (admins are invited via
-- the Supabase dashboard; there is no public sign-up).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'nexai_admin'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere (deny-by-default).
-- ---------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.organisations       enable row level security;
alter table public.org_members         enable row level security;
alter table public.import_batches      enable row level security;
alter table public.contacts            enable row level security;
alter table public.permission_evidence enable row level security;
alter table public.audit_log           enable row level security;

-- profiles -------------------------------------------------------------------
create policy "profiles_select_self_or_admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_nexai_admin());

create policy "profiles_update_self_or_admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_nexai_admin())
  with check (id = auth.uid() or public.is_nexai_admin());

-- organisations --------------------------------------------------------------
create policy "organisations_select_with_access"
  on public.organisations for select to authenticated
  using (public.has_org_access(id));

create policy "organisations_insert_admin"
  on public.organisations for insert to authenticated
  with check (public.is_nexai_admin());

create policy "organisations_update_admin"
  on public.organisations for update to authenticated
  using (public.is_nexai_admin())
  with check (public.is_nexai_admin());

create policy "organisations_delete_admin"
  on public.organisations for delete to authenticated
  using (public.is_nexai_admin());

-- org_members ----------------------------------------------------------------
create policy "org_members_select_self_or_admin"
  on public.org_members for select to authenticated
  using (user_id = auth.uid() or public.is_nexai_admin());

create policy "org_members_write_admin"
  on public.org_members for all to authenticated
  using (public.is_nexai_admin())
  with check (public.is_nexai_admin());

-- import_batches -------------------------------------------------------------
create policy "import_batches_select_with_access"
  on public.import_batches for select to authenticated
  using (public.has_org_access(org_id));

create policy "import_batches_insert_admin"
  on public.import_batches for insert to authenticated
  with check (public.is_nexai_admin() and public.has_org_access(org_id));

create policy "import_batches_update_admin"
  on public.import_batches for update to authenticated
  using (public.is_nexai_admin())
  with check (public.is_nexai_admin());

create policy "import_batches_delete_admin"
  on public.import_batches for delete to authenticated
  using (public.is_nexai_admin());

-- contacts -------------------------------------------------------------------
create policy "contacts_select_with_access"
  on public.contacts for select to authenticated
  using (public.has_org_access(org_id));

create policy "contacts_insert_admin"
  on public.contacts for insert to authenticated
  with check (public.is_nexai_admin() and public.has_org_access(org_id));

create policy "contacts_update_admin"
  on public.contacts for update to authenticated
  using (public.is_nexai_admin())
  with check (public.is_nexai_admin());

create policy "contacts_delete_admin"
  on public.contacts for delete to authenticated
  using (public.is_nexai_admin());

-- permission_evidence --------------------------------------------------------
create policy "permission_evidence_select_with_access"
  on public.permission_evidence for select to authenticated
  using (public.has_org_access(org_id));

create policy "permission_evidence_insert_admin"
  on public.permission_evidence for insert to authenticated
  with check (public.is_nexai_admin() and public.has_org_access(org_id));

create policy "permission_evidence_delete_admin"
  on public.permission_evidence for delete to authenticated
  using (public.is_nexai_admin());

-- audit_log ------------------------------------------------------------------
-- Readable by admins (and org members for their org). Append-only: there are
-- deliberately no UPDATE or DELETE policies, so edits/deletes are denied.
create policy "audit_log_select"
  on public.audit_log for select to authenticated
  using (
    public.is_nexai_admin()
    or (org_id is not null and public.is_org_member(org_id))
  );

create policy "audit_log_insert_self"
  on public.audit_log for insert to authenticated
  with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants. Only `authenticated` gets table access; `anon` gets none, so there
-- is no public access to any customer data. `service_role` bypasses RLS.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_nexai_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_access(uuid) to authenticated;
