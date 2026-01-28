# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-26)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** v2.0 Persistence & Project Management

## Current Position

Phase: 10 (BOM Persistence)
Plan: 3 of 4 complete
Status: IN PROGRESS
Last activity: 2026-01-28 — Completed 10-03-PLAN.md (Saved BOM Viewing)

Progress: [████████████████████████████████████████████████░] 96.2%

## Milestone History

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-7 | SHIPPED | 2026-01-23 |
| v2.0 Persistence | 8-12 | IN PROGRESS | — |

See `.planning/MILESTONES.md` for full milestone details.

## v2.0 Phase Status

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 8 | Authentication Foundation | 4/4 | COMPLETE |
| 9 | Project Management | 3/3 | COMPLETE |
| 10 | BOM Persistence | 3/4 | IN PROGRESS |
| 11 | Template Management | 0/? | Not started |
| 12 | CSV Import | 0/? | Not started |

## Accumulated Context

### Decisions

Tech stack and patterns established in v1.0:
- SvelteKit + Drizzle + Turso + Vercel AI SDK
- Tailwind v4 with @tailwindcss/vite plugin
- Provider factory pattern for AI (createAnthropic/createOpenAI)
- Amber color scheme (woodworking theme)
- Click-to-edit inline editing
- RFC 4180 CSV escaping

v2.0 decisions:
- Custom auth with oslo utilities + Argon2 (Lucia deprecated)
- Sessions stored in Turso database (no Redis/external cache)
- Single user focus with multi-user ready design
- Self-registration (signup form)
- No password reset/email verification in v2.0
- Used oslo@1.2.1 despite deprecation (oslojs successor available for future migration)
- Database columns use snake_case (password_hash) while TypeScript uses camelCase (passwordHash)
- App.Locals.user is optional (undefined when not authenticated)
- sessionId exposed in Locals for logout functionality
- Lazy session cleanup (expired sessions deleted on next request)
- Generic login error prevents email enumeration attacks
- Email normalized to lowercase for case-insensitive lookup
- Login supports ?redirect param for post-auth destination
- Root layout server load passes user data to all pages
- UserMenu shows avatar with first letter of email
- Logout uses form POST with progressive enhancement

Phase 9 decisions:
- Cascade delete for projects when user is deleted
- Nullable description/notes fields for gradual project detail entry
- Same FK reference pattern as sessions table
- PRG pattern for mutations (create redirects to detail, delete to list)
- Client-side confirm() dialog for delete action
- CRUD route pattern: list+create at /resource, detail+edit+delete at /resource/[id]
- Dashboard shows 6 most recent projects (limit for visual balance)
- isAuthenticated flag pattern for conditional UI rendering
- Project progress hardcoded to 0% until Phase 10 adds BOM persistence

Phase 10 decisions:
- 10-01: Separate timestamps: generatedAt (AI creation) vs createdAt (DB save)
- 10-01: Position field in bomItems to preserve AI-generated order
- 10-01: Hidden flag as integer boolean with default false (SQLite pattern)
- 10-01: Cascade delete chain: projects -> boms -> bomItems
- 10-03: Nested route structure /projects/[id]/bom/[bomId] maintains hierarchical context
- 10-03: Reuse BOMDisplay component for saved BOMs (DRY principle)

### Pending Todos

None.

### Blockers/Concerns

None.

## Research Reference

v2.0 research completed 2026-01-26:
- `.planning/research/STACK.md` — Auth libraries, session storage, password hashing
- `.planning/research/FEATURES.md` — UX patterns, table stakes
- `.planning/research/ARCHITECTURE.md` — Middleware, schema, route structure
- `.planning/research/PITFALLS.md` — Common mistakes to avoid
- `.planning/research/SUMMARY.md` — Synthesized findings

Key findings:
- Use oslo + @node-rs/argon2 for auth
- hooks.server.ts for session middleware
- 6-table schema: users, sessions, projects, boms, bomItems, templates

## Phase 8 Completion Summary

Authentication Foundation complete with all requirements satisfied:
- **AUTH-01:** User registration with email/password (08-03)
- **AUTH-02:** User login with credentials (08-03)
- **AUTH-03:** Session persistence across browser refresh (08-02, 08-04)
- **AUTH-04:** Logout with session invalidation (08-04)

Key files:
- `src/lib/server/schema.ts` - users/sessions tables
- `src/lib/server/auth.ts` - password hashing, session management
- `src/hooks.server.ts` - session middleware
- `src/routes/auth/signup/` - registration
- `src/routes/auth/login/` - authentication
- `src/routes/auth/logout/` - session termination
- `src/lib/components/UserMenu.svelte` - user dropdown

## Phase 9 Completion Summary

Project Management complete with all requirements satisfied:
- **PROJ-01:** Projects table with user ownership (09-01)
- **PROJ-02:** Project CRUD operations (09-02)
- **PROJ-03:** Dashboard integration (09-03)

Key files:
- `src/lib/server/schema.ts` - projects table with userId FK
- `src/routes/projects/+page.svelte` - project list and create
- `src/routes/projects/[id]/+page.svelte` - project detail, edit, delete
- `src/routes/+page.server.ts` - dashboard server load for user projects
- `src/routes/+page.svelte` - conditional display of real/sample projects

### 09-01: Project Schema (COMPLETE)
Extended projects table with user ownership and metadata:
- userId FK to users.id with cascade delete
- description (nullable) for project summary
- notes (nullable) for additional details
- projectsRelations for Drizzle query API
- Database synchronized via db:push

### 09-02: Project CRUD Routes (COMPLETE)
Full project CRUD with SvelteKit form actions:
- /projects route with list and create functionality
- /projects/[id] route with view, edit, delete functionality
- All queries filter by userId for data isolation
- Progressive enhancement with use:enhance

### 09-03: Projects UI Integration (COMPLETE)
Dashboard displays real user projects:
- Server load fetches authenticated user's projects (limit 6)
- Conditional UI: real projects vs sample projects based on auth
- Empty state with CTA for users with no projects
- Navigation flows between dashboard and /projects routes

## Phase 10 Progress

### 10-01: Database Schema (COMPLETE)
Added BOM persistence tables:
- boms table with projectId FK and cascade delete
- bomItems table with bomId FK and cascade delete
- Drizzle relations for query API (project -> boms -> items)
- Database synchronized with db:push

### 10-02: Save Flow (COMPLETE)
Enabled saving generated BOMs to database:
- Project selection modal after BOM generation
- Server action inserts BOM with all items in transaction
- PRG pattern redirects to saved BOM view
- Success/error feedback via toast notifications

### 10-03: Saved BOM Viewing (COMPLETE)
Display saved BOMs within project context:
- Project detail page lists BOMs with metadata
- Nested route /projects/[id]/bom/[bomId] for detail view
- Security: ownership verification via project.userId
- Reuses BOMDisplay component (DRY principle)

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 10-03-PLAN.md (Saved BOM Viewing)
Resume file: None

## Next Steps

Complete Phase 10 (BOM Persistence):
1. Plan 10-04: Edit/Delete saved BOMs (final Phase 10 plan)
