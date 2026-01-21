# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-16)

**Core value:** Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.
**Current focus:** Phase 5 In Progress - Export & Print (EXPORT-01 complete)

## Current Position

Phase: 5 of 6 (Export & Print)
Plan: 1 of 2 complete
Status: In progress
Last activity: 2026-01-21 — Completed 05-01-PLAN.md (CSV Export)

Progress: [██████████████████████████████████████████████████████████████████████████████░░] 12 plans complete

## Performance Metrics

**Velocity:**
- Total plans completed: 12
- Average duration: 5.4m
- Total execution time: 1.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Foundation | 2 | 16m | 8m |
| 2. AI Integration | 2 | 9m | 4.5m |
| 3. BOM Core Flow | 4 | 24m | 6m |
| 4. BOM Editing | 3 | 15m | 5m |
| 5. Export & Print | 1 | 5m | 5m |

**Recent Trend:**
- Last 5 plans: 04-01 (4m), 04-02 (6m), 04-03 (5m), 05-01 (5m)
- Trend: Stable (consistent 4-6m execution)

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Tech stack confirmed: SvelteKit + Drizzle + Turso + Lucia + Vercel AI SDK
- Tailwind v4 with @tailwindcss/vite plugin (CSS-first approach)
- Local SQLite (file:local.db) for development, Turso for production
- Amber color scheme for header (woodworking theme)
- HTML entities for emoji icons (encoding reliability)
- Dynamic env import ($env/dynamic/private) for optional AI_PROVIDER config
- Woodworking system prompt embedded in chat endpoint
- System messages filtered from UI (set server-side)
- Message parts extraction for Vercel AI SDK v4 compatibility
- Dimension ranges use min/max/default structure for UI validation
- Three-tier joinery difficulty (beginner/intermediate/advanced)
- Template helper functions (getTemplateById, createDefaultDetails)
- Zod schema with .describe() annotations for AI context in structured generation
- Template-aware prompt construction (resolve joinery names, include typicalHardware)
- Wizard step pattern: capture initial values at mount time (acceptable for parent-managed state)
- AI SDK provider factory pattern: use createAnthropic/createOpenAI with explicit apiKey for SvelteKit dynamic env
- Category display order: Lumber, Hardware, Finishes, Consumables
- View state machine pattern for multi-step flows (wizard/loading/result)
- Click-to-edit pattern: button displays value, input appears on click, Enter/blur commits, Escape cancels
- Callback prop drilling for edit operations (page -> display -> category -> item)
- Visibility toggle: checkbox checked = visible (intuitive 'include' semantics)
- AddItemForm inline in category (not modal) for quick add workflow
- Unique ID generation: custom-{timestamp}-{random} pattern
- Category-specific unit defaults (bf for lumber, pcs for hardware, etc.)
- Immutable state updates for Svelte reactivity
- RFC 4180 CSV escaping for export (handles commas, quotes, newlines)
- Blob-based file download for cross-browser CSV export
- Sanitized filename format: {name}-bom-{YYYY-MM-DD}.csv

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-21
Stopped at: Completed 05-01-PLAN.md (CSV Export)
Resume file: None
