import Link from "next/link";
import type { Metadata } from "next";
import { Users, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { EligibilityBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/Table";
import { ELIGIBILITY_STATUSES } from "@/lib/contacts/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Contacts" };
export const dynamic = "force-dynamic";

const RESULT_CAP = 200;
const ELIGIBILITY_LABELS: Record<string, string> = {
  pending_review: "Pending review",
  eligible: "Eligible",
  ineligible: "Ineligible",
};

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const org = typeof sp.org === "string" ? sp.org : "";
  const eligibility = typeof sp.eligibility === "string" ? sp.eligibility : "";
  const batch = typeof sp.batch === "string" ? sp.batch : "";

  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, name")
    .order("name");
  const orgNameById = new Map(orgs?.map((o) => [o.id, o.name]) ?? []);

  let query = supabase
    .from("contacts")
    .select(
      "id, org_id, email, first_name, last_name, customer_status, eligibility_status, last_purchase_date",
    )
    .order("created_at", { ascending: false })
    .limit(RESULT_CAP);

  if (org) query = query.eq("org_id", org);
  if (batch) query = query.eq("import_batch_id", batch);
  if (eligibility && ELIGIBILITY_STATUSES.includes(eligibility as never)) {
    query = query.eq("eligibility_status", eligibility as never);
  }
  if (q) {
    const safe = q.replace(/[,()%]/g, " ").trim();
    if (safe) {
      query = query.or(
        `email.ilike.%${safe}%,first_name.ilike.%${safe}%,last_name.ilike.%${safe}%`,
      );
    }
  }

  const { data: contacts } = await query;
  const rows = contacts ?? [];

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Every contact is scoped to one client. Search and filter across clients you manage."
      />

      <form
        method="get"
        className="mb-4 grid gap-3 rounded-[var(--radius)] border border-border bg-surface p-4 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search email or name"
            className="pl-9"
            aria-label="Search contacts"
          />
        </div>
        <Select name="org" defaultValue={org} aria-label="Filter by client">
          <option value="">All clients</option>
          {orgs?.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
        <Select
          name="eligibility"
          defaultValue={eligibility}
          aria-label="Filter by eligibility"
        >
          <option value="">All eligibility</option>
          {ELIGIBILITY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ELIGIBILITY_LABELS[s]}
            </option>
          ))}
        </Select>
        {batch && <input type="hidden" name="batch" value={batch} />}
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {(q || org || eligibility || batch) && (
            <Link href="/contacts">
              <Button type="button" variant="ghost">
                Clear
              </Button>
            </Link>
          )}
        </div>
      </form>

      {batch && (
        <p className="mb-3 text-sm text-fg-muted">
          Filtered to a single import batch.{" "}
          <Link href="/contacts" className="text-brand-600 hover:underline">
            Show all
          </Link>
        </p>
      )}

      {rows.length > 0 ? (
        <>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Client</Th>
                  <Th>Status</Th>
                  <Th>Eligibility</Th>
                  <Th>Last purchase</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const name =
                    [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
                  return (
                    <Tr key={c.id}>
                      <Td>
                        <Link
                          href={`/contacts/${c.id}`}
                          className="font-medium text-fg hover:text-brand-600"
                        >
                          {name}
                        </Link>
                      </Td>
                      <Td className="text-fg-muted">{c.email}</Td>
                      <Td className="text-fg-muted">
                        {orgNameById.get(c.org_id) ?? "—"}
                      </Td>
                      <Td className="text-fg-muted">{c.customer_status ?? "—"}</Td>
                      <Td>
                        <EligibilityBadge status={c.eligibility_status} />
                      </Td>
                      <Td className="text-fg-muted">
                        {formatDate(c.last_purchase_date)}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
          {rows.length === RESULT_CAP && (
            <p className="mt-3 text-xs text-fg-subtle">
              Showing the first {RESULT_CAP} matches. Narrow your filters to see
              more specific results.
            </p>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No contacts found"
          description="Try clearing the filters, or import a CSV from the Imports tab."
        />
      )}
    </div>
  );
}
