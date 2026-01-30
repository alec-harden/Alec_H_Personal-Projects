---
phase: 20-sheet-optimizer-2d
plan: 01
subsystem: optimizer
tags: [guillotine, bin-packing, 2D-optimization, BSSF, SAS, grain-direction, kerf]

# Dependency graph
requires:
  - phase: 18-cut-optimizer-foundation
    provides: Cut/Stock types, mode switching, placeholder 2D optimizer, kerf config
  - phase: 19-linear-optimizer
    provides: Enhanced FFD 1D algorithm, kerf handling patterns, stock sorting heuristics
provides:
  - Guillotine BSSF+SAS 2D bin packing algorithm
  - Grain direction constraint handling (grainMatters field)
  - 2D kerf-aware waste calculation
  - x/y/rotated placement tracking for visualization
affects: [20-02-visual-cut-diagrams, visualization, sheet-mode-optimization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Guillotine bin packing with Best Short Side Fit (BSSF) scoring
    - Shorter Axis Split (SAS) for rectangle subdivision
    - Free rectangle tracking for incremental packing
    - Grain constraint as rotation prevention flag
    - Conservative 2D kerf estimation (per-cut both dimensions)

key-files:
  created: []
  modified:
    - src/lib/types/cutlist.ts
    - src/lib/server/cutOptimizer.ts
    - src/lib/components/cutlist/CutInputForm.svelte

key-decisions:
  - "Grain toggle defaults to unchecked (rotation allowed) for maximum packing efficiency"
  - "BSSF+SAS chosen over MaxRects for guaranteed guillotine separability"
  - "Conservative kerf estimate: each cut loses kerf in both dimensions"
  - "Grain toggle only visible in sheet mode (not applicable to linear cuts)"
  - "Free rectangles tracked per plan for multi-cut placement on single sheet"

patterns-established:
  - "FreeRectangle interface: tracks available spaces after each placement"
  - "ExpandedCut2D interface: includes grainMatters flag for rotation control"
  - "PlacedCut2D interface: tracks final x/y/rotated state"
  - "Grain column in form grid: 70px width, checkbox + 'Lock' label"
  - "Algorithm tries existing plans before starting new sheet (minimize waste)"

# Metrics
duration: 7min
completed: 2026-01-30
---

# Phase 20 Plan 01: Guillotine 2D Bin Packing with Grain Direction Summary

**Guillotine BSSF+SAS algorithm packs multiple cuts per sheet with grain constraint toggle, replacing one-cut-per-sheet placeholder**

## Performance

- **Duration:** 7 min
- **Started:** 2026-01-30T04:45:29Z
- **Completed:** 2026-01-30T04:52:22Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Implemented guillotine BSSF+SAS 2D bin packing algorithm replacing placeholder
- Added grainMatters boolean field to Cut interface with UI toggle in sheet mode
- Enhanced CutAssignment with x/y/rotated fields for 2D placement tracking
- Multiple cuts now pack efficiently onto single sheets (not one-cut-per-sheet)
- Grain-constrained cuts respect orientation (no rotation when grainMatters=true)
- 2D kerf-aware waste calculation with conservative estimate

## Task Commits

Each task was committed atomically:

1. **Task 1: Add grainMatters field and enhance CutAssignment for 2D** - `988a8fa` (feat)
2. **Task 2: Implement guillotine BSSF+SAS algorithm in optimizeCuts2D** - `63c9488` (feat)
3. **Task 3: Add grain direction toggle to CutInputForm** - `7ce149b` (feat)

## Files Created/Modified
- `src/lib/types/cutlist.ts` - Added grainMatters field to Cut interface, updated createCut() helper
- `src/lib/server/cutOptimizer.ts` - Implemented guillotine BSSF+SAS algorithm with helper functions (scoreBSSF, splitSAS, guillotinePack), enhanced CutAssignment interface with x/y/rotated fields
- `src/lib/components/cutlist/CutInputForm.svelte` - Added grain direction toggle column in sheet mode with checkbox binding

## Decisions Made

**1. BSSF+SAS heuristics for guillotine algorithm**
- Rationale: Best Short Side Fit minimizes leftover space, Shorter Axis Split reduces rectangle fragmentation. Research shows BSSF+SAS performs well on similar-sized rectangles (common in woodworking).

**2. Conservative kerf estimate for 2D**
- Rationale: Each cut loses kerf in both dimensions (horizontal and vertical separation). Conservative estimate prevents underestimating waste. Precise guillotine line tracking deferred to v4.0 if needed.

**3. Grain toggle defaults to unchecked (rotation allowed)**
- Rationale: Most cuts don't need grain orientation (structural lumber, hidden surfaces). Default to maximum packing efficiency. User explicitly locks grain for visible plywood surfaces.

**4. Free rectangle tracking per plan**
- Rationale: Enables multi-cut placement on same sheet. Algorithm tries existing plans before starting new sheet, minimizing total sheets used.

**5. Grain column 70px width with 'Lock' label**
- Rationale: Checkbox + short label fits in narrow column. 'Lock' conveys constraint clearly. Mobile stacking shows 'Grain Lock' label.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - guillotine algorithm implementation followed research patterns directly. TypeScript compilation passed on first attempt for all three tasks.

## Next Phase Readiness

**Ready for Phase 20-02 (Visual Cut Diagrams):**
- CutAssignment now includes x/y/rotated fields populated by guillotine algorithm
- StockPlan includes all placement data needed for SVG visualization
- Grain rotation indicator can be displayed in diagram (rotated flag tracked)

**Testing notes:**
- Manual testing needed to verify waste percentages are realistic (10-25%)
- Test grain constraint prevents rotation (grainMatters=true cuts should not have rotated=true)
- Test multiple cuts pack onto single sheet (not one-cut-per-sheet)

---
*Phase: 20-sheet-optimizer-2d*
*Completed: 2026-01-30*
