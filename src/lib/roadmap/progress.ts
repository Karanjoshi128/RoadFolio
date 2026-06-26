import type { NodeType, ProgressStatus } from "@prisma/client";

export interface ProgressNode {
  id: string;
  nodeKey: string;
  parentKey: string | null;
  type: NodeType;
  optional: boolean;
  status: ProgressStatus;
}

export interface ProgressSummary {
  done: number;
  total: number;
  pct: number;
}

const isCounted = (n: ProgressNode) =>
  (n.type === "task" || n.type === "project") && !n.optional;

const isComplete = (s: ProgressStatus) => s === "done" || s === "skipped";

function summarize(nodes: ProgressNode[]): ProgressSummary {
  const counted = nodes.filter(isCounted);
  const done = counted.filter((n) => isComplete(n.status)).length;
  const total = counted.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, pct };
}

/** Overall roadmap progress across all required task/project nodes. */
export function overallProgress(nodes: ProgressNode[]): ProgressSummary {
  return summarize(nodes);
}

/** Progress per milestone (keyed by the milestone's nodeKey). */
export function milestoneProgress(
  nodes: ProgressNode[]
): Map<string, ProgressSummary> {
  const byParent = new Map<string, ProgressNode[]>();
  for (const n of nodes) {
    if (!n.parentKey) continue;
    const list = byParent.get(n.parentKey) ?? [];
    list.push(n);
    byParent.set(n.parentKey, list);
  }
  const result = new Map<string, ProgressSummary>();
  for (const [parentKey, children] of byParent) {
    result.set(parentKey, summarize(children));
  }
  return result;
}
