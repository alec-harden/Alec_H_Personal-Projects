# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** v4.0 BOM Lumber Categorization

## Current Position

Phase: 23 (Schema Foundation)
Plan: Not yet created
Status: Ready to plan
Last activity: 2026-02-03 — v4.0 milestone started

Progress: [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0/7 phases

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

Last session: 2026-02-03
Stopped at: v4.0 milestone created, ready to plan Phase 23
Resume file: None

## Next Steps

**v4.0 STARTED!**

Run `/gsd:plan-phase 23` to plan Phase 23 (Schema Foundation):
1. Update schema with new categories and cutItem flag
2. Add thickness field (rename from height)
3. Remove board feet utilities
4. Add dimension validation constants

---
*Last updated: 2026-02-03 after v4.0 milestone creation*
