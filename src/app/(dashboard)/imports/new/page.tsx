import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ImportWizard } from "./ImportWizard";

export const metadata: Metadata = { title: "New import" };
export const dynamic = "force-dynamic";

export default async function NewImportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initialOrgId = typeof sp.org === "string" ? sp.org : undefined;

  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from("organisations")
    .select("id, name")
    .eq("status", "active")
    .order("name");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/imports"
        className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to imports
      </Link>
      <PageHeader
        title="New import"
        description="Upload a CSV, preview it, map the columns, then confirm. Contacts are added as pending review."
      />

      {orgs && orgs.length > 0 ? (
        <ImportWizard orgs={orgs} initialOrgId={initialOrgId} />
      ) : (
        <EmptyState
          title="No active clients"
          description="Create a client organisation before importing contacts."
          action={
            <Link href="/clients/new">
              <Button>New client</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
