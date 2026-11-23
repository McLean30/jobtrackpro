import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const supabase = await createClient();

  const [clients, contacts, pending, eligible, ineligible] = await Promise.all([
    supabase.from("organisations").select("id", { count: "exact", head: true }),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("eligibility_status", "pending_review"),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("eligibility_status", "eligible"),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("eligibility_status", "ineligible"),
  ]);

  const { data: imports } = await supabase
    .from("import_batches")
    .select(
      "id, filename, created_at, org_id, total_rows, accepted_count, rejected_count, pending_review_count",
    )
    .order("created_at", { ascending: false })
    .limit(5);

  const orgIds = [...new Set((imports ?? []).map((i) => i.org_id))];
  const orgNameById = new Map<string, string>();
  if (orgIds.length) {
    const { data: orgs } = await supabase
      .from("organisations")
      .select("id, name")
      .in("id", orgIds);
    for (const o of orgs ?? []) orgNameById.set(o.id, o.name);
  }

  const totalContacts = contacts.count ?? 0;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A snapshot of clients, contacts and marketing eligibility across Nexai."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Clients" value={clients.count ?? 0} tone="brand" />
        <StatTile label="Contacts" value={totalContacts} />
        <StatTile
          label="Pending review"
          value={pending.count ?? 0}
          tone="warning"
        />
        <StatTile label="Eligible" value={eligible.count ?? 0} tone="success" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Eligibility</CardTitle>
          </CardHeader>
          <CardBody>
            <EligibilityBar
              pending={pending.count ?? 0}
              eligible={eligible.count ?? 0}
              ineligible={ineligible.count ?? 0}
            />
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Pending review" value={pending.count ?? 0} tone="warning" />
              <Row label="Eligible" value={eligible.count ?? 0} tone="success" />
              <Row label="Ineligible" value={ineligible.count ?? 0} tone="danger" />
            </dl>
            <p className="mt-4 text-xs text-fg-subtle">
              Contacts are never auto-approved. Eligibility only changes with
              recorded permission evidence.
            </p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent imports</CardTitle>
            <Link
              href="/imports"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            {imports && imports.length > 0 ? (
              <ul className="divide-y divide-border">
                {imports.map((imp) => (
                  <li key={imp.id} className="px-5 py-3">
                    <Link
                      href={`/imports/${imp.id}`}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">
                          {imp.filename}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {orgNameById.get(imp.org_id) ?? "Unknown client"} ·{" "}
                          {formatDateTime(imp.created_at)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge tone="success">{imp.accepted_count} accepted</Badge>
                        {imp.rejected_count > 0 && (
                          <Badge tone="danger">{imp.rejected_count} rejected</Badge>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  title="No imports yet"
                  description="Upload a CSV from the Imports tab to bring in contacts."
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "success" | "danger";
}) {
  const dot: Record<string, string> = {
    warning: "bg-warning",
    success: "bg-success",
    danger: "bg-danger",
  };
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-fg-muted">
        <span className={`h-2 w-2 rounded-full ${dot[tone]}`} />
        {label}
      </span>
      <span className="font-medium tabular-nums text-fg">{value}</span>
    </div>
  );
}

function EligibilityBar({
  pending,
  eligible,
  ineligible,
}: {
  pending: number;
  eligible: number;
  ineligible: number;
}) {
  const total = pending + eligible + ineligible;
  if (total === 0) {
    return (
      <div className="h-3 w-full rounded-full bg-surface-2" aria-hidden="true" />
    );
  }
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2"
      role="img"
      aria-label={`Eligibility: ${pending} pending, ${eligible} eligible, ${ineligible} ineligible`}
    >
      <div className="bg-warning" style={{ width: pct(pending) }} />
      <div className="bg-success" style={{ width: pct(eligible) }} />
      <div className="bg-danger" style={{ width: pct(ineligible) }} />
    </div>
  );
}
