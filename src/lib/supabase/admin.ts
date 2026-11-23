import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Service-role Supabase client. Bypasses RLS — SERVER ONLY, never import
 * this into client code. Use sparingly for privileged maintenance tasks
 * (e.g. provisioning the first admin). Day-to-day access goes through the
 * request-scoped server client so RLS and the audit trail apply.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
