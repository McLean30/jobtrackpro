import { cn } from "@/lib/utils";

/**
 * Nexai wordmark + mark. Placeholder brand — swap the SVG and colours
 * (see globals.css --brand-*) when real Nexai assets are available.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="var(--brand-600)" />
        <path
          d="M9 23V9h2.8l8.4 10.2V9H23v14h-2.8L11.8 12.8V23H9Z"
          fill="white"
        />
        <circle cx="23.5" cy="10" r="2.4" fill="var(--accent-400)" />
      </svg>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-fg">
          Nexai<span className="text-brand-600"> Reactivation</span>
        </span>
      )}
    </span>
  );
}
