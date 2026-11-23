"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { organisationSchema } from "@/lib/validation";
import { slugifyOrgCode, withSuffix } from "@/lib/org-code";

export interface ActionState {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return organisationSchema.safeParse({
    name: formData.get("name") ?? "",
    legal_name: formData.get("legal_name") ?? "",
    contact_email: formData.get("contact_email") ?? "",
    contact_phone: formData.get("contact_phone") ?? "",
    website: formData.get("website") ?? "",
    notes: formData.get("notes") ?? "",
    status: formData.get("status") ?? "active",
  });
}

function flattenErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const raw = issue.path[0];
    const key = raw === undefined ? "form" : String(raw);
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createOrganisation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== "nexai_admin") {
    return { ok: false, error: "You do not have permission to do this." };
  }

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const base = slugifyOrgCode(parsed.data.name);

  let createdId: string | null = null;
  for (let attempt = 1; attempt <= 25 && !createdId; attempt++) {
    const org_code = withSuffix(base, attempt);
    const { data, error } = await supabase
      .from("organisations")
      .insert({
        org_code,
        name: parsed.data.name,
        legal_name: parsed.data.legal_name,
        contact_email: parsed.data.contact_email,
        contact_phone: parsed.data.contact_phone,
        website: parsed.data.website,
        notes: parsed.data.notes,
        status: parsed.data.status,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (!error && data) {
      createdId = data.id;
      break;
    }
    // 23505 = unique violation (org_code clash) → try next suffix
    if (error && error.code !== "23505") {
      return { ok: false, error: error.message };
    }
  }

  if (!createdId) {
    return { ok: false, error: "Could not allocate a unique organisation code." };
  }

  await logAudit({
    action: "organisation.created",
    entityType: "organisation",
    entityId: createdId,
    orgId: createdId,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/clients");
  redirect(`/clients/${createdId}`);
}

export async function updateOrganisation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user || user.profile?.role !== "nexai_admin") {
    return { ok: false, error: "You do not have permission to do this." };
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Missing organisation id." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { ok: false, fieldErrors: flattenErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("organisations")
    .update({
      name: parsed.data.name,
      legal_name: parsed.data.legal_name,
      contact_email: parsed.data.contact_email,
      contact_phone: parsed.data.contact_phone,
      website: parsed.data.website,
      notes: parsed.data.notes,
      status: parsed.data.status,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logAudit({
    action: "organisation.updated",
    entityType: "organisation",
    entityId: id,
    orgId: id,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}?updated=1`);
}
