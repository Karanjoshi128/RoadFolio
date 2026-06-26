"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProgressStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { importRoadmapForUser } from "@/lib/roadmap/import";
import { RoadmapParseError } from "@/lib/roadmap/parser";

export type ImportResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function importRoadmapAction(
  markdown: string
): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated." };

  if (!markdown.trim()) {
    return { ok: false, error: "No markdown content provided." };
  }

  try {
    const roadmap = await importRoadmapForUser(session.user.id, markdown);
    revalidatePath("/dashboard");
    return { ok: true, slug: roadmap.slug };
  } catch (err) {
    if (err instanceof RoadmapParseError) {
      return { ok: false, error: err.message };
    }
    console.error("Import failed:", err);
    return {
      ok: false,
      error: "Failed to import roadmap. Check the server logs.",
    };
  }
}

const VALID_STATUSES: ProgressStatus[] = [
  "not_started",
  "in_progress",
  "done",
  "skipped",
];

export async function setNodeStatusAction(
  roadmapNodeId: string,
  status: ProgressStatus
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");
  if (!VALID_STATUSES.includes(status)) throw new Error("Invalid status.");

  // Ensure the node belongs to a roadmap owned by this user.
  const node = await prisma.roadmapNode.findUnique({
    where: { id: roadmapNodeId },
    select: { roadmap: { select: { userId: true, slug: true } } },
  });
  if (!node || node.roadmap.userId !== session.user.id) {
    throw new Error("Node not found.");
  }

  await prisma.nodeProgress.upsert({
    where: {
      userId_roadmapNodeId: {
        userId: session.user.id,
        roadmapNodeId,
      },
    },
    create: { userId: session.user.id, roadmapNodeId, status },
    update: { status },
  });

  revalidatePath(`/roadmaps/${node.roadmap.slug}`);
  revalidatePath("/dashboard");
}

export async function deleteRoadmapAction(slug: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated.");

  await prisma.roadmap.deleteMany({
    where: { slug, userId: session.user.id },
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
