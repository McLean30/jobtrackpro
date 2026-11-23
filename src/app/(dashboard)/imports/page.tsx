import Link from "next/link";
import type { Metadata } from "next";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableWrap, Table, Th, Td, Tr } from "@/components/ui/Table";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Imports" };
export const dynamic = "force-dynamic";

export default async function ImportsPage() {
  const supabase = await createClient();

  const { data: batches } = await supabase
    .from("import_batches")
    .select(
      "id, org_id, filename, created_at, total_rows, accepted_count, rejected_count, pending_review_count, duplicate_count",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const orgIds = [...new Set((batches ?? []).map((b) => b.org_id))];
  const orgNameById = new Map<string, string>();
  if (orgIds.length) {
    const { data: orgs } = await supabase
      .from("organisations")
      .select("id, name")
      .in("id", orgIds);
    for (const o of orgs ?? []) orgNameById.set(o.id, o.name);
  }

  return (
    <div>
      <PageHeader
        title="Imports"
        description="CSV imports and their outcomes. Imported contacts are always set to pending review."
        actions={
          <Link href="/imports/new">
            <Button>
              <Upload className="h-4 w-4" /> New import
            </Button>
          </Link>
        }
      />

      {batches && batches.length > 0 ? (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <Th>File</Th>
                <Th>Client</Th>
                <Th>Date</Th>
                <Th className="text-right">Rows</Th>
                <Th className="text-right">Accepted</Th>
                <Th className="text-right">Rejected</Th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <Tr key={b.id}>
                  <Td>
                    <Link
                      href={`/imports/${b.id}`}
                      className="font-medium text-fg hover:text-brand-600"
                    >
                      {b.filename}
                    </Link>
                  </Td>
                  <Td className="text-fg-muted">
                    {orgNameById.get(b.org_id) ?? "—"}
                  </Td>
                  <Td className="text-fg-muted">{formatDateTime(b.created_at)}</Td>
                  <Td className="text-right tabular-nums">{b.total_rows}</Td>
                  <Td className="text-right">
                    <Badge tone="success">{b.accepted_count}</Badge>
                  </Td>
                  <Td className="text-right">
                    {b.rejected_count > 0 ? (
                      <Badge tone="danger">{b.rejected_count}</Badge>
                    ) : (
                      <span className="text-fg-subtle">0</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      ) : (
        <EmptyState
          icon={<Upload className="h-8 w-8" />}
          title="No imports yet"
          description="Upload a CSV of customer contacts to get started. You can preview and map columns before anything is saved."
          action={
            <Link href="/imports/new">
              <Button>
                <Upload className="h-4 w-4" /> New import
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
