import { prisma } from "@/lib/prisma";
import { parseRoadmap, type ParsedRoadmap } from "@/lib/roadmap/parser";

/**
 * Parse markdown and persist a roadmap (+ its nodes) for a user.
 * Upserts by (userId, slug): re-importing replaces the definition but the
 * separate NodeProgress rows (keyed by userId + node) are preserved when nodeKeys match.
 */
export async function importRoadmapForUser(
  userId: string,
  sourceMarkdown: string
) {
  const parsed = parseRoadmap(sourceMarkdown);
  return persistRoadmap(userId, parsed, sourceMarkdown);
}

export async function persistRoadmap(
  userId: string,
  parsed: ParsedRoadmap,
  sourceMarkdown: string
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.roadmap.findUnique({
      where: { userId_slug: { userId, slug: parsed.slug } },
      select: { id: true },
    });

    const roadmap = await tx.roadmap.upsert({
      where: { userId_slug: { userId, slug: parsed.slug } },
      create: {
        userId,
        slug: parsed.slug,
        title: parsed.title,
        description: parsed.description,
        tags: parsed.tags,
        version: parsed.version,
        estimatedDuration: parsed.estimatedDuration,
        sourceMarkdown,
        intro: parsed.intro,
      },
      update: {
        title: parsed.title,
        description: parsed.description,
        tags: parsed.tags,
        version: parsed.version,
        estimatedDuration: parsed.estimatedDuration,
        sourceMarkdown,
        intro: parsed.intro,
      },
    });

    // Replace node definitions. Progress rows survive because they reference
    // node ids; on re-import we re-create nodes, so we re-key progress by nodeKey.
    if (existing) {
      // Preserve progress by nodeKey across the re-import.
      const oldNodes = await tx.roadmapNode.findMany({
        where: { roadmapId: roadmap.id },
        select: { id: true, nodeKey: true },
      });
      const oldProgress = await tx.nodeProgress.findMany({
        where: { roadmapNodeId: { in: oldNodes.map((n) => n.id) } },
      });
      const keyByNodeId = new Map(oldNodes.map((n) => [n.id, n.nodeKey]));
      const progressByKey = new Map<string, (typeof oldProgress)[number]>();
      for (const p of oldProgress) {
        const key = keyByNodeId.get(p.roadmapNodeId);
        if (key) progressByKey.set(`${p.userId}:${key}`, p);
      }

      await tx.roadmapNode.deleteMany({ where: { roadmapId: roadmap.id } });

      for (const node of parsed.nodes) {
        const created = await tx.roadmapNode.create({
          data: {
            roadmapId: roadmap.id,
            nodeKey: node.nodeKey,
            parentKey: node.parentKey,
            level: node.level,
            type: node.type,
            title: node.title,
            content: node.content || null,
            difficulty: node.difficulty ?? undefined,
            estimate: node.estimate,
            optional: node.optional,
            orderIndex: node.orderIndex,
          },
        });
        const prior = progressByKey.get(`${userId}:${node.nodeKey}`);
        if (prior && prior.status !== "not_started") {
          await tx.nodeProgress.create({
            data: {
              userId,
              roadmapNodeId: created.id,
              status: prior.status,
            },
          });
        }
      }
    } else {
      await tx.roadmapNode.createMany({
        data: parsed.nodes.map((node) => ({
          roadmapId: roadmap.id,
          nodeKey: node.nodeKey,
          parentKey: node.parentKey,
          level: node.level,
          type: node.type,
          title: node.title,
          content: node.content || null,
          difficulty: node.difficulty ?? undefined,
          estimate: node.estimate,
          optional: node.optional,
          orderIndex: node.orderIndex,
        })),
      });
    }

    return roadmap;
  });
}
