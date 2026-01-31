# WoodShop Toolbox

## What This Is

A modular web application hosting personal woodworking tools with multi-user support. Features include an AI-powered Bill of Materials generator with guided prompts and a Cut List Optimizer for minimizing material waste. Designed as a plug-and-play platform where new tools can be easily added via a dashboard interface.

## Current State

**Version:** v3.0 Multi-User & Cut Optimizer (shipped 2026-01-30)

**What's working:**
- Dashboard home page with tool navigation
- AI-powered BOM generator with 4-step guided wizard
- 6 woodworking project templates (database-backed, admin-manageable)
- Comprehensive BOM with lumber dimensions and board feet calculation
- Full editing: inline quantity editing, add items, eye icon visibility toggle
- CSV export/import with dimension columns for lumber
- Responsive design for desktop and tablet
- Email/password authentication with session management
- Project organization with full CRUD
- BOM persistence (save/load/edit/delete within projects)
- Role-based access control (admin/user roles)
- Admin panel for template and user management
- Password reset and email verification flows
- Cut List Optimizer with 1D (FFD) and 2D (Guillotine) algorithms
- BOM integration for pre-populating cuts from lumber items
- Shop checklist with completion tracking and progress indicators
- Manual overrides with drag-drop stock assignment

**Tech stack:**
- SvelteKit 2.x + Svelte 5 (runes)
- Tailwind CSS v4 (@tailwindcss/vite)
- Drizzle ORM + LibSQL/Turso
- Vercel AI SDK (Anthropic/OpenAI configurable)
- oslo + Argon2 for authentication
- Resend API for transactional email

**Codebase:** ~75 source files, 17,599 lines TypeScript/Svelte

## Core Value

Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.

## Requirements

### Validated

**Platform Architecture (v1.0)**
- [x] Dashboard home page with tool cards for navigation — v1.0
- [x] Responsive design for desktop and tablet use — v1.0

**BOM Generator - Core Flow (v1.0)**
- [x] Guided prompt workflow: project type -> dimensions -> joinery -> materials — v1.0
- [x] AI-powered material suggestions using configurable LLM provider — v1.0
- [x] Project templates that guide AI suggestions (table, cabinet, shelf, etc.) — v1.0
- [x] Generate comprehensive BOM covering lumber, hardware, finishes, consumables — v1.0

**BOM Generator - Editing (v1.0)**
- [x] Edit quantities for any material — v1.0
- [x] Add custom materials not suggested by AI — v1.0
- [x] Toggle visibility on items (greyed out, excluded from export and totals) — v1.0
- [x] Group materials by category (Lumber, Hardware, Finishes, Consumables) — v1.0

**BOM Generator - Export (v1.0)**
- [x] Export BOM to CSV — v1.0

**Authentication (v2.0)**
- [x] AUTH-01: User can sign up with email and password — v2.0
- [x] AUTH-02: User can log in with email and password — v2.0
- [x] AUTH-03: User session persists across browser refresh — v2.0
- [x] AUTH-04: User can log out — v2.0

**Project Management (v2.0)**
- [x] PROJ-01: User can create a named project with description — v2.0
- [x] PROJ-02: User can view list of their projects — v2.0
- [x] PROJ-03: User can edit project metadata (name, description, notes) — v2.0
- [x] PROJ-04: User can delete a project — v2.0

**BOM Persistence (v2.0)**
- [x] BOM-01: User can save generated BOM to a project — v2.0
- [x] BOM-02: User can view saved BOMs in a project — v2.0
- [x] BOM-03: User can edit a saved BOM (quantities, items, visibility) — v2.0
- [x] BOM-04: User can delete a saved BOM — v2.0

**Template Management (v2.0)**
- [x] TMPL-01: Templates stored in database (migrated from code) — v2.0
- [x] TMPL-02: User can view all templates in admin panel — v2.0
- [x] TMPL-03: User can add a new template — v2.0
- [x] TMPL-04: User can edit an existing template — v2.0
- [x] TMPL-05: User can delete a template — v2.0

**CSV Import (v2.0)**
- [x] CSV-01: User can upload CSV file to create BOM — v2.0
- [x] CSV-02: CSV import validates format and shows errors — v2.0
- [x] CSV-03: Imported BOM can be edited like AI-generated BOM — v2.0
- [x] CSV-04: Imported BOM can be saved to a project — v2.0

