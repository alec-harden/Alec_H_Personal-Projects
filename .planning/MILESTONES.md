# Project Milestones: WoodShop Toolbox

## v2.0 Persistence & Project Management (Shipped: 2026-01-28)

**Delivered:** Authentication, project management, BOM persistence, template admin panel, and CSV import — transforming the single-session MVP into a fully persistent, manageable application.

**Phases completed:** 8-12 (17 plans total)

**Key accomplishments:**

- Email/password authentication with session management (oslo + Argon2)
- Project CRUD with user ownership and dashboard integration
- BOM persistence with save/load/edit/delete within projects
- Database-backed templates with admin panel CRUD
- CSV import with validation and round-trip export compatibility
- Optimistic UI updates for instant feedback on edits

**Stats:**

- 92 files modified
- 15,537 lines added (10,450 total LOC)
- 5 phases, 17 plans
- 3 days from start to ship (2026-01-26 to 2026-01-28)
- 67 commits

**Git range:** `docs(08)` to `docs: add v2.0 milestone audit report`

**What's next:** v2.1 or v3.0 — password reset, email verification, or multi-user support

---

## v1.0 MVP (Shipped: 2026-01-23)

**Delivered:** AI-powered Bill of Materials generator with guided wizard, editing, and CSV export — a complete personal tool for planning woodworking projects.

**Phases completed:** 1-7 (15 plans total)

**Key accomplishments:**

- SvelteKit + Tailwind v4 foundation with Drizzle ORM database integration
- AI-powered BOM generation with configurable LLM provider (Claude/GPT)
- 4-step guided wizard with 6 woodworking project templates
- Comprehensive BOM with 4 categories: Lumber, Hardware, Finishes, Consumables
- Full editing capabilities: inline quantity editing, add items, visibility toggle
- RFC 4180 compliant CSV export with sanitized filenames
- Polished UX: error classification, one-click retry, responsive design

**Stats:**

- 28 source files created
- 4,853 lines of TypeScript/Svelte
- 7 phases, 15 plans, ~60 tasks
- 4 days from start to ship (2026-01-20 to 2026-01-23)

**Git range:** `feat(01-01)` to `docs(07)`

**What's next:** v1.1 persistence — save BOMs for later access and project history

---

