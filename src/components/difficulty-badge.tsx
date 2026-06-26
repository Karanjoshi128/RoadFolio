import type { Difficulty } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<Difficulty, string> = {
  easy: "bg-white/5 text-on-surface-variant border-white/10",
  medium: "bg-transparent text-on-surface border-outline",
  hard: "bg-error/10 text-error border-error/25",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded border px-2 py-0.5 font-metadata text-[11px] capitalize",
        STYLES[difficulty],
        className
      )}
    >
      {difficulty}
    </span>
  );
}
