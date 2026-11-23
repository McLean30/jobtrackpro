/**
 * Shared domain types for contacts, eligibility and CSV import.
 * These enums mirror the Postgres enums defined in the SQL migrations —
 * keep the two in sync.
 */

export const ELIGIBILITY_STATUSES = [
  "pending_review",
  "eligible",
  "ineligible",
] as const;
export type EligibilityStatus = (typeof ELIGIBILITY_STATUSES)[number];

export const SUPPRESSION_REASONS = [
  "unsubscribed",
  "complaint",
  "hard_bounce",
  "manual_exclusion",
] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

/** Target fields a CSV column can be mapped to. */
export const CONTACT_TARGET_FIELDS = [
  "email",
  "first_name",
  "last_name",
  "customer_status",
  "last_purchase_date",
  "phone",
] as const;
export type ContactTargetField = (typeof CONTACT_TARGET_FIELDS)[number];

/** Human-readable labels + whether the field is required for an import. */
export const TARGET_FIELD_META: Record<
  ContactTargetField,
  { label: string; required: boolean }
> = {
  email: { label: "Email address", required: true },
  first_name: { label: "First name", required: false },
  last_name: { label: "Last name", required: false },
  customer_status: { label: "Customer status", required: false },
  last_purchase_date: { label: "Last purchase date", required: false },
  phone: { label: "Phone", required: false },
};

/** Why a row was rejected during import. */
export type RejectionReason =
  | "missing_email"
  | "malformed_email"
  | "duplicate_in_file"
  | "duplicate_existing";

export interface PreparedContact {
  email: string;
  email_normalized: string;
  first_name: string | null;
  last_name: string | null;
  customer_status: string | null;
  last_purchase_date: string | null; // ISO yyyy-mm-dd or null
  phone: string | null;
  /** Any mapped-but-non-standard columns, preserved as key/value. */
  custom_fields: Record<string, string>;
  /** Always pending_review on import — never auto-approved. */
  eligibility_status: EligibilityStatus;
}

export interface RejectedRow {
  rowNumber: number; // 1-based data row (excludes header)
  reason: RejectionReason;
  email: string | null;
}

export type ImportSummary = {
  totalRows: number;
  accepted: number;
  rejected: number;
  pendingReview: number;
  duplicatesInFile: number;
  duplicatesExisting: number;
  malformed: number;
  missingEmail: number;
}

export interface ImportResult {
  accepted: PreparedContact[];
  rejected: RejectedRow[];
  summary: ImportSummary;
}
