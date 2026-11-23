import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string | null;
  orgId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Append a row to the audit trail for a sensitive action. Best-effort:
 * a logging failure is reported but never rolls back the user's action.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      org_id: entry.orgId ?? null,
      metadata: entry.metadata ?? {},
    });
    if (error) {
      console.error("[audit] failed to write entry", entry.action, error.message);
    }
  } catch (err) {
    console.error("[audit] unexpected error", err);
  }
}
