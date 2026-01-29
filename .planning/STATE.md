# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-26)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** v2.0 Persistence & Project Management

## Current Position

Phase: 12 (CSV Import)
Plan: 2 of 2 complete
Status: Phase complete — Milestone complete
Last activity: 2026-01-28 — Completed 12-02-PLAN.md (CSV Import Integration)

Progress: [██████████████████████████████████████████████████] 100.0%

## Milestone History

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-7 | SHIPPED | 2026-01-23 |
| v2.0 Persistence | 8-12 | COMPLETE | 2026-01-28 |

See `.planning/MILESTONES.md` for full milestone details.

## v2.0 Phase Status

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 8 | Authentication Foundation | 4/4 | COMPLETE |
| 9 | Project Management | 3/3 | COMPLETE |
| 10 | BOM Persistence | 4/4 | COMPLETE |
| 11 | Template Management | 4/4 | COMPLETE |
| 12 | CSV Import | 2/2 | COMPLETE |

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
- 10-02: Show save button only when user has projects (data.projects.length > 0)
- 10-02: Use Drizzle transaction for atomic BOM + items insert
- 10-02: Parse generatedAt from ISO string to timestamp for DB
- 10-02: Return empty projects array from server load if not authenticated
- 10-02: Success banner dismissible by user, appears above BOM display
- 10-03: Nested route structure /projects/[id]/bom/[bomId] maintains hierarchical context
- 10-03: Reuse BOMDisplay component for saved BOMs (DRY principle)
- 10-04: Optimistic UI updates for quantity and visibility changes (instant feedback)
- 10-04: PATCH endpoint validates ownership through nested relations (item -> bom -> project)
- 10-04: BOM.updatedAt timestamp updates on any item change
- 10-04: Danger zone pattern for BOM deletion with confirmation dialog

Phase 11 decisions:
- 11-01: Use text mode for JSON columns (not blob) - SQLite JSON functions require text
- 11-01: Export interfaces from schema.ts for reuse across codebase
- 11-01: Standalone DB connection in seed script using dotenv (not $env)
- 11-01: Idempotent seed script checks for existing templates before insert
- 11-02: Templates API is public (no auth) - shared data for BOM generation
- 11-02: templates.ts retains type definitions only - data comes from database
- 11-02: BOMWizard uses onMount fetch with loading/error states
- 11-02: BOM generate endpoint queries database directly for template context
- 11-02: Child wizard steps unchanged - already receive templates via props
- 11-03: Admin route pattern at /admin/{resource} for management pages
- 11-03: Toggle-able create form hidden by default for clean list view
- 11-03: Indexed form fields (joinery_0_id, joinery_1_id) for dynamic array submission
- 11-03: Comma-separated text inputs for simple string arrays (woods, finishes, hardware)
- 11-03: Server file created by parallel 11-02 execution (identical content, no duplication needed)
- 11-04: Update action returns { success: true } for in-place feedback (no redirect)
- 11-04: Delete action uses PRG pattern (redirect to list after deletion)
- 11-04: Joinery options initialized as reactive copy from data.template for editing
- 11-04: Height fields use nullish coalescing for optional dimension display

Phase 12 decisions:
- 12-01: PapaParse library for CSV parsing - robust RFC 4180 compliance and UTF-8 BOM handling
- 12-01: parseFloat for quantities - supports fractional lumber quantities (board feet)
- 12-01: Case-insensitive category validation - accept 'Lumber', 'LUMBER', 'lumber' variations
- 12-01: 10MB file size limit - balance usability with performance
- 12-01: Drag-and-drop + button upload - dual interaction patterns for accessibility
- 12-01: ID generation pattern for CSV items: csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}
- 12-02: Creation method selection before wizard/CSV - clear user choice instead of hidden tab
- 12-02: CSV imports use projectType 'csv-import' - distinguishes from AI-generated BOMs
- 12-02: Imported BOMs use same BOMDisplay - full parity with AI-generated BOMs (edit, save, export)
- 12-02: Back navigation returns to method selection - allows switching creation method

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

### 10-04: BOM Editing and Deletion (COMPLETE)
Complete BOM CRUD with editing and deletion:
- DELETE /api/bom/[id] endpoint with cascade deletion
- PATCH /api/bom/[id]/items/[itemId] for quantity/visibility updates
- Optimistic UI updates for instant feedback
- Danger zone section for BOM deletion
- All BOM persistence requirements satisfied (BOM-01 through BOM-04)

## Phase 10 Completion Summary

BOM Persistence complete with all requirements satisfied:
- **BOM-01:** Save generated BOMs to projects (10-02)
- **BOM-02:** View saved BOMs within project context (10-03)
- **BOM-03:** Edit saved BOM quantities and visibility (10-04)
- **BOM-04:** Delete saved BOMs (10-04)

Key files:
- `src/lib/server/schema.ts` - boms and bomItems tables
- `src/routes/api/bom/save/+server.ts` - BOM save endpoint
- `src/routes/api/bom/[id]/+server.ts` - BOM deletion endpoint
- `src/routes/api/bom/[id]/items/[itemId]/+server.ts` - Item update endpoint
- `src/routes/projects/[id]/+page.svelte` - BOM list in project detail
- `src/routes/projects/[id]/bom/[bomId]/` - Saved BOM view with editing

