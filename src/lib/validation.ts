import { z } from "zod";
import {
  ELIGIBILITY_STATUSES,
  SUPPRESSION_REASONS,
} from "@/lib/contacts/types";
import { EVIDENCE_TYPES } from "@/lib/contacts/evidence";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

export const organisationSchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  legal_name: optionalText(200),
  contact_email: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine(
      (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
      "Enter a valid email address",
    ),
  contact_phone: optionalText(50),
  website: optionalText(200),
  notes: optionalText(2000),
  status: z.enum(["active", "archived"]).default("active"),
});

export type OrganisationInput = z.infer<typeof organisationSchema>;

export const eligibilitySchema = z.object({
  status: z.enum(ELIGIBILITY_STATUSES),
  suppression_reason: z.enum(SUPPRESSION_REASONS).nullable().default(null),
  evidence_type: z.enum(EVIDENCE_TYPES).optional(),
  evidence_source: optionalText(300),
  evidence_notes: optionalText(2000),
});

export type EligibilityInput = z.infer<typeof eligibilitySchema>;
