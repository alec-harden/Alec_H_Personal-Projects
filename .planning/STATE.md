# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** v3.0 Multi-User & Cut Optimizer — Phase 14 in progress

## Current Position

Phase: 14 - User Management (Admin)
Plan: 02 of 2 complete
Status: COMPLETE
Last activity: 2026-01-29 — Completed 14-02-PLAN.md (User List Page)

Progress: [======================--------] Phase 14 of 21 COMPLETE

## Milestone History

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-7 | SHIPPED | 2026-01-23 |
| v2.0 Persistence | 8-12 | SHIPPED | 2026-01-28 |
| v3.0 Multi-User & Cut Optimizer | 13-21 | IN PROGRESS | — |

See `.planning/MILESTONES.md` for full milestone details.

## v3.0 Phase Overview

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 13 | RBAC Foundation | RBAC-01 to RBAC-06 | COMPLETE (2/2 plans) |
| 14 | User Management (Admin) | USER-01 to USER-06 | COMPLETE (2/2 plans) |
| 15 | Email Infrastructure & Password Reset | EMAIL-01 to EMAIL-03 | Pending |
| 16 | Email Verification | EMAIL-04 to EMAIL-06 | Pending |
| 17 | BOM Refinements | BOM-05 to BOM-10 | Pending |
| 18 | Cut Optimizer Foundation | CUT-01 to CUT-10 | Pending |
| 19 | Linear Optimizer (1D) | CUT-11 to CUT-16 | Pending |
| 20 | Sheet Optimizer (2D) | CUT-17 to CUT-22 | Pending |
| 21 | BOM Integration & Shop Checklist | CUT-23 to CUT-32 | Pending |

## Accumulated Context

### Decisions

Tech stack and patterns established in v1.0-v2.0:
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

v3.0 stack additions (from research):
- resend (^6.9.1) — Transactional email API
- svelte-dnd-action (^0.9.69) — Drag-drop for cut assignment
- Custom optimizer algorithms (not external bin-packing libraries)

**Phase 13-01 decisions:**
- Role stored as text enum ('user' | 'admin') with 'user' default
- Authorization guard pattern: requireAuth/requireAdmin return user object
- requireAdmin() composes with requireAuth() internally

**Phase 13-02 decisions:**
- requireAdmin() called in both load() and all form actions (actions bypass load guards)
- First-admin via count=0 check before insert (acceptable race condition for hobby app)
- Data isolation enforced at route level with userId ownership chains

**Phase 14-01 decisions:**
- Disabled message shown after password verified (user needs to know why they cannot log in)
- Session deletion on disabled check in hooks (immediate logout effect)
- Check order: password first, then account status (prevents user enumeration)
- Account state validation in hooks middleware for real-time enforcement

**Phase 14-02 decisions:**
- Email normalized to lowercase before storage for consistent duplicate checking
- Role defaults to 'user' when not specified in create form
- Redirect to /admin/users/{id} after creation (PRG pattern)
- Passwords excluded from query results using Drizzle columns option

See `.planning/milestones/v2.0-ROADMAP.md` for full v2.0 decision log.

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

Key research flags:
- Phase 20 (Sheet Optimizer): 2D nesting algorithm needs prototyping
- Phase 15 (Email): Domain verification (SPF/DKIM) is operational setup

## Session Continuity

Last session: 2026-01-29
Stopped at: Completed 14-02-PLAN.md (User List Page)
Resume file: None

## Next Steps

1. Begin Phase 15: Email Infrastructure & Password Reset
2. Continue through v3.0 phases

---
*Last updated: 2026-01-29 after 14-02-PLAN.md completion*
