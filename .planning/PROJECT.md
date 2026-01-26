# WoodShop Toolbox

## What This Is

A modular web application hosting personal woodworking tools. The first tool is a Bill of Materials (BOM) generator that uses AI-powered guided prompts to help plan woodworking projects and generate comprehensive material lists. Designed as a plug-and-play platform where new tools can be easily added via a dashboard interface.

## Current Milestone: v2.0 Persistence & Project Management

**Goal:** Add authentication, project management, BOM persistence, template admin, and CSV import to transform the single-session MVP into a persistent, manageable application.

**Target features:**
- Email/password authentication with session management
- Named projects with metadata to organize BOMs
- Save/load BOMs for later access and editing
- Admin panel for database-backed template management
- CSV import to create BOMs from files

**Phases:** 8-12 (see ROADMAP.md)

## Current State

**Version:** v1.0 MVP (shipped 2026-01-23)

**What's working:**
- Dashboard home page with tool navigation
- AI-powered BOM generator with 4-step guided wizard
- 6 woodworking project templates (table, cabinet, shelf, workbench, box, chair)
- Comprehensive BOM generation covering lumber, hardware, finishes, consumables
- Full editing: inline quantity editing, add custom items, visibility toggle
- CSV export with RFC 4180 compliance
- Responsive design for desktop and tablet
- Error handling with retry capability

**Tech stack:**
- SvelteKit 2.x + Svelte 5 (runes)
- Tailwind CSS v4 (@tailwindcss/vite)
- Drizzle ORM + LibSQL/Turso
- Vercel AI SDK (Anthropic/OpenAI configurable)

**Codebase:** 28 source files, 4,853 lines TypeScript/Svelte

## Core Value

Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.

## Requirements

### Validated (v1.0)

**Platform Architecture**
- [x] Dashboard home page with tool cards for navigation — v1.0
- [x] Responsive design for desktop and tablet use — v1.0

**BOM Generator - Core Flow**
- [x] Guided prompt workflow: project type → dimensions → joinery → materials — v1.0
- [x] AI-powered material suggestions using configurable LLM provider — v1.0
- [x] Project templates that guide AI suggestions (table, cabinet, shelf, etc.) — v1.0
- [x] Generate comprehensive BOM covering lumber, hardware, finishes, consumables — v1.0

**BOM Generator - Editing**
- [x] Edit quantities for any material — v1.0
- [x] Add custom materials not suggested by AI — v1.0
- [x] Toggle visibility on items (greyed out, excluded from export and totals) — v1.0
- [x] Group materials by category (Lumber, Hardware, Finishes, Consumables) — v1.0

**BOM Generator - Export**
- [x] Export BOM to CSV — v1.0

### Active (v2.0)

**Authentication**
- [ ] AUTH-01: User can sign up with email and password
- [ ] AUTH-02: User can log in with email and password
- [ ] AUTH-03: User session persists across browser refresh
- [ ] AUTH-04: User can log out

**Project Management**
- [ ] PROJ-01: User can create a named project with description
- [ ] PROJ-02: User can view list of their projects
- [ ] PROJ-03: User can edit project metadata (name, description, notes)
- [ ] PROJ-04: User can delete a project

**BOM Persistence**
- [ ] BOM-01: User can save generated BOM to a project
- [ ] BOM-02: User can view saved BOMs in a project
- [ ] BOM-03: User can edit a saved BOM (quantities, items, visibility)
- [ ] BOM-04: User can delete a saved BOM

**Template Management**
- [ ] TMPL-01: Templates stored in database (migrated from code)
- [ ] TMPL-02: User can view all templates in admin panel
- [ ] TMPL-03: User can add a new template
- [ ] TMPL-04: User can edit an existing template
- [ ] TMPL-05: User can delete a template

**CSV Import**
- [ ] CSV-01: User can upload CSV file to create BOM
- [ ] CSV-02: CSV import validates format and shows errors
- [ ] CSV-03: Imported BOM can be edited like AI-generated BOM
- [ ] CSV-04: Imported BOM can be saved to a project

### Out of Scope

- Real-time collaboration — single user focus
- Mobile app — web-first, responsive design sufficient
- Pricing/cost estimation — may add later
- Inventory tracking — separate tool if needed
- Cut list optimization — separate tool if needed
- 3D visualization — complexity not justified
- OAuth login (Google/GitHub) — email/password sufficient for single-user
- Password reset/email verification — defer to v2.1
- Session caching (Redis) — over-optimization for single-user
- Multi-tenancy — v3.0+ scope

## Context

**Domain:** Personal woodworking project planning. User is a hobbyist woodworker who wants to streamline the planning phase of projects.

**First tool priority:** BOM generator is the flagship tool. Platform architecture should support it well but remain generic enough for future tools.

**AI integration:** The BOM generator understands woodworking terminology, common project types, standard material dimensions, and typical hardware requirements. Templates provide domain knowledge, AI provides reasoning and flexibility.

**Future tools (not in scope but informs architecture):**
- Cut list optimizer
- Project cost estimator
- Wood movement calculator
- Finish compatibility checker

## Constraints

- **Deployment:** Cloud hosted (Vercel, Railway, or similar) — must be accessible from any device
- **AI Provider:** Must support multiple LLM providers (Claude, GPT, etc.) — avoid vendor lock-in
- **Budget:** Personal project, minimize ongoing costs (serverless preferred)
- **Tech Stack:** SvelteKit + Tailwind + Drizzle (established in v1.0)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guided prompts over free-form input | More structured = more complete BOMs, easier for AI to process | ✓ Implemented (4-step wizard) |
| AI + templates hybrid | Pure AI might miss domain specifics; pure templates too rigid | ✓ Implemented (6 templates + AI generation) |
| Dashboard with tool cards | Clear visual organization, easy to add new tools | ✓ Implemented |
| Category-based material grouping | Matches how woodworkers think about and purchase materials | ✓ Implemented (Lumber, Hardware, Finishes, Consumables) |
| Toggle visibility vs delete | Non-destructive editing, user can reconsider hidden items | ✓ Implemented (checkbox toggle, hidden property) |
| Configurable LLM provider | Flexibility as AI landscape evolves, cost optimization | ✓ Implemented (AI_PROVIDER env var) |
| Provider factory pattern | SvelteKit dynamic env requires explicit apiKey in SDK calls | ✓ Implemented (createAnthropic/createOpenAI) |
| Click-to-edit inline editing | Less modal, faster editing workflow | ✓ Implemented |
| RFC 4180 CSV export | Standard format for spreadsheet compatibility | ✓ Implemented |
| Design for multi-user | Small upfront cost, avoids painful refactor later | — Deferred to v2 |
| Custom auth over framework | Lucia deprecated, Auth.js is OAuth-focused; oslo + Argon2 sufficient | — v2.0 planned |
| Sessions in Turso | No external cache needed for single-user; keeps stack simple | — v2.0 planned |
| Self-registration | Simplest approach for single-user; no admin account creation needed | — v2.0 planned |
| Templates in database | Enables admin CRUD; migrating from hardcoded file | — v2.0 planned |
| CSV import matches export | Round-trip compatibility; reuse existing BOM schema | — v2.0 planned |

---
*Last updated: 2026-01-26 after v2.0 milestone definition*
