# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-26)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** v2.0 Persistence & Project Management

## Current Position

Phase: 8 (Authentication Foundation)
Plan: 3 of 4 complete
Status: In progress
Last activity: 2026-01-27 — Completed 08-03-PLAN.md

Progress: [█████████████████████████████░░░░░░░░░░░] 75%

## Milestone History

| Milestone | Phases | Status | Shipped |
|-----------|--------|--------|---------|
| v1.0 MVP | 1-7 | SHIPPED | 2026-01-23 |
| v2.0 Persistence | 8-12 | IN PROGRESS | — |

See `.planning/MILESTONES.md` for full milestone details.

## v2.0 Phase Status

| Phase | Name | Plans | Status |
|-------|------|-------|--------|
| 8 | Authentication Foundation | 3/4 | ◐ In progress |
| 9 | Project Management | 0/? | ○ Not started |
| 10 | BOM Persistence | 0/? | ○ Not started |
| 11 | Template Management | 0/? | ○ Not started |
| 12 | CSV Import | 0/? | ○ Not started |

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

## Session Continuity

Last session: 2026-01-27
Stopped at: Completed 08-03-PLAN.md (Auth Routes)
Resume file: None

## Next Steps

Continue Phase 8:
1. Execute 08-04-PLAN.md (Route Protection)
2. Verify AUTH-01 through AUTH-04
