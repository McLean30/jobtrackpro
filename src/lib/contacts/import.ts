import { normalizeEmail, isValidEmail } from "./email";
import { parseDateToIso } from "./dates";
import {
  type ContactTargetField,
  type ImportResult,
  type PreparedContact,
  type RejectedRow,
} from "./types";

/** Maps a target contact field to the CSV header that supplies it. */
export type ColumnMapping = Partial<Record<ContactTargetField, string>>;

export interface ProcessOptions {
  /** Normalised emails that already exist for this organisation. */
  existingNormalizedEmails?: Iterable<string>;
}

/**
 * Validate, normalise and de-duplicate parsed CSV rows against a column
 * mapping. Accepted contacts are ALWAYS defaulted to pending_review — this
 * function never grants marketing eligibility.
 */
export function processImport(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  options: ProcessOptions = {},
): ImportResult {
  const existing = new Set<string>();
  for (const e of options.existingNormalizedEmails ?? []) {
    existing.add(normalizeEmail(e));
  }

  const mappedHeaders = new Set(
    Object.values(mapping).filter((h): h is string => Boolean(h)),
  );
  const seenInFile = new Set<string>();

  const accepted: PreparedContact[] = [];
  const rejected: RejectedRow[] = [];
  let duplicatesInFile = 0;
  let duplicatesExisting = 0;
  let malformed = 0;
  let missingEmail = 0;

  const field = (row: Record<string, string>, f: ContactTargetField) => {
    const header = mapping[f];
    if (!header) return null;
    const v = (row[header] ?? "").trim();
    return v === "" ? null : v;
  };

  rows.forEach((row, i) => {
    const rowNumber = i + 1;
    const rawEmail = mapping.email ? (row[mapping.email] ?? "") : "";
    const trimmedEmail = rawEmail.trim();
    const normalized = normalizeEmail(rawEmail);

    if (normalized === "") {
      missingEmail += 1;
      rejected.push({ rowNumber, reason: "missing_email", email: null });
      return;
    }
    if (!isValidEmail(normalized)) {
      malformed += 1;
      rejected.push({ rowNumber, reason: "malformed_email", email: trimmedEmail });
      return;
    }
    if (existing.has(normalized)) {
      duplicatesExisting += 1;
      rejected.push({ rowNumber, reason: "duplicate_existing", email: trimmedEmail });
      return;
    }
    if (seenInFile.has(normalized)) {
      duplicatesInFile += 1;
      rejected.push({ rowNumber, reason: "duplicate_in_file", email: trimmedEmail });
      return;
    }

    seenInFile.add(normalized);

    const custom_fields: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      if (mappedHeaders.has(key)) continue;
      const v = (row[key] ?? "").trim();
      if (v !== "") custom_fields[key] = v;
    }

    accepted.push({
      email: trimmedEmail,
      email_normalized: normalized,
      first_name: field(row, "first_name"),
      last_name: field(row, "last_name"),
      customer_status: field(row, "customer_status"),
      last_purchase_date: parseDateToIso(field(row, "last_purchase_date")),
      phone: field(row, "phone"),
      custom_fields,
      eligibility_status: "pending_review",
    });
  });

  return {
    accepted,
    rejected,
    summary: {
      totalRows: rows.length,
      accepted: accepted.length,
      rejected: rejected.length,
      pendingReview: accepted.length,
      duplicatesInFile,
      duplicatesExisting,
      malformed,
      missingEmail,
    },
  };
}
