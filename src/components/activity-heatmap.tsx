import type { HeatmapCell } from "@/lib/roadmap/activity";
import { cn } from "@/lib/utils";

const LEVEL_BG: Record<number, string> = {
  0: "bg-white/[0.06]",
  1: "bg-primary-container/30",
  2: "bg-primary-container/60",
  3: "bg-primary-container",
  4: "bg-primary",
};

function Cell({ cell }: { cell: HeatmapCell }) {
  return (
    <div
      title={`${cell.count} update${cell.count === 1 ? "" : "s"} on ${cell.date}`}
      className={cn(
        "size-3 rounded-[2px]",
        cell.future
          ? "border border-dashed border-outline-variant bg-surface-variant"
          : LEVEL_BG[cell.level]
      )}
    />
  );
}

export function ActivityHeatmap({ columns }: { columns: HeatmapCell[][] }) {
  return (
    <div>
      <div className="scrollbar-hide flex gap-1 overflow-x-auto pb-2">
        {columns.map((col, i) => (
          <div key={i} className="flex flex-col gap-1">
            {col.map((cell) => (
              <Cell key={cell.date} cell={cell} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 font-label-caps text-label-caps text-on-surface-variant">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={cn("size-3 rounded-[2px]", LEVEL_BG[l])} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
