import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { parseRoadmap } from "../src/lib/roadmap/parser";

const prisma = new PrismaClient();

// Seeded dev test account (see docs/PRD.md §6). Change here if desired.
const SEED_EMAIL = "test@roadfolio.dev";
const SEED_PASSWORD = "Test1234!";
const SEED_NAME = "Test User";

async function main() {
  console.log("Seeding RoadFolio…");

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { passwordHash, name: SEED_NAME },
    create: {
      email: SEED_EMAIL,
      name: SEED_NAME,
      passwordHash,
      emailVerified: new Date(),
    },
  });
  console.log(`✓ User ready: ${SEED_EMAIL} / ${SEED_PASSWORD}`);

  // Import the sample roadmap for this user.
  const mdPath = join(process.cwd(), "roadmaps", "ai-engineer-2026.md");
  const source = readFileSync(mdPath, "utf8");
  const parsed = parseRoadmap(source);

  const roadmap = await prisma.roadmap.upsert({
    where: { userId_slug: { userId: user.id, slug: parsed.slug } },
    update: {
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
      version: parsed.version,
      estimatedDuration: parsed.estimatedDuration,
      sourceMarkdown: source,
      intro: parsed.intro,
    },
    create: {
      userId: user.id,
      slug: parsed.slug,
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
      version: parsed.version,
      estimatedDuration: parsed.estimatedDuration,
      sourceMarkdown: source,
      intro: parsed.intro,
    },
  });

  // Reset node definitions for a clean seed.
  await prisma.roadmapNode.deleteMany({ where: { roadmapId: roadmap.id } });
  await prisma.roadmapNode.createMany({
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

  console.log(
    `✓ Roadmap "${parsed.title}" imported with ${parsed.nodes.length} nodes.`
  );
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
