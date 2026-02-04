# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-04)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning - reducing planning time and ensuring nothing is forgotten.
**Current focus:** Between milestones - ready for v5.0

## Current Position

Phase: v4.0 complete
Plan: N/A
Status: Milestone shipped
Last activity: 2026-02-04 - v4.0 BOM Lumber Categorization shipped

Progress: v4.0 COMPLETE - awaiting /gsd:new-milestone

## Milestone History

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-7 | SHIPPED | 2026-01-23 |
| v2.0 Persistence | 8-12 | SHIPPED | 2026-01-28 |
| v3.0 Multi-User & Cut Optimizer | 13-22 | SHIPPED | 2026-01-30 |
| v4.0 BOM Lumber Categorization | 23-29 | SHIPPED | 2026-02-04 |

See `.planning/MILESTONES.md` for full milestone details.

## Accumulated Context

### Decisions

Tech stack and patterns established across v1.0-v4.0:
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
- resend (^6.9.1) - Transactional email API
- svelte-dnd-action (^0.9.69) - Drag-drop for cut assignment
- Custom optimizer algorithms (FFD 1D, Guillotine 2D)
- Native HTML5 drag-drop for manual overrides
- Navigation state passing via SvelteKit goto()

**v4.0 Decisions (shipped 2026-02-04):**
- Split lumber into hardwood/common/sheet categories (matches purchasing patterns)
- cutItem flag decouples optimizer from category logic
- Dimension validation warns but allows save (respects user judgment)
- Admin-managed dimension values with database-backed storage (41 defaults)
- Actual dimensions only (not nominal) for accuracy
- Consumables toggle gives users control over AI generation scope
- Fractional thickness prefix format ("3/4 Oak")

See `.planning/milestones/v4.0-ROADMAP.md` for full v4.0 decision log.

### Pending Todos

None.

### Blockers/Concerns

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Add admin route in user dropdown for admin privileges | 2026-01-29 | bf34fb2 | [001-add-admin-route-in-user-dropdown-for-adm](./quick/001-add-admin-route-in-user-dropdown-for-adm/) |

## Research Reference

v4.0 research completed - see `.planning/phases/*/RESEARCH.md` for phase-specific research.

## Session Continuity

Last session: 2026-02-04
Stopped at: v4.0 milestone shipped
Resume file: None

## Next Steps

**v4.0 SHIPPED!**

Archived:
- milestones/v4.0-ROADMAP.md
- milestones/v4.0-REQUIREMENTS.md
- milestones/v4.0-MILESTONE-AUDIT.md

Next: Run `/gsd:new-milestone` to start v5.0 (questioning -> research -> requirements -> roadmap)

---
*Last updated: 2026-02-04 after v4.0 milestone shipped*
