import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EligibilityBadge, Badge, suppressionLabel } from "@/components/ui/Badge";
import { EVIDENCE_TYPE_LABEL } from "@/lib/contacts/evidence";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EligibilityForm } from "./EligibilityForm";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!contact) notFound();

  const [{ data: org }, { data: evidence }] = await Promise.all([
    supabase
      .from("organisations")
      .select("id, name, org_code")
      .eq("id", contact.org_id)
      .maybeSingle(),
    supabase
      .from("permission_evidence")
      .select("*")
      .eq("contact_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const name =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
    contact.email;
  const customFields = Object.entries(contact.custom_fields ?? {});

  return (
    <div>
      <Link
        href="/contacts"
        className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to contacts
      </Link>
      <PageHeader
        title={name}
        description={org ? `${org.name} · ${org.org_code}` : undefined}
        actions={<EligibilityBadge status={contact.eligibility_status} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
            </CardHeader>
            <CardBody>
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <Detail label="Email" value={contact.email} />
                <Detail label="Customer status" value={contact.customer_status} />
                <Detail label="First name" value={contact.first_name} />
                <Detail label="Last name" value={contact.last_name} />
                <Detail label="Phone" value={contact.phone} />
                <Detail
                  label="Last purchase"
                  value={formatDate(contact.last_purchase_date)}
                />
                {contact.suppression_reason && (
                  <Detail
                    label="Suppression"
                    value={suppressionLabel(contact.suppression_reason)}
                  />
                )}
              </dl>

              {customFields.length > 0 && (
                <div className="mt-6 border-t border-border pt-4">
                  <p className="mb-3 text-sm font-medium text-fg">
                    Additional imported fields
                  </p>
                  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {customFields.map(([k, v]) => (
                      <Detail key={k} label={k} value={String(v)} />
                    ))}
                  </dl>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permission evidence</CardTitle>
              <Badge tone={evidence && evidence.length > 0 ? "success" : "neutral"}>
                {evidence?.length ?? 0} on file
              </Badge>
            </CardHeader>
            <CardBody className="p-0">
              {evidence && evidence.length > 0 ? (
                <ul className="divide-y divide-border">
                  {evidence.map((e) => (
                    <li key={e.id} className="px-5 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-fg">
                          {EVIDENCE_TYPE_LABEL[e.evidence_type]}
                        </span>
                        <span className="text-xs text-fg-subtle">
                          {formatDateTime(e.captured_at ?? e.created_at)}
                        </span>
                      </div>
                      {e.source && (
                        <p className="mt-1 text-sm text-fg-muted">{e.source}</p>
                      )}
                      {e.notes && (
                        <p className="mt-1 text-xs text-fg-subtle">{e.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-fg-muted">
                  No permission evidence recorded. This contact cannot be marked
                  eligible until documented consent is on file.
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-600" />
                  Marketing eligibility
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              <EligibilityForm
                contactId={contact.id}
                currentStatus={contact.eligibility_status}
                currentSuppression={contact.suppression_reason}
                hasExistingEvidence={(evidence?.length ?? 0) > 0}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm text-fg">{value || "—"}</dd>
    </div>
  );
}
