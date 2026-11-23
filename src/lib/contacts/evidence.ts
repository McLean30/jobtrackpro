import type { EvidenceType } from "@/lib/supabase/database.types";

export const EVIDENCE_TYPES = [
  "signup_form",
  "double_opt_in",
  "purchase",
  "contract",
  "verbal",
  "imported_documentation",
  "other",
] as const;

export const EVIDENCE_TYPE_LABEL: Record<EvidenceType, string> = {
  signup_form: "Website / signup form",
  double_opt_in: "Double opt-in",
  purchase: "Purchase relationship",
  contract: "Contract / agreement",
  verbal: "Verbal consent (recorded)",
  imported_documentation: "Imported documentation",
  other: "Other (see notes)",
};
