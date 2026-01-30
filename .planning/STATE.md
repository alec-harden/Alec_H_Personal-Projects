# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-29)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** v3.0 Multi-User & Cut Optimizer — Phase 17 in progress

## Current Position

Phase: 17 - BOM Refinements
Plan: 01 of 3 complete
Status: In progress
Last activity: 2026-01-30 — Completed 17-01-PLAN.md (Lumber Dimensions & Eye Icon Toggle)

Progress: [=========================-----] Phase 17 of 21

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
| 14 | User Management (Admin) | USER-01 to USER-06 | COMPLETE (3/3 plans) |
| 15 | Email Infrastructure & Password Reset | EMAIL-01 to EMAIL-03 | COMPLETE (2/2 plans) |
| 16 | Email Verification | EMAIL-04 to EMAIL-06 | COMPLETE (2/2 plans) |
| 17 | BOM Refinements | BOM-05 to BOM-10 | IN PROGRESS (1/3 plans) |
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

**Phase 14-03 decisions:**
- Self-disable prevention via adminUser.id comparison
- Confirmation checkbox required for toggle disabled action
- isOwnAccount derived from $page.data.user?.id for UI disable

**Phase 15-01 decisions:**
- SHA-256 hash tokens before storage (never store plaintext)
- 1-hour token expiry (OWASP standard)
- Single active token per user (delete existing before creating new)
- Invalidate all sessions on password reset (OWASP recommendation)
- Lazy Resend client initialization (only when API key exists)

**Phase 15-02 decisions:**
- Identical response on forgot-password regardless of email existence (prevents enumeration)
- Disabled accounts silently skip email send (no indicator to attacker)
- Token validated in load() before showing reset form
- Hidden token field in form for action submission

**Phase 16-01 decisions:**
- 24-hour token expiry for email verification (longer than 1-hour password reset)
- Single active token per user (delete existing before creating new)
- markEmailAsVerified consumes token atomically when email marked verified

**Phase 16-02 decisions:**
- Rate limiting: 3 resends per 15-minute window using in-memory Map
- Signup email send is non-blocking (errors logged, signup continues)
- Verification happens in load() for immediate result display

**Phase 17-01 decisions:**
- Nullable real columns for dimensions (only lumber items need them)
- Eye icon button replacing checkbox (open=visible, slashed=hidden)

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

Last session: 2026-01-30
Stopped at: Completed 17-01-PLAN.md (Lumber Dimensions & Eye Icon Toggle)
Resume file: None

## Next Steps

1. Continue Phase 17: Execute 17-02-PLAN.md and 17-03-PLAN.md
2. Continue through v3.0 phases (Cut Optimizer foundation next)

---
*Last updated: 2026-01-30 after 17-01 completion*
