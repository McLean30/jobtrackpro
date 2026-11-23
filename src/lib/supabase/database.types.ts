/**
 * Hand-maintained types for the public schema. Keep in sync with the SQL
 * migrations under supabase/migrations. (If you later adopt
 * `supabase gen types typescript`, this file can be replaced by the output.)
 */
import type {
  EligibilityStatus,
  SuppressionReason,
} from "@/lib/contacts/types";

export type AppRole = "nexai_admin" | "org_member";
export type OrgStatus = "active" | "archived";
export type ImportStatus = "pending" | "processing" | "completed" | "failed";
export type EvidenceType =
  | "signup_form"
  | "double_opt_in"
  | "purchase"
  | "contract"
  | "verbal"
  | "imported_documentation"
  | "other";

export type OrganisationRow = {
  id: string;
  org_code: string;
  name: string;
  legal_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  notes: string | null;
  status: OrgStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

export type ImportBatchRow = {
  id: string;
  org_id: string;
  filename: string;
  status: ImportStatus;
  column_mapping: Record<string, string>;
  total_rows: number;
  accepted_count: number;
  rejected_count: number;
  pending_review_count: number;
  duplicate_count: number;
  malformed_count: number;
  missing_email_count: number;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export type ContactRow = {
  id: string;
  org_id: string;
  import_batch_id: string | null;
  email: string;
  email_normalized: string;
  first_name: string | null;
  last_name: string | null;
  customer_status: string | null;
  last_purchase_date: string | null;
  phone: string | null;
  custom_fields: Record<string, string>;
  eligibility_status: EligibilityStatus;
  suppression_reason: SuppressionReason | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PermissionEvidenceRow = {
  id: string;
  contact_id: string;
  org_id: string;
  evidence_type: EvidenceType;
  source: string | null;
  captured_at: string | null;
  document_url: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export type AuditLogRow = {
  id: string;
  org_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      organisations: Table<
        OrganisationRow,
        Partial<OrganisationRow> &
          Pick<OrganisationRow, "org_code" | "name">,
        Partial<OrganisationRow>
      >;
      profiles: Table<
        ProfileRow,
        Partial<ProfileRow> & Pick<ProfileRow, "id" | "email">,
        Partial<ProfileRow>
      >;
      import_batches: Table<
        ImportBatchRow,
        Partial<ImportBatchRow> & Pick<ImportBatchRow, "org_id" | "filename">,
        Partial<ImportBatchRow>
      >;
      contacts: Table<
        ContactRow,
        Partial<ContactRow> &
          Pick<ContactRow, "org_id" | "email" | "email_normalized">,
        Partial<ContactRow>
      >;
      permission_evidence: Table<
        PermissionEvidenceRow,
        Partial<PermissionEvidenceRow> &
          Pick<
            PermissionEvidenceRow,
            "contact_id" | "org_id" | "evidence_type"
          >,
        Partial<PermissionEvidenceRow>
      >;
      audit_log: Table<
        AuditLogRow,
        Partial<AuditLogRow> &
          Pick<AuditLogRow, "action" | "entity_type">,
        Partial<AuditLogRow>
      >;
    };
    Views: {
      org_contact_counts: {
        Row: {
          org_id: string;
          total: number;
          pending_review: number;
          eligible: number;
          ineligible: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_nexai_admin: { Args: Record<string, never>; Returns: boolean };
      is_org_member: { Args: { target_org: string }; Returns: boolean };
      has_org_access: { Args: { target_org: string }; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      org_status: OrgStatus;
      eligibility_status: EligibilityStatus;
      suppression_reason: SuppressionReason;
      import_status: ImportStatus;
      evidence_type: EvidenceType;
    };
  };
}
