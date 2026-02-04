# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** v4.0 BOM Lumber Categorization

## Current Position

Phase: 29 (Admin Dimension Management) - 7 of 7 phases
Plan: 02 of 02 complete
Status: Phase complete
Last activity: 2026-02-04 — Completed 29-02-PLAN.md (Admin UI)

Progress: [████████████████████████████████] 7/7 phases (100%)

## Milestone History

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-7 | SHIPPED | 2026-01-23 |
| v2.0 Persistence | 8-12 | SHIPPED | 2026-01-28 |
| v3.0 Multi-User & Cut Optimizer | 13-22 | SHIPPED | 2026-01-30 |
| v4.0 BOM Lumber Categorization | 23-29 | IN PROGRESS | — |

See `.planning/MILESTONES.md` for full milestone details.

## Accumulated Context

### Decisions

Tech stack and patterns established across v1.0-v3.0:
- SvelteKit + Drizzle + Turso + Vercel AI SDK
- Tailwind v4 with @tailwindcss/vite plugin
- Provider factory pattern for AI (createAnthropic/createOpenAI)
- Amber color scheme (woodworking theme)
- Click-to-edit inline editing
- RFC 4180 CSV escaping
- Custom auth with oslo utilities + Argon2
- Sessions stored in Turso database
- Optimistic UI for BOM edits
- Cascade delete patterns (user -> projects -> boms -> items)
- resend (^6.9.1) — Transactional email API
- svelte-dnd-action (^0.9.69) — Drag-drop for cut assignment
- Custom optimizer algorithms (FFD 1D, Guillotine 2D)
- Native HTML5 drag-drop for manual overrides
- Navigation state passing via SvelteKit goto()

**v4.0 Design Decisions:**
- Fractional thickness prefix format ("3/4 Oak")
- Dimension validation warns but allows save (user override)
- Existing lumber items migrate to hardwood category
- Category assignment: Hardwood (Oak, Maple, etc.), Common (Pine, etc.), Sheet (Plywood, MDF, etc.)

**Phase 23 (Schema Foundation):**
- cutItem field nullable with default false (SQLite migration constraint)
- thickness field added, height preserved for Phase 28 data migration
- Dimension validation uses 1/64 inch tolerance for floating point comparison
- LumberCategory as derived union type for type narrowing
- Removed calculateBoardFeet and formatBoardFeet functions (v4.0 uses piece counts)
- Kept board-feet.ts filename for backward compatibility with imports
- Board feet display removed from UI (Phase 24 adds piece counts)

**Phase 24 (Display Updates):**
- 6 categories displayed: hardwood, common, sheet, hardware, finishes, consumables
- Category labels: "Hardwood Lumber", "Common Boards", "Sheet Goods"
- Color scheme: walnut (hardwood), oak-dark (common), slate (sheet)
- Thickness prefix on lumber names via isLumberCategory() + formatDimension()
- Lumber categories force 'pcs' unit only in AddItemForm
- Removed orphaned .board-feet and .board-feet-total CSS

**Phase 25 (API Validation):**
- BOM save auto-sets cutItem=true for lumber categories (hardwood/common/sheet)
- Dimension validation returns warnings (does not block save)
- API responses include optional `warnings` array for validation feedback
- CSV export includes CutItem column (Yes/No) and uses Thickness header
- CSV import fixed to accept all 6 categories (was only accepting 4)
- CSV import supports both Height and Thickness columns for backward compatibility
- bom-validation.ts helper created for server-side validation

**Phase 26 (AI & Wizard Updates):**
- AI prompt updated to use 6 categories (hardwood, common, sheet, hardware, finishes, consumables)
- Category assignment guidance added based on wood species (hardwood vs softwood vs sheet)
- Dimension requirements (length, width, thickness) required for all lumber items
- AI uses actual dimensions (not nominal): "2x4" = width 3.5, thickness 1.5
- Consumables toggle added to ProjectTypeStep (Step 1 of wizard)
- includeConsumables field added to ProjectDetails type (optional, defaults true)
- Prompt generation conditional: excludes consumables section when toggle is off

**Phase 27 (Cut List Integration):**
- Cut list filter changed from category === 'lumber' to cutItem === true
- Mode detection uses category === 'sheet' (not width-based heuristic)
- Thickness prefix added to stock labels: '0.75" Oak' format
- BomSelector displays "cut item" counts (not "lumber item")
- Strict equality cutItem === true (not truthy check - field is nullable)

**Phase 28 (Data Migration):**
- Standalone migration script: `scripts/migrate-v4-data.ts` following seed-templates.ts pattern
- MIG-01: All 'lumber' category items → 'hardwood' (4 items migrated)
- MIG-02: cutItem=true backfilled for all lumber categories (hardwood/common/sheet)
- MIG-03: height values copied to thickness field using raw SQL (libsql client.execute)
- Idempotent design: script safe to re-run
- Production migration: Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before running

**Phase 29 (Admin Dimension Management):**
- dimensionValues table: category, dimensionType, value, isDefault, timestamps
- Startup seeding: 41 default values on first request if table empty
- 1-minute TTL cache for dimension validation queries
- invalidateDimensionCache() for admin updates
- Validation functions now async (validateThickness, validateWidth, validateLength)
- Admin UI at /admin/dimensions with view, add, remove, reset functionality
- UserMenu includes "Manage Dimensions" link for admins

See `.planning/milestones/v3.0-ROADMAP.md` for full v3.0 decision log.

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Add admin route in user dropdown for admin privileges | 2026-01-29 | bf34fb2 | [001-add-admin-route-in-user-dropdown-for-adm](./quick/001-add-admin-route-in-user-dropdown-for-adm/) |

## Research Reference

v3.0 research completed — see `.planning/research/v3-SUMMARY.md`:
- Email stack: Resend API
- Cut optimization: FFD (1D), Guillotine (2D)
- Drag-drop: svelte-dnd-action
- Security: RBAC retrofit, token handling

## Session Continuity

Last session: 2026-02-04
Stopped at: Completed 29-02-PLAN.md (Admin UI)
Resume file: None

## Next Steps

**Phase 29 complete!** v4.0 milestone is ready for final review and shipping.

v4.0 progress: 100% complete
- Phase 23: Schema Foundation
- Phase 24: Display Updates
- Phase 25: API Validation
- Phase 26: AI & Wizard Updates
- Phase 27: Cut List Integration
- Phase 28: Data Migration
- Phase 29: Admin Dimension Management (Plans 01, 02 complete)

Next: Ship v4.0 milestone.

---
*Last updated: 2026-02-04 after completing 29-02-PLAN.md*
