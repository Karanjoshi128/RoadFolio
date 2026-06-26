import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { overallProgress, type ProgressNode } from "@/lib/roadmap/progress";
import { RoadmapCard } from "@/components/roadmap-card";
import { MaterialIcon } from "@/components/material-icon";

export default async function RoadmapsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const roadmaps = await prisma.roadmap.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { nodes: { include: { progress: { where: { userId } } } } },
  });

  return (
    <div className="space-y-md">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            My Roadmaps
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Every learning path you&apos;re tracking.
          </p>
        </div>
        <Link
          href="/roadmaps/import"
          className="flex items-center gap-2 rounded-lg bg-primary-container px-md py-sm font-body-md text-body-md font-semibold text-on-primary shadow-[0_0_24px_rgba(16,185,129,0.3)] transition-colors hover:bg-primary"
        >
          <MaterialIcon name="add" className="text-[18px]" />
          Import roadmap
        </Link>
      </div>

      {roadmaps.length === 0 ? (
        <p className="glass-panel border-dashed p-lg text-center font-body-md text-body-md text-on-surface-variant">
          No roadmaps yet — import one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap) => {
            const progressNodes: ProgressNode[] = roadmap.nodes.map((n) => ({
              id: n.id,
              nodeKey: n.nodeKey,
              parentKey: n.parentKey,
              type: n.type,
              optional: n.optional,
              status: n.progress[0]?.status ?? "not_started",
            }));
            return (
              <RoadmapCard
                key={roadmap.id}
                roadmap={{
                  slug: roadmap.slug,
                  title: roadmap.title,
                  description: roadmap.description,
                  tags: roadmap.tags,
                }}
                summary={overallProgress(progressNodes)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
