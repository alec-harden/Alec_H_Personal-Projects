---
phase: 21-bom-integration-shop-checklist
plan: 03
subsystem: cutlist
tags: [drag-drop, manual-placement, cut-optimizer, html5-dnd, conflict-detection]

# Dependency graph
requires:
  - phase: 21-02
    provides: Shop checklist with completion tracking
provides:
  - Manual stock assignment via drag-drop interface
  - Position override with inline editing
  - Conflict detection for overlapping cuts
  - Reset functionality to clear manual overrides
affects: [future cut list features, visualization enhancements]

# Tech tracking
tech-stack:
  added: []
  patterns: [native HTML5 drag-drop, optimistic UI with rollback, conflict detection algorithm]

key-files:
  created:
    - src/lib/components/cutlist/ManualPlacement.svelte
  modified:
    - src/lib/server/schema.ts
    - src/routes/api/cutlist/[id]/cuts/[cutId]/+server.ts
    - src/routes/cutlist/[id]/+page.svelte
    - src/routes/cutlist/[id]/+page.server.ts

key-decisions:
  - "Native HTML5 drag-drop chosen over svelte-dnd-action for simplicity"
  - "Conflict detection calculates overlaps but allows them (UI shows warning)"
  - "assignedStockId references cutListStock with SET NULL on delete"
  - "Optimistic UI updates with rollback on API errors"
  - "Tab interface for switching between Checklist and Manual Placement views"

patterns-established:
  - "Drag-drop: ondragstart sets dataTransfer, ondrop reads and persists"
  - "Position editing: click-to-edit with number input, onblur commits"
  - "Conflict detection: group by stock, sort by position, detect overlaps"

# Metrics
duration: 4min
completed: 2026-01-30
---

# Phase 21 Plan 03: Manual Placement Summary

**Drag-drop stock assignment and position override with conflict detection for fine-tuned cut list control**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-30T03:38:52Z
- **Completed:** 2026-01-30T03:43:11Z
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments
- Drag-drop interface for assigning stock to cuts using native HTML5 APIs
- Inline position editing with validation (non-negative, within stock bounds)
- Real-time conflict detection showing overlapping cuts with visual warnings
- Reset functionality to clear manual assignments and return to algorithm
- Tabbed view for switching between shop checklist and manual placement

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Schema for Manual Assignment** - `c154424` (feat)
2. **Task 2: Extend API Endpoint for Manual Assignment** - `31cdc5f` (feat)
3. **Task 3: Create ManualPlacement Component** - `1582421` (feat)
4. **Task 4: Integrate ManualPlacement into View Page** - `ce7729d` (feat)

## Files Created/Modified
- `src/lib/server/schema.ts` - Added assignedStockId and overridePosition columns to cutListCuts
- `src/routes/api/cutlist/[id]/cuts/[cutId]/+server.ts` - Extended PATCH endpoint to handle stock assignment and position
- `src/lib/components/cutlist/ManualPlacement.svelte` - New component with drag-drop and position editing (678 lines)
- `src/routes/cutlist/[id]/+page.svelte` - Added tabs for Checklist and Manual Placement views
- `src/routes/cutlist/[id]/+page.server.ts` - Extended load to include stock data

## Decisions Made

**1. Native HTML5 drag-drop over svelte-dnd-action**
- Plan suggested svelte-dnd-action as available option but native HTML5 sufficient
- Simpler implementation with ondragstart/ondragover/ondrop
- No additional dependencies needed

**2. Conflict detection allows overlaps**
- Algorithm detects overlapping cuts on same stock
- Displays visual warning (red border, warning icon) but doesn't block
- User may intentionally overlap for specific reasons (e.g., nested cuts)
- Validation only prevents negative positions, not overlaps

**3. Schema design with SET NULL on delete**
- assignedStockId references cutListStock with onDelete: 'set null'
- If stock deleted, assignment clears rather than cascading delete
- Protects cut data while cleaning up broken references

**4. Optimistic UI with rollback**
- Local state updates immediately on drag-drop or position edit
- API call happens asynchronously
- On error, reverts local state to previous value
- Follows pattern from phase 21-02 shop checklist

**5. Tabbed interface pattern**
- Checklist and Manual Placement as separate tabs, not stacked sections
- Default to Checklist view (most common use case)
- Both views share same cut list data
- Max-width expanded to 1200px for manual placement grid layout

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

Phase 21 complete - all three plans executed successfully:
- 21-01: BOM to Cut List import (CUT-23 to CUT-30)
- 21-02: Shop Checklist with completion tracking (CUT-26, CUT-28 to CUT-30)
- 21-03: Manual Placement with drag-drop (CUT-31, CUT-32)

Ready for Phase 21 verification and v3.0 completion.

### Requirements Fulfilled

- **CUT-31:** User can drag-drop materials to assign stock to cuts
- **CUT-32:** User can manually override cut placement within assigned stock
- Manual assignments persist to database across page refreshes
- Conflict detection warns about overlapping cuts with visual indicators
- Reset functionality clears manual assignments

---
*Phase: 21-bom-integration-shop-checklist*
*Completed: 2026-01-30*
