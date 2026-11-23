import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, org_code, name, status, contact_email, created_at")
    .order("created_at", { ascending: false });

  const { data: counts } = await supabase
    .from("org_contact_counts")
    .select("org_id, total, pending_review");

  const countByOrg = new Map(counts?.map((c) => [c.org_id, c]) ?? []);

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Client organisations Nexai manages. Each has a unique organisation ID."
        actions={
          <Link href="/clients/new">
            <Button>
              <Plus className="h-4 w-4" /> New client
            </Button>
          </Link>
        }
      />

      {orgs && orgs.length > 0 ? (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>Organisation</Th>
                <Th>Org ID</Th>
                <Th>Status</Th>
                <Th className="text-right">Contacts</Th>
                <Th className="text-right">Pending</Th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => {
                const c = countByOrg.get(o.id);
                return (
                  <Tr key={o.id} className="cursor-pointer">
                    <Td>
                      <Link
                        href={`/clients/${o.id}`}
                        className="font-medium text-fg hover:text-brand-600"
                      >
                        {o.name}
                      </Link>
                      {o.contact_email && (
                        <div className="text-xs text-fg-muted">
                          {o.contact_email}
                        </div>
                      )}
                    </Td>
                    <Td>
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-fg-muted">
                        {o.org_code}
                      </code>
                    </Td>
                    <Td>
                      <Badge tone={o.status === "active" ? "success" : "neutral"}>
                        {o.status === "active" ? "Active" : "Archived"}
                      </Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{c?.total ?? 0}</Td>
                    <Td className="text-right tabular-nums">
                      {c?.pending_review ?? 0}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      ) : (
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="No clients yet"
          description="Create your first client organisation to start managing their customer database."
          action={
            <Link href="/clients/new">
              <Button>
                <Plus className="h-4 w-4" /> New client
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
