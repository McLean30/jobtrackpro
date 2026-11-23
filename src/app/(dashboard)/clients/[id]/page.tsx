import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Upload, Users, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ClientForm } from "../ClientForm";
import { updateOrganisation } from "../actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const { updated } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organisations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!org) notFound();

  const { data: counts } = await supabase
    .from("org_contact_counts")
    .select("*")
    .eq("org_id", id)
    .maybeSingle();

  return (
    <div>
      <Link
        href="/clients"
        className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>
      <PageHeader
        title={org.name}
        description={`Organisation ID: ${org.org_code}`}
        actions={
          <Link href={`/imports/new?org=${org.id}`}>
            <Button variant="secondary">
              <Upload className="h-4 w-4" /> Import contacts
            </Button>
          </Link>
        }
      />

      {updated && (
        <p className="mb-4 flex items-center gap-2 rounded-[var(--radius)] bg-success-bg px-3 py-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> Client details saved.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Client details</CardTitle>
              <Badge tone={org.status === "active" ? "success" : "neutral"}>
                {org.status === "active" ? "Active" : "Archived"}
              </Badge>
            </CardHeader>
            <CardBody className="p-6">
              <ClientForm
                action={updateOrganisation}
                initial={org}
                submitLabel="Save changes"
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <Link
                href={`/contacts?org=${org.id}`}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                View
              </Link>
            </CardHeader>
            <CardBody className="space-y-3">
              <SummaryRow
                icon={<Users className="h-4 w-4" />}
                label="Total"
                value={counts?.total ?? 0}
              />
              <SummaryRow label="Pending review" value={counts?.pending_review ?? 0} tone="warning" />
              <SummaryRow label="Eligible" value={counts?.eligible ?? 0} tone="success" />
              <SummaryRow label="Ineligible" value={counts?.ineligible ?? 0} tone="danger" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Record</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2 text-sm text-fg-muted">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-fg">{formatDate(org.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Last updated</span>
                <span className="text-fg">{formatDate(org.updated_at)}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  tone,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number;
  tone?: "warning" | "success" | "danger";
}) {
  const color =
    tone === "warning"
      ? "text-warning"
      : tone === "success"
        ? "text-success"
        : tone === "danger"
          ? "text-danger"
          : "text-fg";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-fg-muted">
        {icon}
        {label}
      </span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
