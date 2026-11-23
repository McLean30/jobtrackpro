import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseCsv } from "@/lib/contacts/csv";
import { processImport, type ColumnMapping } from "@/lib/contacts/import";
import { logAudit } from "@/lib/audit";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB hard stop

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== "nexai_admin") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const orgId = String(form.get("orgId") ?? "");
  const mappingRaw = String(form.get("mapping") ?? "{}");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!orgId) {
    return NextResponse.json({ error: "No client selected." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is too large." }, { status: 413 });
  }

  let mapping: ColumnMapping;
  try {
    mapping = JSON.parse(mappingRaw);
  } catch {
    return NextResponse.json({ error: "Invalid column mapping." }, { status: 400 });
  }
  if (!mapping.email) {
    return NextResponse.json(
      { error: "You must map a column to the email field." },
      { status: 400 },
    );
  }

  const text = await file.text();
  const parsed = parseCsv(text);
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const supabase = await createClient();

  // Existing emails for this org (RLS ensures we can only read orgs we access).
  const { data: existing, error: exErr } = await supabase
    .from("contacts")
    .select("email_normalized")
    .eq("org_id", orgId);
  if (exErr) {
    return NextResponse.json(
      { error: "Could not read existing contacts for this client." },
      { status: 403 },
    );
  }
  const existingNormalizedEmails = (existing ?? []).map(
    (r) => r.email_normalized,
  );

  const result = processImport(parsed.rows, mapping, {
    existingNormalizedEmails,
  });

  const { data: batch, error: batchErr } = await supabase
    .from("import_batches")
    .insert({
      org_id: orgId,
      filename: file.name || "upload.csv",
      status: "completed",
      column_mapping: mapping as Record<string, string>,
      total_rows: result.summary.totalRows,
      accepted_count: result.summary.accepted,
      rejected_count: result.summary.rejected,
      pending_review_count: result.summary.pendingReview,
      duplicate_count:
        result.summary.duplicatesInFile + result.summary.duplicatesExisting,
      malformed_count: result.summary.malformed,
      missing_email_count: result.summary.missingEmail,
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (batchErr || !batch) {
    return NextResponse.json(
      { error: batchErr?.message ?? "Could not create import batch." },
      { status: 400 },
    );
  }

  // Insert accepted contacts in chunks. All default to pending_review.
  const CHUNK = 500;
  const toInsert = result.accepted.map((c) => ({
    org_id: orgId,
    import_batch_id: batch.id,
    email: c.email,
    email_normalized: c.email_normalized,
    first_name: c.first_name,
    last_name: c.last_name,
    customer_status: c.customer_status,
    last_purchase_date: c.last_purchase_date,
    phone: c.phone,
    custom_fields: c.custom_fields,
    eligibility_status: "pending_review" as const,
    created_by: user.id,
  }));

  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const { error: insErr } = await supabase
      .from("contacts")
      .insert(toInsert.slice(i, i + CHUNK));
    if (insErr) {
      return NextResponse.json(
        {
          error: `Saved the batch but a contact chunk failed: ${insErr.message}`,
          batchId: batch.id,
        },
        { status: 500 },
      );
    }
  }

  await logAudit({
    action: "import.completed",
    entityType: "import_batch",
    entityId: batch.id,
    orgId,
    metadata: result.summary,
  });

  return NextResponse.json({
    ok: true,
    batchId: batch.id,
    summary: result.summary,
    rejectedSample: result.rejected.slice(0, 50),
  });
}
