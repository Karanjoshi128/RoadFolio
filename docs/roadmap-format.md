# RoadFolio Roadmap Format (v1)

The canonical, predefined Markdown structure that RoadFolio imports and turns into
an interactive, trackable roadmap.

Design principles:
- **Authorable by hand** — it's still mostly normal GitHub-Flavored Markdown.
- **Strict IDs** — every trackable node carries a stable `{id}`. Import is rejected
  if an `id` is missing or duplicated. Stable IDs are what let a re-import merge a
  newer roadmap version without wiping anyone's progress.
- **DB-only progress** — the `.md` is a pure template. Any `[ ]`/`[x]` marks are
  ignored on import. A user's status lives per-user in the database, keyed by
  `(roadmap slug, node id)`.

---

## 1. Front-matter (required)

```yaml
---
title: AI Engineer Roadmap 2026     # required — display name
slug: ai-engineer-2026              # required — unique per user, used in the URL
description: One-line summary.       # optional
author: Karan                       # optional
version: 1                          # optional — bump when you re-publish
tags: [ai, llm, nextjs]             # optional — for browsing/filtering
estimatedDuration: 4-6 months       # optional — free text
---
```

Rules:
- `title` and `slug` are **required**. `slug` must be unique per user and match `^[a-z0-9-]+$`.
- Everything else is optional.

## 2. Intro content (optional, untracked)

Any Markdown between the front-matter and the **first `##` heading** is the roadmap
intro. It's rendered at the top of the roadmap page and is **not** tracked. Use it for
the "starting point / target / why" framing, blockquotes, etc.

## 3. Sections — `##` headings

Every `##` heading is a section and **must** carry metadata:

```markdown
## Phase 1 — Foundations {id: phase-1-foundations, type: milestone, est: "Weeks 1-3"}
```

`type` is one of:

| type        | Tracked? | Meaning                                                        |
|-------------|----------|----------------------------------------------------------------|
| `milestone` | yes      | A phase/group. Its progress = rollup of its child nodes.       |
| `reference` | no       | Content-only section (timeline, resources, principles, etc.).  |

Markdown directly under a `##` (before the first `###`) is the section's description
(e.g. a `**Goal:**` line). Rendered, not tracked.

## 4. Nodes — `###` headings

Inside a `milestone` section, every `###` heading is a **trackable node** and **must**
carry metadata:

```markdown
### Build a RAG pipeline {id: p3-rag-pipeline, type: project, difficulty: hard}
```

`type` is one of:

| type      | Meaning                                                                 |
|-----------|-------------------------------------------------------------------------|
| `task`    | A learnable/doable item. The default trackable unit.                    |
| `project` | A deliverable. Eligible to become a **portfolio** entry later.          |

All Markdown under a `###` (until the next heading) is that node's **detail content** —
the explanation, bullet lists, resources, etc. Rendered in the node's detail view.

## 5. Node metadata keys

Inline `{key: value, ...}` after a heading. Quote values containing spaces or commas.

| key          | applies to        | values                                  | required |
|--------------|-------------------|-----------------------------------------|----------|
| `id`         | all `##` / `###`  | stable kebab-case slug                  | **yes**  |
| `type`       | all `##` / `###`  | milestone/reference (`##`), task/project (`###`) | **yes** |
| `difficulty` | task/project      | `easy` \| `medium` \| `hard`            | no       |
| `est`        | any               | free text, e.g. `"2w"`, `"Weeks 5-8"`   | no       |
| `optional`   | task/project      | `true` (excluded from required progress)| no       |

## 6. Progress model

- A user's status per node is one of: `not_started`, `in_progress`, `done`, `skipped`.
- A `milestone`'s progress % = `done` (and `skipped`) children ÷ non-`optional` children.
- Overall roadmap % = rollup across all milestones.
- `project` nodes marked `done` can be surfaced as "ready to add to your portfolio".

## 7. Import validation (strict)

The importer **rejects** the file (with line numbers) when:
- front-matter is missing `title` or `slug`, or `slug` is malformed;
- any `##`/`###` heading is missing `id` or `type`;
- any `id` is duplicated within the file;
- a `###` node appears outside a `milestone`/`reference` section;
- `type` value is not valid for that heading level.

## 8. ID stability contract

- Renaming a heading's text is **safe** — progress follows the `id`.
- Changing a node's `id` **orphans** its progress (treated as a new node).
- On re-import: nodes are matched by `id`. New ids → new nodes. Missing ids →
  node is archived (progress retained, hidden) rather than deleted.
