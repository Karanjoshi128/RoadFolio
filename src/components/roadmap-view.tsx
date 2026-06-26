"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Difficulty, NodeType, ProgressStatus } from "@prisma/client";
import { toast } from "sonner";

import { setNodeStatusAction } from "@/lib/actions/roadmap";
import {
  milestoneProgress,
  overallProgress,
  type ProgressNode,
} from "@/lib/roadmap/progress";
import { Markdown } from "@/components/markdown";
import { NodeCard, type NodeCardData } from "@/components/node-card";
import { ProgressBar } from "@/components/progress-bar";
import { MaterialIcon } from "@/components/material-icon";
import { cn } from "@/lib/utils";

export interface ViewNode {
  id: string;
  nodeKey: string;
  parentKey: string | null;
  level: number;
  type: NodeType;
  title: string;
  content: string | null;
  difficulty: Difficulty | null;
  estimate: string | null;
  optional: boolean;
}

export interface RoadmapViewProps {
  title: string;
  description: string | null;
  tags: string[];
  estimatedDuration: string | null;
  intro: string | null;
  sections: { section: ViewNode; children: ViewNode[] }[];
  initialStatuses: Record<string, ProgressStatus>;
}

export function RoadmapView({
  title,
  description,
  tags,
  estimatedDuration,
  intro,
  sections,
  initialStatuses,
}: RoadmapViewProps) {
  const [statuses, setStatuses] =
    useState<Record<string, ProgressStatus>>(initialStatuses);
  const [, startTransition] = useTransition();

  function toggle(nodeId: string, next: ProgressStatus) {
    const prev = statuses[nodeId] ?? "not_started";
    setStatuses((s) => ({ ...s, [nodeId]: next })); // instant
    startTransition(async () => {
      try {
        await setNodeStatusAction(nodeId, next);
      } catch {
        setStatuses((s) => ({ ...s, [nodeId]: prev })); // revert on failure
        toast.error("Could not save — reverted.");
      }
    });
  }

  // Live progress from client state.
  const allNodes: ProgressNode[] = sections.flatMap(({ children }) =>
    children.map((c) => ({
      id: c.id,
      nodeKey: c.nodeKey,
      parentKey: c.parentKey,
      type: c.type,
      optional: c.optional,
      status: statuses[c.id] ?? "not_started",
    }))
  );
  const overall = overallProgress(allNodes);
  const perMilestone = milestoneProgress(allNodes);

  const stateLabel =
    overall.pct >= 100 ? "COMPLETED" : overall.pct > 0 ? "IN PROGRESS" : "NOT STARTED";

  return (
    <div className="mx-auto max-w-[840px] space-y-xl pb-xl">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-primary-container/10 to-transparent" />
        <div className="p-lg">
          <Link
            href="/roadmaps"
            className="mb-md inline-flex items-center gap-1 font-metadata text-metadata text-on-surface-variant hover:text-primary"
          >
            <MaterialIcon name="arrow_back" className="text-[16px]" />
            All roadmaps
          </Link>
          <div className="mb-xs flex flex-wrap items-center gap-sm">
            {tags[0] && (
              <span className="rounded-full border border-white/10 bg-white/5 px-sm py-xs font-label-caps text-label-caps uppercase text-on-surface-variant">
                {tags[0]}
              </span>
            )}
            <span
              className={cn(
                "flex items-center gap-xs rounded-full px-sm py-xs font-label-caps text-label-caps",
                overall.pct >= 100
                  ? "border border-primary/30 bg-primary-container/15 text-primary"
                  : overall.pct > 0
                    ? "border border-tertiary/30 bg-tertiary/15 text-tertiary"
                    : "border border-white/10 bg-white/5 text-on-surface-variant"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  overall.pct >= 100
                    ? "bg-primary"
                    : overall.pct > 0
                      ? "bg-tertiary"
                      : "bg-on-surface-variant"
                )}
              />
              {stateLabel}
            </span>
          </div>
          <h1 className="mb-sm font-display text-headline-lg font-bold text-on-surface md:text-display">
            {title}
          </h1>
          {description && (
            <p className="mb-lg max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
              {description}
            </p>
          )}

          {/* Progress tracker */}
          <div className="glass-panel flex flex-col items-center gap-md p-md md:flex-row">
            <div className="w-full flex-1">
              <div className="mb-sm flex items-end justify-between">
                <span className="font-headline-md text-headline-md text-on-surface">
                  {overall.pct}% Completed
                </span>
                <span className="font-metadata text-metadata text-on-surface-variant">
                  {overall.done} / {overall.total} Tasks
                </span>
              </div>
              <ProgressBar value={overall.pct} trackClassName="h-3" />
            </div>
            {estimatedDuration && (
              <div className="flex shrink-0 items-center gap-xs rounded-lg border border-white/10 bg-white/5 px-md py-sm font-metadata text-metadata text-on-surface-variant">
                <MaterialIcon name="schedule" className="text-[18px]" />
                {estimatedDuration}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Intro */}
      {intro && (
        <div className="glass-panel p-lg">
          <Markdown>{intro}</Markdown>
        </div>
      )}

      {/* Timeline */}
      <div className="relative ml-sm space-y-xl border-l-2 border-white/10 pl-lg">
        {sections.map(({ section, children }) => {
          const isMilestone = section.type === "milestone";
          const mp = perMilestone.get(section.nodeKey);
          const marker = !isMilestone
            ? "reference"
            : mp && mp.pct >= 100
              ? "done"
              : mp && mp.pct > 0
                ? "active"
                : "todo";

          return (
            <section key={section.id} className="relative">
              {/* Node marker */}
              <div
                className={cn(
                  "absolute -left-[35px] top-4 z-10 flex size-6 items-center justify-center rounded-full border-4 border-[#0a1611]",
                  marker === "done" && "bg-primary-container",
                  marker === "active" && "bg-tertiary",
                  marker === "todo" && "border-2 border-white/15 bg-white/5",
                  marker === "reference" && "bg-white/5"
                )}
              >
                {marker === "done" && (
                  <MaterialIcon name="check" className="text-[14px] font-bold text-on-primary" />
                )}
                {marker === "reference" && (
                  <MaterialIcon name="article" className="text-[12px] text-on-surface-variant" />
                )}
              </div>

              <div
                className={cn(
                  "glass-panel overflow-hidden",
                  marker === "active" && "border-tertiary/30 ring-1 ring-tertiary/20"
                )}
              >
                <div className="p-lg">
                  <div className="flex items-start justify-between gap-md">
                    <h2 className="font-headline-md text-headline-md text-on-surface">
                      {section.title}
                    </h2>
                    {isMilestone && mp && (
                      <span className="shrink-0 font-metadata text-metadata text-on-surface-variant">
                        {mp.done}/{mp.total} · {mp.pct}%
                      </span>
                    )}
                  </div>
                  {isMilestone && mp && (
                    <div className="mt-sm">
                      <ProgressBar value={mp.pct} trackClassName="h-1.5" />
                    </div>
                  )}
                  {section.content && (
                    <div className="mt-md">
                      <Markdown>{section.content}</Markdown>
                    </div>
                  )}
                </div>

                {children.length > 0 && (
                  <div className="space-y-xs border-t border-white/10 bg-white/[0.02] p-md">
                    {children.map((child) => {
                      const data: NodeCardData = {
                        id: child.id,
                        type: child.type,
                        title: child.title,
                        difficulty: child.difficulty,
                        estimate: child.estimate,
                        optional: child.optional,
                        hasContent: Boolean(child.content),
                      };
                      return (
                        <NodeCard
                          key={child.id}
                          node={data}
                          status={statuses[child.id] ?? "not_started"}
                          onToggle={(s) => toggle(child.id, s)}
                        >
                          {child.content && <Markdown>{child.content}</Markdown>}
                        </NodeCard>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
