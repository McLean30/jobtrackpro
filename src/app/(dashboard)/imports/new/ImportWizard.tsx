"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { parseCsv, type ParsedCsv } from "@/lib/contacts/csv";
import { processImport, type ColumnMapping } from "@/lib/contacts/import";
import {
  CONTACT_TARGET_FIELDS,
  TARGET_FIELD_META,
  type ContactTargetField,
} from "@/lib/contacts/types";

interface OrgOption {
  id: string;
  name: string;
}

interface CommitResult {
  batchId: string;
  summary: {
    totalRows: number;
    accepted: number;
    rejected: number;
    pendingReview: number;
    duplicatesInFile: number;
    duplicatesExisting: number;
    malformed: number;
    missingEmail: number;
  };
}

const SYNONYMS: Record<ContactTargetField, string[]> = {
  email: ["email", "e-mail", "email address", "mail"],
  first_name: ["first name", "firstname", "first", "given name", "forename"],
  last_name: ["last name", "lastname", "last", "surname", "family name"],
  customer_status: ["status", "customer status", "type", "segment", "membership"],
  last_purchase_date: [
    "last purchase",
    "last purchase date",
    "last order",
    "last order date",
    "last visit",
    "purchase date",
  ],
  phone: ["phone", "telephone", "mobile", "contact number", "phone number"],
};

function guessMapping(headers: string[]): ColumnMapping {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const mapping: ColumnMapping = {};
  for (const field of CONTACT_TARGET_FIELDS) {
    const idx = lower.findIndex((h) => SYNONYMS[field].includes(h));
    if (idx >= 0) mapping[field] = headers[idx];
  }
  return mapping;
}

