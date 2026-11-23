"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, Input, Textarea } from "@/components/ui/Field";
import {
  ELIGIBILITY_STATUSES,
  SUPPRESSION_REASONS,
  type EligibilityStatus,
  type SuppressionReason,
} from "@/lib/contacts/types";
import { suppressionLabel } from "@/components/ui/Badge";
import { EVIDENCE_TYPES, EVIDENCE_TYPE_LABEL } from "@/lib/contacts/evidence";
import {
  updateContactEligibility,
  type EligibilityActionState,
} from "../actions";

const STATUS_LABEL: Record<EligibilityStatus, string> = {
  pending_review: "Pending review",
  eligible: "Eligible",
  ineligible: "Ineligible",
};

export function EligibilityForm({
  contactId,
  currentStatus,
  currentSuppression,
  hasExistingEvidence,
}: {
  contactId: string;
  currentStatus: EligibilityStatus;
  currentSuppression: SuppressionReason | null;
  hasExistingEvidence: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    EligibilityActionState,
    FormData
  >(updateContactEligibility, { ok: false });

  const [status, setStatus] = useState<EligibilityStatus>(currentStatus);

  const evidenceRequired = status === "eligible" && !hasExistingEvidence;
  const showEvidence = status === "eligible";

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="contactId" value={contactId} />

      <Field label="Eligibility status" htmlFor="status">
        <Select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as EligibilityStatus)}
        >
          {ELIGIBILITY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </Select>
      </Field>

      {status === "ineligible" && (
        <Field
          label="Suppression reason"
          htmlFor="suppression_reason"
          hint="Optional. Records why this contact must not be marketed to."
        >
          <Select
            id="suppression_reason"
            name="suppression_reason"
            defaultValue={currentSuppression ?? ""}
          >
            <option value="">None specified</option>
            {SUPPRESSION_REASONS.map((r) => (
              <option key={r} value={r}>
                {suppressionLabel(r)}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {showEvidence && (
        <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-4">
          <p className="mb-3 text-sm font-medium text-fg">
            Permission evidence
            {evidenceRequired && <span className="text-danger"> *</span>}
          </p>
          <p className="mb-3 text-xs text-fg-muted">
            {hasExistingEvidence
              ? "Evidence is already on file. Add another record if you have more."
              : "Marking a contact eligible requires recorded permission evidence. It is stored separately from the contact."}
          </p>
          <div className="space-y-3">
            <Field label="Evidence type" htmlFor="evidence_type">
              <Select
                id="evidence_type"
                name="evidence_type"
                defaultValue=""
                required={evidenceRequired}
              >
                <option value="" disabled={evidenceRequired}>
                  {evidenceRequired ? "Select evidence type…" : "No new evidence"}
                </option>
                {EVIDENCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {EVIDENCE_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Source" htmlFor="evidence_source">
              <Input
                id="evidence_source"
                name="evidence_source"
                placeholder="e.g. Website newsletter signup, 12 Mar 2024"
              />
            </Field>
            <Field label="Notes" htmlFor="evidence_notes">
              <Textarea id="evidence_notes" name="evidence_notes" />
            </Field>
          </div>
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-[var(--radius)] bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="rounded-[var(--radius)] bg-success-bg px-3 py-2 text-sm text-success">
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Update eligibility"}
      </Button>
    </form>
  );
}
