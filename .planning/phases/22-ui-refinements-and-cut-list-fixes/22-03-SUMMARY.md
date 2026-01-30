---
phase: 22-ui-refinements-and-cut-list-fixes
plan: 03
subsystem: ui
tags: [svelte, cutlist, ux, optimization]

# Dependency graph
requires:
  - phase: 21-bom-integration-and-shop-checklist
    provides: BOM import functionality for cut list
provides:
  - Logical UI flow with kerf configuration before input forms
  - Side-by-side layout with Stock (left) and Cuts (right)
  - BOM import loads lumber as available stock (not cuts)
  - 2.5-second minimum loading screen for optimization polish
affects: [Future cut list enhancements, optimizer UI improvements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Minimum loading duration pattern (tracks start time, enforces min display)"
    - "Error-aware loading states (skip delay on errors for better UX)"

key-files:
  created: []
  modified:
    - src/routes/cutlist/+page.svelte
    - src/routes/cutlist/from-bom/+page.svelte
    - src/routes/cutlist/from-bom/+page.server.ts

key-decisions:
  - "Kerf configuration moved above input forms for logical flow (configure before entering data)"
  - "Stock displayed on left, Cuts on right (what you have vs what you need)"
  - "BOM lumber items are available stock, not required cuts (semantically correct)"
  - "Loading screen only delays on success; errors show immediately"

patterns-established:
  - "Minimum loading duration: Enforce UI polish on fast operations without sacrificing error responsiveness"

# Metrics
duration: 3min
completed: 2026-01-30
---

# Phase 22 Plan 03: Cut List UI Refinements Summary

**Reordered cut list UI with kerf-first configuration, side-by-side stock/cuts layout, corrected BOM import semantics, and 2.5-second loading screen**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-30T14:09:39Z
- **Completed:** 2026-01-30T14:12:09Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Blade Kerf configuration moved above input forms for better workflow (configure tool before entering dimensions)
- Side-by-side layout with Available Stock (left) and Required Cuts (right) improves semantic clarity
- BOM import now correctly loads lumber items as available stock rather than cuts to make
- 2.5-second minimum loading screen prevents flickering on fast optimizations while showing errors immediately

## Task Commits

Each task was committed atomically:

1. **Task 1: Reorder cut list page UI** - `3c82aa0` (feat)
2. **Task 2: Add 2.5-second minimum loading screen** - `b715a61` (feat)
3. **Task 3: Fix BOM import to populate stock** - `6cd39e9` (fix)

## Files Created/Modified
- `src/routes/cutlist/+page.svelte` - Reordered UI sections, added loading duration logic, changed state handling from cuts to stock
- `src/routes/cutlist/from-bom/+page.server.ts` - Transform lumber items to Stock format instead of Cut format
- `src/routes/cutlist/from-bom/+page.svelte` - Updated state passing and button labels for stock terminology

## Decisions Made

**1. Kerf configuration before inputs (logical flow)**
- Users should configure blade kerf before entering dimensions
- Reduces cognitive load (one decision at a time)
- Kerf affects what cuts are possible, so configure it first

**2. Stock on left, Cuts on right (semantic ordering)**
- Left-to-right flow: what you have → what you need
- Mirrors physical shop workflow (check inventory, then plan cuts)
- Responsive: stacks vertically on mobile with same order

**3. BOM lumber = available stock (correct semantics)**
- BOM items are materials you have or will purchase (stock)
- Cuts are derived from project needs (user defines these separately)
- Previous behavior was backwards (loaded as cuts to make)

**4. Minimum loading duration only on success**
- Fast optimizations (< 2.5s) are padded to 2500ms minimum
- Errors skip the delay and display immediately (better UX)
- Network errors also skip delay
- Prevents "flickering" while maintaining error responsiveness

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Cut list UI improvements complete
- Requirements CUT-33 through CUT-36 satisfied
- Ready for Plan 22-04 (final cut list refinements)
- UI patterns established (loading duration, semantic layout) can be reused

---
*Phase: 22-ui-refinements-and-cut-list-fixes*
*Completed: 2026-01-30*
