-- ============================================================================
-- Reporting view: per-organisation contact counts by eligibility.
-- security_invoker = on ensures the querying user's RLS on `contacts`
-- and `organisations` still applies (no privilege escalation via the view).
-- ============================================================================
create view public.org_contact_counts
with (security_invoker = on)
as
select
  o.id as org_id,
  count(c.id)::int as total,
  count(c.id) filter (where c.eligibility_status = 'pending_review')::int as pending_review,
  count(c.id) filter (where c.eligibility_status = 'eligible')::int as eligible,
  count(c.id) filter (where c.eligibility_status = 'ineligible')::int as ineligible
from public.organisations o
left join public.contacts c on c.org_id = o.id
group by o.id;

grant select on public.org_contact_counts to authenticated;
