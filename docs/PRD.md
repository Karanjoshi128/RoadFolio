# RoadFolio — Product Requirements Document (MVP)

**Status:** Draft v1 · **Date:** 2026-06-24 · **Owner:** Karan

> Note: the roadmap `.md` import format is **not finalized** — Karan wants to revisit it.
> This PRD does **not** depend on the exact format; it treats "import a roadmap" as a
> capability and keeps the parser behind a clean boundary so the format can change later.

---

## 1. Overview

RoadFolio is a multi-user web app for tracking structured learning/skill **roadmaps**.
A user imports a roadmap (Markdown), the app renders it as an interactive tree of
checkable nodes, and progress is saved **per user** in the database. A **portfolio**
feature is planned for a later phase and is explicitly out of scope for this MVP.

### Vision
*Roadmap + Portfolio* — track what you're learning to completion, then showcase the
projects that prove it. The two halves connect via `project`-type roadmap nodes.

---

## 2. Goals & non-goals (MVP)

### Goals
1. Multi-user app with working authentication.
2. **Auth via NextAuth (Auth.js)** with two methods:
   - **Google sign-in** (OAuth).
   - **Email + password** (Credentials) — used for local/dev testing.
3. **One seeded test user** (email + password) ready to log in immediately.
4. Import a roadmap from Markdown → store it → render an interactive roadmap.
5. Per-user progress tracking: mark nodes `not_started / in_progress / done / skipped`,
   with milestone + overall progress %.
6. A dashboard listing the signed-in user's roadmaps.

### Non-goals (explicitly deferred)
- Portfolio / projects feature (Phase 2 of the product).
- Public share links, community templates, export-to-PDF.
- Re-import / merge logic (designed for, not built in MVP — single import is enough).
- Finalizing the roadmap Markdown format (Karan to revisit).
- Mobile-native apps.

---

## 3. Personas

- **Learner (primary):** an individual tracking their own roadmaps. Signs in, imports,
  checks off progress, returns over weeks. This is the seeded test user's role.
- **Future: Viewer** (recruiter viewing a shared profile) — Phase 2, not now.

---

## 4. Tech stack & architecture

| Layer        | Choice | Notes |
|--------------|--------|-------|
| Framework    | **Next.js (App Router)**, TypeScript | Server Components + Route Handlers / Server Actions. |
| Auth         | **NextAuth / Auth.js v5** | Google provider + Credentials provider. |
| Database     | **Supabase Postgres** | Used as the Postgres DB. App connects via an ORM, not Supabase Auth. |
| ORM          | **Prisma** *(default choice — confirm)* | Owns schema + migrations; backs the NextAuth adapter. |
| Adapter      | **@auth/prisma-adapter** | Persists users/accounts/sessions in Supabase Postgres. |
| Styling      | **Tailwind CSS + shadcn/ui** *(default — confirm)* | Fast, clean UI primitives. |
| Markdown     | **remark / unified** | Parse roadmap `.md` → structured nodes. |
| Hosting      | Vercel (target) | Supabase as managed Postgres. |

### Key architectural decisions
- **Supabase is the database only.** We deliberately use **NextAuth**, not Supabase Auth,
  per the requirement. Supabase provides the Postgres instance (and later, Storage for
  uploads/portfolio assets).
- **Session strategy = JWT.** The Credentials provider requires JWT sessions, so both
  Google and email/password use the JWT strategy for consistency.
- **Password storage.** NextAuth's default `User` has no password field. We add a
  `passwordHash` column (bcrypt) to the user (or a sibling `Credential` table). The
  Credentials provider verifies against it.
- **Parser isolated** behind `lib/roadmap/parser.ts` so the format can be swapped without
  touching storage, UI, or progress logic.

---

## 5. Data model (initial)

NextAuth/Prisma standard tables: `User`, `Account`, `Session`, `VerificationToken`
(adapter-managed). Plus app tables:

```
User (extends NextAuth User)
  id, name, email, image, emailVerified
  passwordHash    String?   // for Credentials login (seeded user)
  createdAt

Roadmap
  id, userId (FK User)        // owner
  slug                        // unique per user
  title, description, tags[], version
  sourceMarkdown  Text        // original imported .md (so we can re-render/re-parse)
  createdAt, updatedAt

RoadmapNode
  id                          // internal PK
  roadmapId (FK)
  nodeKey         String      // stable id from the .md ({id:...}); unique per roadmap
  parentKey       String?     // milestone grouping
  level           Int         // heading depth
  type            Enum(milestone | task | project | reference)
  title           Text
  content         Text        // rendered detail markdown
  difficulty      Enum?(easy|medium|hard)
  estimate        String?
  optional        Boolean default false
  orderIndex      Int

NodeProgress
  id
  userId (FK)
  roadmapNodeId (FK)
  status          Enum(not_started | in_progress | done | skipped) default not_started
  updatedAt
  UNIQUE(userId, roadmapNodeId)
```

Progress is keyed by `(userId, roadmapNodeId)` — clean multi-user separation; the
roadmap definition stays shared/immutable per import.

