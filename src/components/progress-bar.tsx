import { cn } from "@/lib/utils";

/**
 * Emerald progress bar matching the Stitch design.
 * `trackClassName` controls height (e.g. "h-3", "h-1.5").
 */
export function ProgressBar({
  value,
  trackClassName,
}: {
  value: number;
  trackClassName?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full border border-white/5 bg-white/5",
        trackClassName ?? "h-2"
      )}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary-container transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
