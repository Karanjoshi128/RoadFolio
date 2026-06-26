import Link from "next/link";
import { MaterialIcon } from "@/components/material-icon";
import { ProgressBar } from "@/components/progress-bar";
import type { ProgressSummary } from "@/lib/roadmap/progress";

export interface RoadmapCardData {
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  icon?: string;
}

export function RoadmapCard({
  roadmap,
  summary,
}: {
  roadmap: RoadmapCardData;
  summary: ProgressSummary;
}) {
  return (
    <Link
      href={`/roadmaps/${roadmap.slug}`}
      className="glass-panel group flex flex-col p-md transition-all hover:border-white/20 hover:bg-white/[0.07] hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
          <MaterialIcon
            name={roadmap.icon ?? "route"}
            className="text-primary"
          />
        </div>
        {roadmap.tags[0] && (
          <span className="rounded-full border border-white/10 px-2 py-1 font-label-caps text-label-caps uppercase tracking-wider text-on-surface-variant">
            {roadmap.tags[0]}
          </span>
        )}
      </div>
      <h4 className="mb-1 font-body-lg text-body-lg font-medium text-on-surface group-hover:text-primary">
        {roadmap.title}
      </h4>
      {roadmap.description && (
        <p className="mb-6 line-clamp-2 flex-grow font-metadata text-metadata text-on-surface-variant">
          {roadmap.description}
        </p>
      )}
      <div className="mt-auto">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-metadata text-metadata text-on-surface-variant">
            {summary.pct}% Completed
          </span>
          <span className="font-metadata text-metadata text-on-surface-variant">
            {summary.done}/{summary.total}
          </span>
        </div>
        <ProgressBar value={summary.pct} trackClassName="h-1.5" />
      </div>
    </Link>
  );
}