export function ImportWizard({
  orgs,
  initialOrgId,
}: {
  orgs: OrgOption[];
  initialOrgId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "map" | "result">("select");
  const [orgId, setOrgId] = useState(initialOrgId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [error, setError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<CommitResult | null>(null);

  const preview = useMemo(() => {
    if (!parsed || !parsed.rows.length || !mapping.email) return null;
    return processImport(parsed.rows, mapping);
  }, [parsed, mapping]);

  function handleFile(f: File | null) {
    setError(null);
    setFile(f);
    setParsed(null);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const result = parseCsv(text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setParsed(result);
      setMapping(guessMapping(result.headers));
    };
    reader.onerror = () => setError("Could not read the file.");
    reader.readAsText(f);
  }

  function goToMap() {
    setError(null);
    if (!orgId) return setError("Choose a client first.");
    if (!parsed) return setError("Upload a valid CSV file.");
    setStep("map");
  }

  async function commit() {
    if (!file || !orgId) return;
    if (!mapping.email) return setError("Map a column to the email field.");
    setCommitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("orgId", orgId);
      fd.set("mapping", JSON.stringify(mapping));
      const res = await fetch("/api/imports", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Import failed.");
        setCommitting(false);
        return;
      }
      setResult(json);
      setStep("result");
      router.refresh();
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setCommitting(false);
    }
  }

  // ---- Result step ----------------------------------------------------------
  if (step === "result" && result) {
    const s = result.summary;
    return (
      <Card>
        <CardBody className="p-6">
          <div className="mb-5 flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="text-base font-semibold">Import complete</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Accepted" value={s.accepted} tone="success" />
            <StatTile label="Pending review" value={s.pendingReview} tone="warning" />
            <StatTile label="Rejected" value={s.rejected} tone="danger" />
            <StatTile label="Total rows" value={s.totalRows} />
          </div>
          <p className="mt-4 text-sm text-fg-muted">
            {s.duplicatesInFile + s.duplicatesExisting} duplicate(s),{" "}
            {s.malformed} malformed and {s.missingEmail} missing email(s) were
            rejected. All accepted contacts are set to <strong>pending review</strong>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/imports/${result.batchId}`}>
              <Button>View import summary</Button>
            </Link>
            <Link href={`/contacts?org=${orgId}&batch=${result.batchId}`}>
              <Button variant="secondary">View imported contacts</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setStep("select");
                setFile(null);
                setParsed(null);
                setResult(null);
                setMapping({});
              }}
            >
              Import another
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  // ---- Mapping step ----------------------------------------------------------
  if (step === "map" && parsed) {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Map columns</CardTitle>
            <span className="text-sm text-fg-muted">
              {parsed.rows.length} row(s)
            </span>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-fg-muted">
              Match your CSV columns to contact fields. Email is required.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {CONTACT_TARGET_FIELDS.map((field) => (
                <Field
                  key={field}
                  label={TARGET_FIELD_META[field].label}
                  htmlFor={`map-${field}`}
                  required={TARGET_FIELD_META[field].required}
                >
                  <Select
                    id={`map-${field}`}
                    value={mapping[field] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => {
                        const next = { ...m };
                        if (e.target.value) next[field] = e.target.value;
                        else delete next[field];
                        return next;
                      })
                    }
                  >
                    <option value="">— Not mapped —</option>
                    {parsed.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </Field>
              ))}
            </div>
          </CardBody>
        </Card>

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Mini label="Will accept" value={preview.summary.accepted} tone="success" />
                <Mini label="Duplicates in file" value={preview.summary.duplicatesInFile} />
                <Mini label="Malformed" value={preview.summary.malformed} tone="danger" />
                <Mini label="Missing email" value={preview.summary.missingEmail} tone="danger" />
              </div>
              <p className="mb-2 text-xs text-fg-subtle">
                First {Math.min(5, preview.accepted.length)} accepted rows.
                Duplicates against existing contacts are detected when you import.
              </p>
              <div className="scroll-thin overflow-x-auto rounded-[var(--radius)] border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2 text-left text-xs uppercase text-fg-muted">
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">First</th>
                      <th className="px-3 py-2">Last</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.accepted.slice(0, 5).map((c, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2">{c.email_normalized}</td>
                        <td className="px-3 py-2 text-fg-muted">{c.first_name ?? "—"}</td>
                        <td className="px-3 py-2 text-fg-muted">{c.last_name ?? "—"}</td>
                        <td className="px-3 py-2 text-fg-muted">{c.customer_status ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}

        {error && (
          <p role="alert" className="rounded-[var(--radius)] bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={commit} disabled={committing || !mapping.email}>
            {committing ? "Importing…" : "Import contacts"}
          </Button>
          <Button variant="ghost" onClick={() => setStep("select")}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // ---- Select + upload step --------------------------------------------------
  return (
    <Card>
      <CardBody className="space-y-5 p-6">
        <Field label="Client" htmlFor="org" required>
          <Select
            id="org"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          >
            <option value="">Select a client…</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <label
            htmlFor="file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius)] border-2 border-dashed border-border-strong bg-surface-2 px-6 py-10 text-center transition-colors hover:border-brand-400"
          >
            {file ? (
              <>
                <FileText className="mb-2 h-7 w-7 text-brand-600" />
                <span className="text-sm font-medium text-fg">{file.name}</span>
                <span className="mt-1 text-xs text-fg-muted">
                  {parsed ? `${parsed.rows.length} rows detected` : "Reading…"}
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="mb-2 h-7 w-7 text-fg-subtle" />
                <span className="text-sm font-medium text-fg">
                  Choose a CSV file
                </span>
                <span className="mt-1 text-xs text-fg-muted">
                  Up to 5,000 contacts. Nothing is saved until you confirm.
                </span>
              </>
            )}
            <input
              id="file"
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="rounded-[var(--radius)] bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-fg-subtle">
            Imported contacts never receive marketing consent automatically.
          </p>
          <Button onClick={goToMap} disabled={!orgId || !parsed}>
            Continue
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger";
}) {
  const color =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : "text-fg";
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-3">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
