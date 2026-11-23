import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: audit } = await supabase
    .from("audit_log")
    .select("id, action, entity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Account, audit trail and the scope of this release."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm">
            <Field label="Email" value={user?.email ?? "—"} />
            <Field
              label="Role"
              value={
                <Badge tone="brand">
                  {user?.profile?.role === "nexai_admin"
                    ? "Nexai administrator"
                    : (user?.profile?.role ?? "—")}
                </Badge>
              }
            />
            <p className="pt-2 text-xs text-fg-muted">
              Admin accounts are provisioned in Supabase. There is no public
              sign-up, and customer databases are never publicly accessible.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About this release</CardTitle>
            <Badge tone="neutral">Milestone 1</Badge>
          </CardHeader>
          <CardBody className="space-y-2 text-sm text-fg-muted">
            <p>Foundation and contact intake: authentication, clients, CSV import, eligibility and audit.</p>
            <p className="pt-1 font-medium text-fg">Deferred to later milestones</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>Email provider (Brevo) integration and sending</li>
              <li>AI-assisted campaigns (OpenAI)</li>
              <li>Reply classification and follow-up</li>
              <li>Sales tracking, billing and commission</li>
            </ul>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity (audit trail)</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {audit && audit.length > 0 ? (
              <ul className="divide-y divide-border">
                {audit.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between px-5 py-2.5 text-sm"
                  >
                    <span className="font-medium text-fg">{a.action}</span>
                    <span className="flex items-center gap-3 text-xs text-fg-muted">
                      <span>{a.entity_type}</span>
                      <span>{formatDateTime(a.created_at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-sm text-fg-muted">
                No audit entries yet. Sensitive actions (client changes, imports,
                eligibility updates) are recorded here.
              </p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-muted">{label}</span>
      <span className="font-medium text-fg">{value}</span>
    </div>
  );
}
