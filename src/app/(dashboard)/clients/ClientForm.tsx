"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { ActionState } from "./actions";
import type { OrganisationRow } from "@/lib/supabase/database.types";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function ClientForm({
  action,
  initial,
  submitLabel,
}: {
  action: Action;
  initial?: Partial<OrganisationRow>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    { ok: false },
  );
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Company name" htmlFor="name" required>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          aria-invalid={Boolean(fe.name)}
        />
        {fe.name && <p className="mt-1 text-xs text-danger">{fe.name}</p>}
      </Field>

      <Field
        label="Legal name"
        htmlFor="legal_name"
        hint="Registered company name, if different."
      >
        <Input
          id="legal_name"
          name="legal_name"
          defaultValue={initial?.legal_name ?? ""}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Contact email" htmlFor="contact_email">
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={initial?.contact_email ?? ""}
            aria-invalid={Boolean(fe.contact_email)}
          />
          {fe.contact_email && (
            <p className="mt-1 text-xs text-danger">{fe.contact_email}</p>
          )}
        </Field>
        <Field label="Contact phone" htmlFor="contact_phone">
          <Input
            id="contact_phone"
            name="contact_phone"
            defaultValue={initial?.contact_phone ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Website" htmlFor="website">
          <Input
            id="website"
            name="website"
            defaultValue={initial?.website ?? ""}
            placeholder="https://"
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select
            id="status"
            name="status"
            defaultValue={initial?.status ?? "active"}
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-[var(--radius)] bg-danger-bg px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
