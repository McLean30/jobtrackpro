import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ClientForm } from "../ClientForm";
import { createOrganisation } from "../actions";

export const metadata: Metadata = { title: "New client" };

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/clients"
        className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>
      <PageHeader
        title="New client"
        description="A unique organisation ID is generated automatically from the company name."
      />
      <Card>
        <CardBody className="p-6">
          <ClientForm action={createOrganisation} submitLabel="Create client" />
        </CardBody>
      </Card>
    </div>
  );
}
