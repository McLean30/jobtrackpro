import { cn } from "@/lib/utils";
import type {
  EligibilityStatus,
  SuppressionReason,
} from "@/lib/contacts/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-fg-muted",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  brand: "bg-brand-50 text-brand-700",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const ELIGIBILITY_META: Record<
  EligibilityStatus,
  { label: string; tone: Tone }
> = {
  pending_review: { label: "Pending review", tone: "warning" },
  eligible: { label: "Eligible", tone: "success" },
  ineligible: { label: "Ineligible", tone: "danger" },
};

export function EligibilityBadge({ status }: { status: EligibilityStatus }) {
  const meta = ELIGIBILITY_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

const SUPPRESSION_LABEL: Record<SuppressionReason, string> = {
  unsubscribed: "Unsubscribed",
  complaint: "Complaint",
  hard_bounce: "Hard bounce",
  manual_exclusion: "Manual exclusion",
};

export function suppressionLabel(reason: SuppressionReason): string {
  return SUPPRESSION_LABEL[reason];
}
