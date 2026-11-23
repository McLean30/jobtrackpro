"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { eligibilitySchema } from "@/lib/validation";
import { validateEligibilityChange } from "@/lib/contacts/eligibility";

export interface EligibilityActionState {
  ok: boolean;
  error?: string;
  message?: string;
}

export async function updateContactEligibility(
  _prev: EligibilityActionState,
  formData: FormData,
): Promise<EligibilityActionState> {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== "nexai_admin") {
    return { ok: false, error: "You do not have permission to do this." };
  }

  const contactId = String(formData.get("contactId") ?? "");
  if (!contactId) return { ok: false, error: "Missing contact id." };

  const rawReason = String(formData.get("suppression_reason") ?? "");
  const parsed = eligibilitySchema.safeParse({
    status: formData.get("status") ?? "",
    suppression_reason: rawReason === "" ? null : rawReason,
    evidence_type: formData.get("evidence_type") || undefined,
    evidence_source: formData.get("evidence_source") ?? "",
    evidence_notes: formData.get("evidence_notes") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const input = parsed.data;
  // A suppression reason only applies to an ineligible contact.
  const finalReason =
    input.status === "ineligible" ? input.suppression_reason : null;

  const supabase = await createClient();

  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("id, org_id, eligibility_status")
    .eq("id", contactId)
    .single();
  if (fetchError || !contact) {
    return { ok: false, error: "Contact not found." };
  }

  const { count: existingEvidence } = await supabase
    .from("permission_evidence")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId);

  const providingEvidence = Boolean(input.evidence_type);
  const hasEvidence = (existingEvidence ?? 0) > 0 || providingEvidence;

  const check = validateEligibilityChange({
    status: input.status,
    suppressionReason: finalReason,
    hasEvidence,
  });
  if (!check.ok) {
    return { ok: false, error: check.error };
  }

  // Record new permission evidence (stored separately from the contact).
  if (providingEvidence && input.evidence_type) {
    const { error: evErr } = await supabase.from("permission_evidence").insert({
      contact_id: contactId,
      org_id: contact.org_id,
      evidence_type: input.evidence_type,
      source: input.evidence_source,
      notes: input.evidence_notes,
      captured_at: new Date().toISOString(),
      recorded_by: user.id,
    });
    if (evErr) return { ok: false, error: evErr.message };
  }

  const { error: updErr } = await supabase
    .from("contacts")
    .update({
      eligibility_status: input.status,
      suppression_reason: finalReason,
    })
    .eq("id", contactId);
  if (updErr) return { ok: false, error: updErr.message };

  await logAudit({
    action:
      finalReason !== null ? "contact.suppressed" : "contact.eligibility_changed",
    entityType: "contact",
    entityId: contactId,
    orgId: contact.org_id,
    metadata: {
      from: contact.eligibility_status,
      to: input.status,
      suppression_reason: finalReason,
      evidence_recorded: providingEvidence,
    },
  });

  revalidatePath("/contacts");
  revalidatePath(`/contacts/${contactId}`);
  return { ok: true, message: "Contact eligibility updated." };
}
