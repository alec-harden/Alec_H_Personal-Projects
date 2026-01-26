# Roadmap: WoodShop Toolbox

**Created:** 2026-01-20
**Updated:** 2026-01-26 (v2.0 milestone added)

## Progress

| Phase | Name | Status | Requirements |
|-------|------|--------|--------------|
| 1 | Foundation | Complete | v1.0 |
| 2 | AI Integration | Complete | v1.0 |
| 3 | BOM Core Flow | Complete | v1.0 |
| 4 | BOM Editing | Complete | v1.0 |
| 5 | Export | Complete | v1.0 |
| 6 | Polish & Integration | Complete | v1.0 |
| 7 | Tech Debt Cleanup | Complete | v1.0 |
| 8 | Authentication Foundation | Planned | AUTH-01 to AUTH-04 |
| 9 | Project Management | Pending | PROJ-01 to PROJ-04 |
| 10 | BOM Persistence | Pending | BOM-01 to BOM-04 |
| 11 | Template Management | Pending | TMPL-01 to TMPL-05 |
| 12 | CSV Import | Pending | CSV-01 to CSV-04 |

---

## Milestone: v1.0 MVP (Shipped 2026-01-23)

<details>
<summary>Phases 1-7 (Complete)</summary>

### Phase 1: Foundation
**Goal:** Establish SvelteKit project with Tailwind and database foundation.
**Status:** Complete

### Phase 2: AI Integration
**Goal:** Connect Vercel AI SDK with configurable provider.
**Status:** Complete

### Phase 3: BOM Core Flow
**Goal:** Build 4-step wizard with AI-powered BOM generation.
**Status:** Complete

### Phase 4: BOM Editing
**Goal:** Enable inline editing, custom items, visibility toggle.
**Status:** Complete

### Phase 5: Export
**Goal:** CSV export with RFC 4180 compliance.
**Status:** Complete

### Phase 6: Polish & Integration
**Goal:** Error handling, retry, responsive design.
**Status:** Complete

### Phase 7: Tech Debt Cleanup
**Goal:** Remove unused dependencies, clean up code.
**Status:** Complete

</details>

---

## Milestone: v2.0 Persistence & Project Management

**Goal:** Add authentication, project management, BOM persistence, template admin, and CSV import to transform the single-session MVP into a persistent, manageable application.

**Requirements:** 17 total (see REQUIREMENTS.md)

---

### Phase 8: Authentication Foundation

**Goal:** Users can create accounts and log in securely.

**Requirements:**
- AUTH-01: User can sign up with email and password
- AUTH-02: User can log in with email and password
- AUTH-03: User session persists across browser refresh
- AUTH-04: User can log out

**Dependencies:** None (foundation phase)

**Plans:** 4 plans

Plans:
- [ ] 08-01-PLAN.md — Database schema and auth dependencies
- [ ] 08-02-PLAN.md — Session middleware and TypeScript types
- [ ] 08-03-PLAN.md — Signup and login routes
- [ ] 08-04-PLAN.md — Logout and layout integration

**Success Criteria:**
1. User can fill signup form with email/password and create account
2. User can log in with existing credentials
3. User session persists across browser refresh (cookie-based)
4. User can log out and session is invalidated
5. Invalid credentials show appropriate error messages

**Technical Notes:**
- Add users and sessions tables to Drizzle schema
- Implement password hashing with Argon2 (@node-rs/argon2)
- Create hooks.server.ts for session middleware
- Build /auth/login and /auth/signup routes
- Use oslo utilities for auth helpers

---

### Phase 9: Project Management

**Goal:** Users can organize their work into named projects.

**Requirements:**
- PROJ-01: User can create a named project with description
- PROJ-02: User can view list of their projects
- PROJ-03: User can edit project metadata (name, description, notes)
- PROJ-04: User can delete a project

**Dependencies:** Phase 8 (requires authentication)

**Success Criteria:**
1. User can create new project with name and description
2. User can view list of their projects on /projects page
3. User can edit project name, description, and notes
4. User can delete a project (with confirmation)
5. Projects are associated with authenticated user only

