import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatTile } from "@/components/ui/StatTile";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: batch } = await supabase
    .from("import_batches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!batch) notFound();

  const { data: org } = await supabase
    .from("organisations")
    .select("id, name, org_code")
    .eq("id", batch.org_id)
    .maybeSingle();

  const mapping = Object.entries(batch.column_mapping ?? {});

  return (
    <div>
      <Link
        href="/imports"
        className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to imports
      </Link>
      <PageHeader
        title={batch.filename}
        description={`${org?.name ?? "Unknown client"} · ${formatDateTime(batch.created_at)}`}
        actions={
          <Link href={`/contacts?org=${batch.org_id}&batch=${batch.id}`}>
            <Button variant="secondary">View contacts</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total rows" value={batch.total_rows} />
        <StatTile label="Accepted" value={batch.accepted_count} tone="success" />
        <StatTile
          label="Pending review"
          value={batch.pending_review_count}
          tone="warning"
        />
        <StatTile label="Rejected" value={batch.rejected_count} tone="danger" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rejection breakdown</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <Row label="Duplicates (within file + existing)" value={batch.duplicate_count} />
            <Row label="Malformed email addresses" value={batch.malformed_count} />
            <Row label="Missing email addresses" value={batch.missing_email_count} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Column mapping used</CardTitle>
          </CardHeader>
          <CardBody>
            {mapping.length > 0 ? (
              <dl className="space-y-2 text-sm">
                {mapping.map(([field, header]) => (
                  <div key={field} className="flex justify-between gap-4">
                    <dt className="text-fg-muted">{field}</dt>
                    <dd className="font-medium text-fg">{String(header)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-fg-muted">No mapping recorded.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <p className="mt-6 text-xs text-fg-subtle">
        Every accepted contact from this import was set to{" "}
        <strong>pending review</strong>. No marketing consent is assumed.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-muted">{label}</span>
      <span className="font-medium tabular-nums text-fg">{value}</span>
    </div>
  );
}
