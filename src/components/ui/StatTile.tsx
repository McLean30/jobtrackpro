import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  className?: string;
}) {
  const accents: Record<string, string> = {
    neutral: "text-fg",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    brand: "text-brand-600",
  };
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-border bg-surface p-5 shadow-sm",
        className,
      )}
    >
      <p className="text-sm font-medium text-fg-muted">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", accents[tone])}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-fg-subtle">{hint}</p>}
    </div>
  );
}
