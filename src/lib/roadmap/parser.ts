import matter from "gray-matter";

// ---------------------------------------------------------------------------
// RoadFolio roadmap markdown parser.
// Format spec: docs/roadmap-format.md
//
// NOTE: the format is intentionally isolated behind this module so it can be
// changed later without touching storage, UI, or progress logic.
// ---------------------------------------------------------------------------

export type NodeType = "milestone" | "task" | "project" | "reference";
export type Difficulty = "easy" | "medium" | "hard";

export interface ParsedNode {
  nodeKey: string;
  parentKey: string | null;
  level: number; // 2 = section (##), 3 = node (###)
  type: NodeType;
  title: string;
  content: string; // markdown detail content under this heading
  difficulty: Difficulty | null;
  estimate: string | null;
  optional: boolean;
  orderIndex: number;
}

export interface ParsedRoadmap {
  title: string;
  slug: string;
  description: string | null;
  tags: string[];
  version: number;
  estimatedDuration: string | null;
  intro: string; // markdown before the first section
  nodes: ParsedNode[];
}

export class RoadmapParseError extends Error {
  constructor(
    message: string,
    public line?: number
  ) {
    super(line ? `Line ${line}: ${message}` : message);
    this.name = "RoadmapParseError";
  }
}

const SECTION_TYPES: NodeType[] = ["milestone", "reference"];
const NODE_TYPES: NodeType[] = ["task", "project"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const SLUG_RE = /^[a-z0-9-]+$/;

/** Parse an inline `{key: value, ...}` metadata block at the end of a heading. */
function parseMeta(raw: string): {
  title: string;
  meta: Record<string, string>;
} {
  const match = raw.match(/^(.*?)\s*\{(.*)\}\s*$/);
  if (!match) return { title: raw.trim(), meta: {} };

  const title = match[1].trim();
  const body = match[2];
  const meta: Record<string, string> = {};

  // Split on commas that are not inside quotes.
  const parts = body.match(/(?:[^,"]|"[^"]*")+/g) ?? [];
  for (const part of parts) {
    const idx = part.indexOf(":");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    let value = part.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) meta[key] = value;
  }
  return { title, meta };
}

export function parseRoadmap(source: string): ParsedRoadmap {
  const { data: frontmatter, content } = matter(source);

  const title = typeof frontmatter.title === "string" ? frontmatter.title.trim() : "";
  const slug = typeof frontmatter.slug === "string" ? frontmatter.slug.trim() : "";

  if (!title) throw new RoadmapParseError("front-matter is missing required `title`.");
  if (!slug) throw new RoadmapParseError("front-matter is missing required `slug`.");
  if (!SLUG_RE.test(slug)) {
    throw new RoadmapParseError(
      `front-matter \`slug\` "${slug}" is invalid (use lowercase letters, numbers, hyphens).`
    );
  }

  const description =
    typeof frontmatter.description === "string" ? frontmatter.description.trim() : null;
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.map((t) => String(t))
    : [];
  const version =
    typeof frontmatter.version === "number" ? frontmatter.version : 1;
  const estimatedDuration =
    typeof frontmatter.estimatedDuration === "string"
      ? frontmatter.estimatedDuration.trim()
      : null;

  const lines = content.split("\n");

  const introLines: string[] = [];
  const nodes: ParsedNode[] = [];
  const seenKeys = new Set<string>();

  let currentSectionKey: string | null = null;
  let orderIndex = 0;

  // Accumulator for the heading we're currently collecting content for.
  let pending:
    | (Omit<ParsedNode, "content"> & { contentLines: string[] })
    | null = null;
  let beforeFirstHeading = true;

  const flushPending = () => {
    if (!pending) return;
    const { contentLines, ...rest } = pending;
    nodes.push({ ...rest, content: contentLines.join("\n").trim() });
    pending = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    const headingMatch = line.match(/^(#{2,3})\s+(.*)$/);

    if (!headingMatch) {
      if (beforeFirstHeading) introLines.push(line);
      else if (pending) pending.contentLines.push(line);
      continue;
    }

    beforeFirstHeading = false;
    flushPending();

    const level = headingMatch[1].length; // 2 or 3
    const { title: headingTitle, meta } = parseMeta(headingMatch[2]);

    const id = meta.id?.trim();
    const type = meta.type?.trim() as NodeType | undefined;

    if (!id) {
      throw new RoadmapParseError(
        `heading "${headingTitle}" is missing required \`id\` metadata.`,
        lineNo
      );
    }
    if (seenKeys.has(id)) {
      throw new RoadmapParseError(`duplicate id "${id}".`, lineNo);
    }
    if (!type) {
      throw new RoadmapParseError(
        `heading "${headingTitle}" is missing required \`type\` metadata.`,
        lineNo
      );
    }

    if (level === 2) {
      if (!SECTION_TYPES.includes(type)) {
        throw new RoadmapParseError(
          `section "${headingTitle}" has invalid type "${type}" (expected milestone or reference).`,
          lineNo
        );
      }
      currentSectionKey = id;
    } else {
      // level === 3
      if (!NODE_TYPES.includes(type)) {
        throw new RoadmapParseError(
          `node "${headingTitle}" has invalid type "${type}" (expected task or project).`,
          lineNo
        );
      }
      if (!currentSectionKey) {
        throw new RoadmapParseError(
          `node "${headingTitle}" appears before any section (##).`,
          lineNo
        );
      }
    }

    const difficulty = meta.difficulty?.trim() as Difficulty | undefined;
    if (difficulty && !DIFFICULTIES.includes(difficulty)) {
      throw new RoadmapParseError(
        `invalid difficulty "${difficulty}" (expected easy, medium, or hard).`,
        lineNo
      );
    }

    seenKeys.add(id);
    pending = {
      nodeKey: id,
      parentKey: level === 3 ? currentSectionKey : null,
      level,
      type,
      title: headingTitle,
      difficulty: difficulty ?? null,
      estimate: meta.est?.trim() || null,
      optional: meta.optional?.trim() === "true",
      orderIndex: orderIndex++,
      contentLines: [],
    };
  }

  flushPending();

  if (nodes.length === 0) {
    throw new RoadmapParseError("no sections found (expected at least one `##` heading).");
  }

  return {
    title,
    slug,
    description,
    tags,
    version,
    estimatedDuration,
    intro: introLines.join("\n").trim(),
    nodes,
  };
}
