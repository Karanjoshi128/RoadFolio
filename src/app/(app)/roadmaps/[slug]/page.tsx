import { notFound, redirect } from "next/navigation";
import type { ProgressStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoadmapView, type ViewNode } from "@/components/roadmap-view";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const roadmap = await prisma.roadmap.findUnique({
    where: { userId_slug: { userId, slug } },
    include: {
      nodes: {
        orderBy: { orderIndex: "asc" },
        include: { progress: { where: { userId } } },
      },
    },
  });

  if (!roadmap) notFound();

  // Group into sections (level 2) + their child nodes (level 3).
  const toView = (n: (typeof roadmap.nodes)[number]): ViewNode => ({
    id: n.id,
    nodeKey: n.nodeKey,
    parentKey: n.parentKey,
    level: n.level,
    type: n.type,
    title: n.title,
    content: n.content,
    difficulty: n.difficulty,
    estimate: n.estimate,
    optional: n.optional,
  });

  const sections: { section: ViewNode; children: ViewNode[] }[] = [];
  for (const node of roadmap.nodes) {
    if (node.level === 2) sections.push({ section: toView(node), children: [] });
    else if (sections.length > 0)
      sections[sections.length - 1].children.push(toView(node));
  }

  const initialStatuses: Record<string, ProgressStatus> = {};
  for (const n of roadmap.nodes) {
    initialStatuses[n.id] = n.progress[0]?.status ?? "not_started";
  }

  return (
    <RoadmapView
      title={roadmap.title}
      description={roadmap.description}
      tags={roadmap.tags}
      estimatedDuration={roadmap.estimatedDuration}
      intro={roadmap.intro}
      sections={sections}
      initialStatuses={initialStatuses}
    />
  );
}