**RBAC & Security (v3.0)**
- [x] RBAC-01: Users have a role field (admin or user) — v3.0
- [x] RBAC-02: Admin role grants elevated permissions — v3.0
- [x] RBAC-03: User role is default for new registrations — v3.0
- [x] RBAC-04: Admin routes (/admin/*) check role before access — v3.0
- [x] RBAC-05: Users can only see their own projects, BOMs, and cut lists — v3.0
- [x] RBAC-06: First registered user becomes admin (or seed admin) — v3.0

**User Management (v3.0)**
- [x] USER-01: Admin can view list of all users — v3.0
- [x] USER-02: Admin can create new user account — v3.0
- [x] USER-03: Admin can reset a user's password — v3.0
- [x] USER-04: Admin can disable a user account — v3.0
- [x] USER-05: Admin can view user details (email, created date, role) — v3.0
- [x] USER-06: Disabled users cannot log in — v3.0

**Email Flows (v3.0)**
- [x] EMAIL-01: User can request password reset from login page — v3.0
- [x] EMAIL-02: User receives email with password reset link — v3.0
- [x] EMAIL-03: User can set new password via reset link (expires in 1 hour) — v3.0
- [x] EMAIL-04: New user receives email verification request after signup — v3.0
- [x] EMAIL-05: User can verify email by clicking link in email — v3.0
- [x] EMAIL-06: User profile shows email verification status — v3.0

**BOM Refinements (v3.0)**
- [x] BOM-05: Visibility toggle uses eye icon (not checkbox) — v3.0
- [x] BOM-06: Lumber items have dimension fields (length, width, height) — v3.0
- [x] BOM-07: Lumber items display board feet (calculated from dimensions) — v3.0
- [x] BOM-08: Lumber category shows total board feet — v3.0
- [x] BOM-09: CSV export includes dimension columns for lumber — v3.0
- [x] BOM-10: CSV import parses dimension columns for lumber — v3.0

**Cut List Optimizer - Core (v3.0)**
- [x] CUT-01: New tool accessible from dashboard (/cutlist) — v3.0
- [x] CUT-02: User can select Linear or Sheet optimization mode — v3.0
- [x] CUT-03: User can input required cuts with dimensions — v3.0
- [x] CUT-04: User can input available stock dimensions — v3.0
- [x] CUT-05: User can configure kerf/blade width — v3.0
- [x] CUT-06: User can run optimization algorithm — v3.0
- [x] CUT-07: Results display waste percentage — v3.0
- [x] CUT-08: Results display which cuts come from which stock — v3.0
- [x] CUT-09: User can clear all inputs and start over — v3.0
- [x] CUT-10: User can save cut list to a project — v3.0

**Cut List Optimizer - Linear (v3.0)**
- [x] CUT-11: Linear mode accepts cut lengths — v3.0
- [x] CUT-12: Linear mode accepts stock lengths — v3.0
- [x] CUT-13: Linear mode supports multiple stock length options — v3.0
- [x] CUT-14: Linear mode displays total linear feet summary — v3.0
- [x] CUT-15: Linear mode visualizes unused portions of stock — v3.0
- [x] CUT-16: 1D bin packing algorithm (FFD) produces optimal-ish cuts — v3.0

**Cut List Optimizer - Sheet (v3.0)**
- [x] CUT-17: Sheet mode accepts cut dimensions (L x W) — v3.0
- [x] CUT-18: Sheet mode accepts sheet dimensions — v3.0
- [x] CUT-19: Sheet mode supports grain direction toggle per cut — v3.0
- [x] CUT-20: Sheet mode displays cut diagram visualization — v3.0
- [x] CUT-21: Sheet mode displays number of sheets needed — v3.0
- [x] CUT-22: 2D nesting algorithm (guillotine) produces optimal-ish placement — v3.0

**Cut List Optimizer - Integration (v3.0)**
- [x] CUT-23: User can select a project — v3.0
- [x] CUT-24: User can multi-select BOMs within selected project — v3.0
- [x] CUT-25: Selected BOMs auto-filter to lumber items only — v3.0
- [x] CUT-26: Lumber items pre-populate as cuts with dimensions — v3.0
- [x] CUT-27: User can view cut list as shop checklist — v3.0
- [x] CUT-28: User can mark individual cuts as complete — v3.0
- [x] CUT-29: Checklist shows completion progress indicator — v3.0
- [x] CUT-30: Checklist completion state persists to project — v3.0
- [x] CUT-31: User can drag-drop materials to assign stock to cuts — v3.0
- [x] CUT-32: User can manually override algorithm cut placement — v3.0

**UI Refinements (v3.0)**
- [x] UI-01: Account creation requires First and Last names — v3.0
- [x] UI-02: Logged-in dropdown displays user's First Name — v3.0
- [x] UI-03: User dropdown fixed to top-right corner — v3.0
- [x] NAV-01: Left Side Panel reorganized: Dashboard, Projects, BOMs, Cut Lists — v3.0
- [x] NAV-02: TOOLS heading with Create BOM and Create Cut List — v3.0
- [x] NAV-03: Wood Movement Calculator references removed — v3.0
- [x] NAV-04: Dashboard shows only last 6 projects — v3.0
- [x] NAV-05: Start new build icon and New project button active — v3.0
- [x] CUT-33 to CUT-39: Cut list UI refinements and navigation — v3.0

### Active

(No active requirements — define in next milestone with `/gsd:new-milestone`)

### Out of Scope

- Real-time collaboration — single user focus per account
- Mobile app — web-first, responsive design sufficient
- Pricing/cost estimation — may add later
- Inventory tracking — separate tool if needed
- 3D visualization — complexity not justified
- OAuth login (Google/GitHub) — email/password sufficient
- Session caching (Redis) — over-optimization for current scale
- CNC machine integration — niche feature, adds complexity
- Multi-material optimization — optimize one material at a time
- Curved cuts / irregular shapes — different problem domain
- Granular permissions — admin/user binary sufficient
- Two-factor authentication — over-engineering for woodworking tool

## Context

**Domain:** Woodworking project planning for hobbyist woodworkers. Now supports multi-user operation with role-based access control for sharing with woodworking community.

**Tools:**
- BOM Generator (flagship, v1.0) — AI-powered material list generation
- Cut List Optimizer (v3.0) — Material efficiency through cut optimization

**AI integration:** The BOM generator understands woodworking terminology, common project types, standard material dimensions, and typical hardware requirements. Templates provide domain knowledge, AI provides reasoning and flexibility.

**Cut optimization:** Non-AI algorithmic optimization using 1D bin packing (boards) and 2D nesting (sheet goods). Integrates with BOM to pull lumber items with dimensions.

**Future tools (not in scope but informs architecture):**
- Project cost estimator
- Finish compatibility checker

## Constraints

- **Deployment:** Cloud hosted (Vercel, Railway, or similar) — must be accessible from any device
- **AI Provider:** Must support multiple LLM providers (Claude, GPT, etc.) — avoid vendor lock-in
- **Budget:** Personal project, minimize ongoing costs (serverless preferred)
- **Tech Stack:** SvelteKit + Tailwind + Drizzle (established in v1.0)
- **Email:** Resend API for transactional email (established in v3.0)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guided prompts over free-form input | More structured = more complete BOMs, easier for AI to process | ✓ v1.0 |
| AI + templates hybrid | Pure AI might miss domain specifics; pure templates too rigid | ✓ v1.0 |
| Dashboard with tool cards | Clear visual organization, easy to add new tools | ✓ v1.0 |
| Category-based material grouping | Matches how woodworkers think about and purchase materials | ✓ v1.0 |
| Toggle visibility vs delete | Non-destructive editing, user can reconsider hidden items | ✓ v1.0 |
| Configurable LLM provider | Flexibility as AI landscape evolves, cost optimization | ✓ v1.0 |
| Provider factory pattern | SvelteKit dynamic env requires explicit apiKey in SDK calls | ✓ v1.0 |
| Click-to-edit inline editing | Less modal, faster editing workflow | ✓ v1.0 |
| RFC 4180 CSV export | Standard format for spreadsheet compatibility | ✓ v1.0 |
| Design for multi-user | Small upfront cost, avoids painful refactor later | ✓ v2.0 |
| Custom auth over framework | Lucia deprecated, Auth.js is OAuth-focused; oslo + Argon2 sufficient | ✓ v2.0 |
| Sessions in Turso | No external cache needed for single-user; keeps stack simple | ✓ v2.0 |
| Self-registration | Simplest approach for single-user; no admin account creation needed | ✓ v2.0 |
| Templates in database | Enables admin CRUD; migrated from hardcoded file | ✓ v2.0 |
| CSV import matches export | Round-trip compatibility; reuse existing BOM schema | ✓ v2.0 |
| Optimistic UI for BOM edits | Instant feedback for quantity/visibility changes | ✓ v2.0 |
| Role as text enum | Simple 'user'/'admin' enum sufficient for hobby app | ✓ v3.0 |
| First-admin via count=0 | Acceptable race condition for hobby app; no transaction needed | ✓ v3.0 |
| Resend for email | Simple API, generous free tier, good deliverability | ✓ v3.0 |
| SHA-256 hashed tokens | Never store plaintext tokens; 1-hour expiry for password reset | ✓ v3.0 |
| FFD for 1D bin packing | Simple, effective algorithm; sort by length descending | ✓ v3.0 |
| Guillotine for 2D nesting | Guaranteed perpendicular cuts; BSSF+SAS placement | ✓ v3.0 |
| Custom optimizer over library | Full control, no dependency; algorithms are straightforward | ✓ v3.0 |
| Native HTML5 drag-drop | Simpler than svelte-dnd-action for manual overrides | ✓ v3.0 |
| Navigation state passing | Cleaner UX than URL params for results page | ✓ v3.0 |

---
*Last updated: 2026-01-30 after v3.0 milestone*
