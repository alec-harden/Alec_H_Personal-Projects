---
phase: 23-schema-foundation
plan: 02
subsystem: utils
tags: [board-feet, dimension-utils, lumber, v4.0]

# Dependency graph
requires:
  - phase: 23-01
    provides: Updated schema with lumber category support
provides:
  - Removed deprecated board feet calculation functions
  - Cleaned up dimension utilities for v4.0 migration
affects: [24-ui-updates, lumber-categorization]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/lib/utils/board-feet.ts
    - src/lib/components/bom/BOMItem.svelte
    - src/lib/components/bom/BOMCategory.svelte

key-decisions:
  - "Removed calculateBoardFeet and formatBoardFeet functions (no longer needed in v4.0 piece-count model)"
  - "Kept parseFractionalInches and formatDimension functions (still needed for dimension input/display)"
  - "Left board-feet.ts filename unchanged for backward compatibility with existing imports"

patterns-established: []

# Metrics
duration: 4min
completed: 2026-02-03
---

# Phase 23 Plan 02: Board Feet Removal Summary

**Removed board feet calculation functions from utilities and UI components in preparation for v4.0 piece-count model**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-03T21:02:09Z
- **Completed:** 2026-02-03T21:06:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed calculateBoardFeet and formatBoardFeet functions from board-feet.ts utility
- Removed board feet imports and display logic from BOMItem and BOMCategory components
- Updated file header to accurately reflect dimension utilities purpose
- Build passes with no import errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove board feet functions** - `0bd77ef` (feat)
2. **Task 2: Update component imports** - `2eb7b97` (feat)

## Files Created/Modified
- `src/lib/utils/board-feet.ts` - Removed calculateBoardFeet and formatBoardFeet functions; kept parseFractionalInches and formatDimension for dimension parsing/formatting
- `src/lib/components/bom/BOMItem.svelte` - Removed board feet calculation logic and display UI
- `src/lib/components/bom/BOMCategory.svelte` - Removed board feet total calculation and display

## Decisions Made

**File naming:** Kept board-feet.ts filename unchanged despite removing board feet functions. This maintains backward compatibility with existing imports across the codebase. A future cleanup phase can rename to dimension-utils.ts if desired.

**Display removal:** Removed board feet display from UI components now rather than waiting for Phase 24. Since the calculation functions were being removed, leaving broken display logic would cause runtime errors. Phase 24 will add piece counts in their place.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward removal of deprecated functions and their usage sites.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 24 UI updates. The dimension utilities (parseFractionalInches and formatDimension) remain functional for dimension input/display. Board feet calculations are now fully removed from the codebase, clearing the path for piece-count based lumber tracking in v4.0.

**Note:** Pre-existing TypeScript errors related to 'lumber' category type (from 23-01 schema changes) remain and will be addressed in subsequent plans as types are updated throughout the codebase.

---
*Phase: 23-schema-foundation*
*Completed: 2026-02-03*