**Technical Notes:**
- Extend projects table with userId, description, notes fields
- Create /projects route with list view
- Create /projects/[id] route for project detail
- Implement /api/projects endpoints (GET, POST, PATCH, DELETE)
- Update dashboard to show user's projects

---

### Phase 10: BOM Persistence

**Goal:** Users can save and manage generated BOMs within projects.

**Requirements:**
- BOM-01: User can save generated BOM to a project
- BOM-02: User can view saved BOMs in a project
- BOM-03: User can edit a saved BOM (quantities, items, visibility)
- BOM-04: User can delete a saved BOM

**Dependencies:** Phase 9 (requires projects)

**Success Criteria:**
1. User can save AI-generated BOM to a selected project
2. User can view list of saved BOMs within a project
3. User can edit saved BOM (quantities, items, visibility)
4. User can delete a saved BOM (with confirmation)
5. Edited BOM changes persist after page refresh

**Technical Notes:**
- Add boms and bomItems tables to schema
- Add "Save to Project" button to BOMDisplay component
- Create /projects/[id]/bom/[bomId] route for viewing saved BOM
- Implement /api/bom/save and /api/bom/[id] endpoints
- Use Drizzle transactions for atomic BOM+items saves

---

### Phase 11: Template Management

**Goal:** Templates are database-backed and admin-manageable.

**Requirements:**
- TMPL-01: Templates stored in database (migrated from code)
- TMPL-02: User can view all templates in admin panel
- TMPL-03: User can add a new template
- TMPL-04: User can edit an existing template
- TMPL-05: User can delete a template

**Dependencies:** Phase 8 (requires authentication)

**Success Criteria:**
1. Templates load from database instead of hardcoded file
2. User can view all templates in /admin/templates
3. User can add new template with all fields (dimensions, joinery, woods, finishes)
4. User can edit existing template
5. User can delete a template (with confirmation)

**Technical Notes:**
- Add templates table with joinery options as JSON field
- Create seed script to migrate existing templates from code to DB
- Update BOM wizard to load templates from database
- Create /admin/templates route with CRUD UI
- Implement /api/templates endpoints

---

### Phase 12: CSV Import

**Goal:** Users can create BOMs from uploaded CSV files.

**Requirements:**
- CSV-01: User can upload CSV file to create BOM
- CSV-02: CSV import validates format and shows errors
- CSV-03: Imported BOM can be edited like AI-generated BOM
- CSV-04: Imported BOM can be saved to a project

**Dependencies:** Phase 8 (auth), Phase 10 (BOM persistence)

**Success Criteria:**
1. User can upload CSV file on BOM creation page
2. Invalid CSV shows clear validation errors (missing columns, bad data)
3. Imported BOM appears in BOMDisplay with full editing capabilities
4. Imported BOM can be saved to a project
5. CSV format matches export format (round-trip compatibility)

**Technical Notes:**
- Add CSV upload option to /bom/new route
- Use PapaParse for CSV parsing
- Validate against expected BOM schema (name, quantity, unit, category)
- Reuse existing BOMDisplay component for editing
- Handle encoding issues (UTF-8 BOM, Windows line endings)

---

## Requirement Coverage

| Category | Requirements | Phase | Count |
|----------|--------------|-------|-------|
| AUTH | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 8 | 4 |
| PROJ | PROJ-01, PROJ-02, PROJ-03, PROJ-04 | 9 | 4 |
| BOM | BOM-01, BOM-02, BOM-03, BOM-04 | 10 | 4 |
| TMPL | TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05 | 11 | 5 |
| CSV | CSV-01, CSV-02, CSV-03, CSV-04 | 12 | 4 |

**Total:** 17 requirements | **Mapped:** 17 | **Unmapped:** 0

---

## Phase Dependencies

```
Phase 8: Authentication Foundation
    |-- Phase 9: Project Management
    |       +-- Phase 10: BOM Persistence
    |               +-- Phase 12: CSV Import (also depends on Phase 8)
    +-- Phase 11: Template Management
```

**Parallel Opportunities:**
- Phase 11 (Templates) can run parallel to Phases 9-10 after Phase 8 completes
- Phase 12 (CSV) requires both Phase 8 and Phase 10

---

*Roadmap created: 2026-01-20*
*Last updated: 2026-01-26 after Phase 8 planning*