## Phase 11 Progress

### 11-01: Database Schema (COMPLETE)
Templates table added with typed JSON columns:
- JoineryOption, DimensionRange, TemplateDimensions interfaces exported
- templates table with defaultDimensions, joineryOptions, suggestedWoods, suggestedFinishes, typicalHardware
- scripts/seed-templates.ts migrates hardcoded templates
- 5 templates seeded: Table, Cabinet, Shelf/Bookcase, Workbench, Box/Chest

Key files:
- `src/lib/server/schema.ts` - templates table and interfaces
- `scripts/seed-templates.ts` - seed script with standalone DB connection

### 11-02: Template API (COMPLETE)
BOM wizard and generation wired to database-backed templates:
- GET /api/templates endpoint returning all templates ordered by name
- templates.ts reduced to type definitions only (data removed)
- BOMWizard fetches templates on mount with loading/error states
- BOM generate endpoint queries database for template context
- Child wizard steps unchanged (already prop-driven)

Key files:
- `src/routes/api/templates/+server.ts` - GET endpoint for templates
- `src/lib/data/templates.ts` - Type definitions only
- `src/lib/components/bom/BOMWizard.svelte` - Dynamic template fetch
- `src/routes/api/bom/generate/+server.ts` - Database template lookup

### 11-03: Admin Templates List & Create (COMPLETE)
Admin UI for template management:
- /admin/templates route with auth protection (load + actions)
- Template list with icons, descriptions, and metadata counts
- Create form with all fields: name, icon, description, dimensions, joinery, suggestions
- Dynamic joinery options array with add/remove
- Progressive enhancement with use:enhance and loading state
- PRG pattern redirects to template detail after creation

Key files:
- `src/routes/admin/templates/+page.server.ts` - Load + create action (created by 11-02)
- `src/routes/admin/templates/+page.svelte` - List and create form UI

### 11-04: Template Edit & Delete (COMPLETE)
Admin template detail page with edit and delete:
- /admin/templates/[id] route with auth protection (load + actions)
- Edit form pre-populates all fields from loaded template
- Update action modifies all fields and sets updatedAt timestamp
- Delete action removes template with confirmation dialog and redirects to list
- Dynamic joinery options with add/remove
- Success toast auto-dismisses after 3 seconds

Key files:
- `src/routes/admin/templates/[id]/+page.server.ts` - Load, update, and delete actions
- `src/routes/admin/templates/[id]/+page.svelte` - Edit form and delete button UI

## Phase 11 Completion Summary

Template Management complete with all requirements satisfied:
- **TMPL-01:** Templates table with typed JSON columns (11-01)
- **TMPL-02:** Template API endpoint for BOM wizard (11-02)
- **TMPL-03:** Admin template list and create (11-03)
- **TMPL-04:** Admin template edit (11-04)
- **TMPL-05:** Admin template delete (11-04)

Key files:
- `src/lib/server/schema.ts` - templates table and interfaces
- `scripts/seed-templates.ts` - seed script
- `src/routes/api/templates/+server.ts` - GET endpoint
- `src/routes/admin/templates/` - Admin list and create
- `src/routes/admin/templates/[id]/` - Admin edit and delete

## Phase 12 Progress

### 12-01: CSV Import Foundation (COMPLETE)
Created CSV parsing utilities and upload component:
- csv-import.ts with file validation, header validation, row validation
- parseCSVFile entry point with PapaParse integration
- CSVUpload.svelte component with drag-and-drop and error display
- Support for fractional quantities and case-insensitive categories
- UTF-8 BOM stripping for Excel compatibility

Key files:
- `src/lib/utils/csv-import.ts` - CSV parsing and validation utilities
- `src/lib/components/bom/CSVUpload.svelte` - Drag-and-drop upload UI

### 12-02: CSV Import Integration (COMPLETE)
Integrated CSV import into BOM creation page:
- Creation method selection view (AI wizard vs CSV import)
- CSV import flow with CSVUpload component
- Imported BOMs use BOMDisplay with full editing (quantity, visibility, add items)
- Save to project works for CSV imports via existing flow
- Round-trip CSV compatibility verified (export → re-import)

Key files:
- `src/routes/bom/new/+page.svelte` - Updated with creation method selection and CSV flow

## Phase 12 Completion Summary

CSV Import complete with all requirements satisfied:
- **CSV-01:** Upload CSV file via drag-and-drop or button click (12-01)
- **CSV-02:** Validation errors with row-level detail (12-01)
- **CSV-03:** Full editing in BOMDisplay (12-02)
- **CSV-04:** Save to project via existing flow (12-02)

Key files:
- `src/lib/utils/csv-import.ts` - CSV parsing and validation
- `src/lib/components/bom/CSVUpload.svelte` - Upload UI
- `src/routes/bom/new/+page.svelte` - Unified creation page

## Session Continuity

Last session: 2026-01-28
Stopped at: Completed 12-02-PLAN.md (CSV Import Integration)
Resume file: None

## Next Steps

v2.0 Persistence & Project Management COMPLETE (Phases 8-12 all shipped).
All planned requirements delivered. Awaiting next milestone planning.
