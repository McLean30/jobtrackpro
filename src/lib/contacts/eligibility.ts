import {
  ELIGIBILITY_STATUSES,
  SUPPRESSION_REASONS,
  type EligibilityStatus,
  type SuppressionReason,
} from "./types";

/** Every imported/created contact starts here. Consent is never assumed. */
export function defaultEligibilityStatus(): EligibilityStatus {
  return "pending_review";
}

export interface EligibilityChangeInput {
  status: EligibilityStatus;
  suppressionReason: SuppressionReason | null;
  hasEvidence: boolean;
}

export interface EligibilityChangeResult {
  ok: boolean;
  error?: string;
}

/**
 * Enforce the consent rules for a manual eligibility change:
 *  - A contact can only be made `eligible` when recorded permission evidence
 *    exists (no automatic approvals).
 *  - A suppression reason is only valid on an `ineligible` contact.
 */
export function validateEligibilityChange(
  input: EligibilityChangeInput,
): EligibilityChangeResult {
  const { status, suppressionReason, hasEvidence } = input;

  if (!ELIGIBILITY_STATUSES.includes(status)) {
    return { ok: false, error: "Unknown eligibility status." };
  }
  if (
    suppressionReason !== null &&
    !SUPPRESSION_REASONS.includes(suppressionReason)
  ) {
    return { ok: false, error: "Unknown suppression reason." };
  }

  switch (status) {
    case "eligible":
      if (suppressionReason !== null) {
        return {
          ok: false,
          error: "An eligible contact cannot carry a suppression reason.",
        };
      }
      if (!hasEvidence) {
        return {
          ok: false,
          error:
            "Marking a contact eligible requires recorded permission evidence.",
        };
      }
      return { ok: true };

    case "pending_review":
      if (suppressionReason !== null) {
        return {
          ok: false,
          error: "A pending-review contact cannot carry a suppression reason.",
        };
      }
      return { ok: true };

    case "ineligible":
      return { ok: true };

    default:
      return { ok: false, error: "Unknown eligibility status." };
  }
}
