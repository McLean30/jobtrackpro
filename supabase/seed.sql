-- ============================================================================
-- Nexai Reactivation Engine — DEMO SEED DATA
-- ----------------------------------------------------------------------------
-- EVERYTHING BELOW IS FICTIONAL. All organisations are invented and all email
-- addresses use the reserved example.com / example.org domains, which can
-- never receive mail. This lets you explore the app without importing any
-- real personal data. Safe to run (and re-run) on a development database.
-- Do NOT run against production.
-- ============================================================================

-- Organisations (clients) ----------------------------------------------------
insert into public.organisations (id, org_code, name, legal_name, contact_email, contact_phone, website, notes, status)
values
  ('a0000000-0000-4000-8000-000000000001', 'DEMO-ACME',    '[DEMO] Acme Plumbing Ltd',   'Acme Plumbing Limited',   'hello@example.com', '020 7946 0001', 'https://example.com', 'Fictional demo client — sample data only.', 'active'),
  ('a0000000-0000-4000-8000-000000000002', 'DEMO-BRIGHT',  '[DEMO] Brightwave Fitness',  'Brightwave Fitness Ltd',  'hello@example.org', '0161 496 0002', 'https://example.org', 'Fictional demo client — sample data only.', 'active'),
  ('a0000000-0000-4000-8000-000000000003', 'DEMO-OAKLEAF', '[DEMO] Oakleaf Dental Care', 'Oakleaf Dental Care Ltd', 'hello@example.com', '0113 496 0003', 'https://example.com', 'Fictional demo client — sample data only.', 'archived')
on conflict (id) do nothing;

-- Import batches --------------------------------------------------------------
insert into public.import_batches (id, org_id, filename, status, column_mapping, total_rows, accepted_count, rejected_count, pending_review_count, duplicate_count, malformed_count, missing_email_count, notes)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'acme-customers-sample.csv', 'completed',
   '{"email":"Email","first_name":"First Name","last_name":"Last Name","customer_status":"Status","last_purchase_date":"Last Order"}'::jsonb,
   7, 6, 1, 6, 1, 0, 0, 'Fictional demo import.'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'brightwave-members-sample.csv', 'completed',
   '{"email":"email","first_name":"first","last_name":"last","customer_status":"membership","last_purchase_date":"last_visit"}'::jsonb,
   6, 5, 1, 5, 0, 1, 0, 'Fictional demo import.')
on conflict (id) do nothing;

-- Contacts --------------------------------------------------------------------
-- Acme (org 1): mostly pending_review, one eligible (evidence recorded),
-- one ineligible (unsubscribed).
insert into public.contacts (id, org_id, import_batch_id, email, email_normalized, first_name, last_name, customer_status, last_purchase_date, phone, eligibility_status, suppression_reason)
values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'john.carter@example.com',  'john.carter@example.com',  'John',  'Carter',  'repeat',   '2024-02-11', '07700 900001', 'pending_review', null),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'amelia.shaw@example.com',   'amelia.shaw@example.com',   'Amelia', 'Shaw',    'lapsed',   '2022-09-03', '07700 900002', 'pending_review', null),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'raj.patel@example.com',     'raj.patel@example.com',     'Raj',    'Patel',   'repeat',   '2023-12-20', null,           'eligible',       null),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'sophie.turner@example.com', 'sophie.turner@example.com', 'Sophie', 'Turner',  'one-off',  '2021-06-15', '07700 900004', 'ineligible',     'unsubscribed'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'liam.brooks@example.com',   'liam.brooks@example.com',   'Liam',   'Brooks',  'lapsed',   '2020-11-02', null,           'pending_review', null),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'grace.hall@example.com',    'grace.hall@example.com',    'Grace',  'Hall',    'repeat',   '2024-05-28', '07700 900006', 'pending_review', null),
  -- Brightwave (org 2)
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'noah.evans@example.org',    'noah.evans@example.org',    'Noah',   'Evans',   'former',   '2023-01-19', null,           'pending_review', null),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'olivia.reed@example.org',   'olivia.reed@example.org',   'Olivia', 'Reed',    'active',   '2024-08-07', '07700 900012', 'eligible',       null),
  ('c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'harry.cole@example.org',    'harry.cole@example.org',    'Harry',  'Cole',    'former',   '2022-03-30', null,           'pending_review', null),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'ella.ward@example.org',     'ella.ward@example.org',     'Ella',   'Ward',    'former',   '2021-10-11', '07700 900014', 'ineligible',     'hard_bounce'),
  ('c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'jacob.price@example.org',   'jacob.price@example.org',   'Jacob',  'Price',   'former',   '2023-07-22', null,           'pending_review', null),
  -- Oakleaf (org 3, archived client)
  ('c0000000-0000-4000-8000-000000000021', 'a0000000-0000-4000-8000-000000000003', null, 'mia.foster@example.com', 'mia.foster@example.com', 'Mia',   'Foster', 'inactive', '2019-04-18', null, 'pending_review', null),
  ('c0000000-0000-4000-8000-000000000022', 'a0000000-0000-4000-8000-000000000003', null, 'leo.barnes@example.com', 'leo.barnes@example.com', 'Leo',   'Barnes', 'inactive', '2020-02-27', null, 'ineligible',     'complaint')
on conflict (id) do nothing;

-- Permission evidence (stored separately from the contact) --------------------
-- Only recorded for the two contacts marked 'eligible', demonstrating that
-- eligibility is backed by documented consent.
insert into public.permission_evidence (id, contact_id, org_id, evidence_type, source, captured_at, notes)
values
  ('e0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'double_opt_in', 'Website newsletter signup (demo)', '2023-11-01T10:00:00Z', 'Fictional evidence record for demo.'),
  ('e0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000002', 'signup_form',   'Gym membership form (demo)',       '2024-07-15T09:30:00Z', 'Fictional evidence record for demo.')
on conflict (id) do nothing;

-- Audit trail (illustrative) --------------------------------------------------
insert into public.audit_log (org_id, actor_id, action, entity_type, entity_id, metadata)
values
  ('a0000000-0000-4000-8000-000000000001', null, 'contact.eligibility_changed', 'contact', 'c0000000-0000-4000-8000-000000000003', '{"from":"pending_review","to":"eligible","demo":true}'::jsonb),
  ('a0000000-0000-4000-8000-000000000001', null, 'contact.suppressed',          'contact', 'c0000000-0000-4000-8000-000000000004', '{"reason":"unsubscribed","demo":true}'::jsonb)
on conflict (id) do nothing;
