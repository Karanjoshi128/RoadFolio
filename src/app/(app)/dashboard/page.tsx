import Link from "next/link";
import { redirect } from "next/navigation";
import type { ProgressStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { overallProgress, type ProgressNode } from "@/lib/roadmap/progress";
import { buildHeatmap } from "@/lib/roadmap/activity";
import { MaterialIcon } from "@/components/material-icon";
import { ProgressBar } from "@/components/progress-bar";
import { RoadmapCard } from "@/components/roadmap-card";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { nodes: { include: { progress: { where: { userId } } } } },
  });

  const withSummary = roadmaps.map((roadmap) => {
    const progressNodes: ProgressNode[] = roadmap.nodes.map((n) => ({
      id: n.id,
      nodeKey: n.nodeKey,
      parentKey: n.parentKey,
      type: n.type,
      optional: n.optional,
      status: n.progress[0]?.status ?? "not_started",
    }));
    return { roadmap, summary: overallProgress(progressNodes) };
  });

  // Activity heatmap from all progress updates.
  const allTimestamps = roadmaps.flatMap((r) =>
    r.nodes.flatMap((n) =>
      n.progress.filter((p) => p.status !== "not_started").map((p) => p.updatedAt)
    )
  );
  const { columns, total: activityTotal } = buildHeatmap(allTimestamps, new Date());

  if (roadmaps.length === 0) {
    return (
      <EmptyDashboard />
    );
  }

  // Hero = most recently updated roadmap.
  const hero = withSummary[0];
  const heroNodes = hero.roadmap.nodes
    .filter((n) => n.type === "task" || n.type === "project")
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const statusOf = (i: number): ProgressStatus =>
    heroNodes[i]?.progress[0]?.status ?? "not_started";
  const focusIdx = Math.max(
    0,
    heroNodes.findIndex(
      (n) =>
        (n.progress[0]?.status ?? "not_started") === "in_progress" ||
        (n.progress[0]?.status ?? "not_started") === "not_started"
    )
  );
  const focusNode = heroNodes[focusIdx];
  const milestoneWindow = heroNodes.slice(
    Math.max(0, focusIdx - 1),
    Math.max(0, focusIdx - 1) + 5
  );

  return (
    <div className="space-y-md">
      <div className="mb-2">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Welcome back{session!.user.name ? `, ${session!.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Here&apos;s where your learning stands today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-gutter lg:col-span-2">
          {/* Hero: Continue Learning */}
          <section className="glass-elevated relative overflow-hidden p-lg">
            <div className="pointer-events-none absolute right-0 top-0 size-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-primary-container/15 blur-3xl" />
            <div className="relative z-10">
              <div className="mb-lg flex items-start justify-between">
                <div>
                  <span className="mb-2 inline-block rounded-md bg-surface-container px-2 py-1 font-metadata text-metadata text-on-surface-variant">
                    Current Focus
                  </span>
                  <h2 className="mb-1 font-headline-lg text-headline-lg-mobile font-bold text-on-surface md:text-headline-lg">
                    {hero.roadmap.title}
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {focusNode ? `Next: ${focusNode.title}` : "All caught up 🎉"}
                  </p>
                </div>
                <div className="hidden size-12 items-center justify-center rounded-full border border-primary-container/20 bg-primary-container/10 sm:flex">
                  <MaterialIcon name="rocket_launch" fill className="text-primary-container text-[24px]" />
                </div>
              </div>
              <div className="mb-md">
                <div className="mb-2 flex items-end justify-between">
                  <span className="font-body-md text-body-md font-medium text-on-surface">
                    Overall Progress
                  </span>
                  <span className="font-headline-md text-headline-md font-bold text-primary-container">
                    {hero.summary.pct}%
                  </span>
                </div>
                <ProgressBar value={hero.summary.pct} trackClassName="h-3" />
              </div>
              <div className="mt-lg flex justify-end">
                <Link
                  href={`/roadmaps/${hero.roadmap.slug}`}
                  className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-2 font-body-md text-body-md font-semibold text-on-primary shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-colors hover:bg-primary"
                >
                  <span>Continue Learning</span>
                  <MaterialIcon name="arrow_forward" className="text-[18px]" />
                </Link>
              </div>
            </div>
          </section>

          {/* Active roadmaps */}
          <section>
            <div className="mb-md flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                My Active Roadmaps
              </h3>
              <Link
                href="/roadmaps"
                className="font-body-md text-body-md text-primary-container hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              {withSummary.slice(0, 4).map(({ roadmap, summary }) => (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={{
                    slug: roadmap.slug,
                    title: roadmap.title,
                    description: roadmap.description,
                    tags: roadmap.tags,
                  }}
                  summary={summary}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-gutter lg:col-span-1">
          {/* Upcoming milestones */}
          <section className="glass-panel p-lg">
            <h3 className="mb-md font-headline-md text-headline-md text-on-surface">
              Upcoming Milestones
            </h3>
            {milestoneWindow.length === 0 ? (
              <p className="font-metadata text-metadata text-on-surface-variant">
                No tasks yet.
              </p>
            ) : (
              <div className="relative">
                <div className="absolute bottom-2 left-[11px] top-2 w-[2px] bg-surface-container" />
                <ul className="relative z-10 space-y-md">
                  {milestoneWindow.map((node) => {
                    const idx = heroNodes.indexOf(node);
                    const status = statusOf(idx);
                    const done = status === "done" || status === "skipped";
                    const active = status === "in_progress";
                    return (
                      <li key={node.id} className="flex items-start gap-sm">
                        <div
                          className={cn(
                            "z-10 mt-0.5 flex size-6 flex-shrink-0 items-center justify-center rounded-full",
                            done
                              ? "bg-primary-container"
                              : active
                                ? "bg-tertiary"
                                : "border border-white/15 bg-white/5"
                          )}
                        >
                          {done && (
                            <MaterialIcon name="check" fill className="text-on-primary text-[14px]" />
                          )}
                          {active && <div className="size-2 rounded-full bg-on-tertiary" />}
                        </div>
                        <div>
                          <h4
                            className={cn(
                              "font-body-md text-body-md font-medium",
                              done
                                ? "text-on-surface-variant line-through"
                                : "text-on-surface"
                            )}
                          >
                            {node.title}
                          </h4>
                          <p className="font-metadata text-metadata text-on-surface-variant">
                            {done
                              ? "Completed"
                              : active
                                ? "Current focus"
                                : node.estimate
                                  ? `Est. ${node.estimate}`
                                  : "Upcoming"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* Activity heatmap */}
          <section className="glass-panel p-lg">
            <div className="mb-md flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Learning Activity
              </h3>
              <span className="font-metadata text-metadata text-on-surface-variant">
                {activityTotal} this quarter
              </span>
            </div>
            <ActivityHeatmap columns={columns} />
          </section>
        </div>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="glass-panel flex flex-col items-center justify-center border-dashed py-24 text-center">
      <div className="mb-md flex size-16 items-center justify-center rounded-full bg-white/5 text-primary">
        <MaterialIcon name="map" className="text-[32px]" />
      </div>
      <h2 className="mb-1 font-headline-md text-headline-md text-on-surface">
        No roadmaps yet
      </h2>
      <p className="mb-md max-w-[24rem] font-body-md text-body-md text-on-surface-variant">
        Import a Markdown roadmap to start tracking your learning to completion.
      </p>
      <Link
        href="/roadmaps/import"
        className={cn(
          buttonVariants(),
          "bg-primary-container font-semibold text-on-primary hover:bg-primary"
        )}
      >
        Import your first roadmap
      </Link>
    </div>
  );
}