---

## 6. Authentication design

### Providers
1. **Google OAuth** — `GoogleProvider`. Requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   and an authorized redirect URI (`/api/auth/callback/google`).
2. **Credentials (email + password)** — verifies `email` + bcrypt-compared password against
   `User.passwordHash`. This is how we test with the seeded account.

### Flows
- Sign-in page offers **"Continue with Google"** and an **email/password form**.
- Protected routes (dashboard, roadmap views) require a session; unauthenticated users
  redirect to `/signin`.
- Sign-out clears the session.

### Seeded test user
A Prisma seed script creates **one** user:
- email: `<provided by Karan>` (default placeholder: `test@roadfolio.dev`)
- password: `<provided by Karan>` (default placeholder: `Test1234!`) → stored as bcrypt hash.
- This user is the login used for all manual testing of the email/password path.
- The seed also (optionally) imports `roadmaps/ai-engineer-2026.md` for this user so there's
  data to look at on first login.

> **Decision needed:** the real seed email + password to use. Until provided, the
> placeholders above are used.

---

## 7. Functional requirements

### F1 — Auth
- F1.1 User can sign in with Google.
- F1.2 User can sign in with seeded email + password.
- F1.3 Sessions persist (JWT); protected pages enforce auth; sign-out works.

### F2 — Roadmap import
- F2.1 Authenticated user can import a roadmap from a `.md` file (upload or paste).
- F2.2 Parser converts Markdown → `Roadmap` + `RoadmapNode` rows (strict-ID validation;
  errors surfaced with line context).
- F2.3 Original Markdown is stored on the `Roadmap`.

### F3 — Roadmap view
- F3.1 Render the roadmap as milestones → nodes; reference sections shown as content.
- F3.2 Each node shows title, type, difficulty, and its detail content.
- F3.3 Show milestone progress % and overall roadmap %.

### F4 — Progress tracking
- F4.1 User can set a node's status (not_started / in_progress / done / skipped).
- F4.2 Status saved per user; persists across sessions.
- F4.3 Milestone/overall % recompute from `done` (+`skipped`) over non-`optional` nodes.

### F5 — Dashboard
- F5.1 List the signed-in user's roadmaps with overall progress.
- F5.2 Link into each roadmap.

---

## 8. Routes / pages

| Route | Purpose | Auth |
|-------|---------|------|
| `/` | Landing → redirects authed users to `/dashboard` | public |
| `/signin` | Google + email/password | public |
| `/dashboard` | List user's roadmaps | required |
| `/roadmaps/import` | Import a roadmap | required |
| `/roadmaps/[slug]` | Interactive roadmap + progress | required |
| `/api/auth/[...nextauth]` | NextAuth handler | — |
| `/api/roadmaps` (or Server Actions) | import / progress mutations | required |

---

## 9. Environment variables

```
DATABASE_URL=                 # Supabase Postgres (pooled) connection string
DIRECT_URL=                   # Supabase direct connection (Prisma migrations)
NEXTAUTH_URL=                 # http://localhost:3000 in dev
NEXTAUTH_SECRET=              # generated
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 10. Milestones (build order)

1. **M0 — Scaffold:** Next.js + TS + Tailwind/shadcn + Prisma + Supabase connection.
2. **M1 — Auth:** NextAuth (Google + Credentials), JWT sessions, protected routes,
   sign-in page, sign-out.
3. **M2 — Seed:** Prisma seed → one test user (+ optional roadmap import for that user).
4. **M3 — Schema + parser:** roadmap/node/progress tables; `lib/roadmap/parser.ts`.
5. **M4 — Import + view:** import flow → render interactive roadmap.
6. **M5 — Progress:** status toggles + progress %.
7. **M6 — Dashboard:** list roadmaps + polish.

MVP = M0–M6. Portfolio = future phase.

---

## 11. Acceptance criteria (MVP "done")

- [ ] App runs locally against Supabase Postgres.
- [ ] Seeded user can sign in with **email + password**.
- [ ] **Google sign-in** works end-to-end (with configured OAuth credentials).
- [ ] A roadmap is imported and rendered as an interactive tree.
- [ ] Toggling a node's status persists per user and updates progress %.
- [ ] Dashboard lists the user's roadmaps with overall progress.

---

## 12. Decisions (resolved 2026-06-24)

1. **Seed credentials:** dev placeholder — `test@roadfolio.dev` / `Test1234!` (bcrypt-hashed in DB). Changeable in the seed script.
2. **ORM:** **Prisma** — schema + migrations + NextAuth adapter.
3. **UI kit:** **Tailwind CSS + shadcn/ui.**
4. **Import UX:** **both** file upload and paste-textarea.
5. **Roadmap format:** to be revisited later (does not block scaffolding/auth/seed).

---

## 13. Future (Phase 2+, not in MVP)

- Personal **portfolio**: `project` nodes → showcased projects; public profile page.
- Re-import / progress-merge, share links, community templates, export, streaks/heatmap.
