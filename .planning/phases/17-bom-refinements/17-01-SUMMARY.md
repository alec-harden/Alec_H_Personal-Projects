---
phase: 17-bom-refinements
plan: 01
subsystem: bom-editing
tags: [schema, database, ui, icons]
dependency-graph:
  requires: [phase-10-bom-persistence]
  provides: [lumber-dimension-schema, eye-icon-visibility]
  affects: [phase-18-cut-optimizer, phase-21-shop-checklist]
tech-stack:
  added: []
  patterns: [nullable-dimension-columns, icon-button-toggle]
key-files:
  created: []
  modified:
    - src/lib/server/schema.ts
    - src/lib/types/bom.ts
    - src/lib/components/bom/BOMItem.svelte
decisions:
  - id: DIM-NULLABLE
    choice: "Nullable real columns for dimensions"
    reason: "Only lumber items need dimensions; non-lumber items leave null"
  - id: EYE-ICON-TOGGLE
    choice: "Eye icon button replacing checkbox"
    reason: "More intuitive UX - eye open=visible, eye slashed=hidden"
metrics:
  duration: ~5 minutes
  completed: 2026-01-30
---

# Phase 17 Plan 01: Lumber Dimensions & Eye Icon Toggle Summary

Nullable dimension columns added to schema and BOMItem type; visibility checkbox replaced with intuitive eye icons.

## Objectives Achieved

- [x] Add length, width, height columns to bomItems table
- [x] Add optional dimension fields to BOMItem type
- [x] Replace checkbox with eye icon visibility toggle
- [x] Proper accessibility labels and hover states

## Implementation Details

### Task 1: Schema and Type Updates

**Schema changes (`src/lib/server/schema.ts`):**
- Added `real` import from drizzle-orm/sqlite-core
- Added three nullable real columns to `bomItems`:
  - `length: real('length')` - inches
  - `width: real('width')` - inches
  - `height: real('height')` - inches (thickness)

**Type changes (`src/lib/types/bom.ts`):**
- Added optional dimension fields to `BOMItem` interface:
  ```typescript
  length?: number;  // inches
  width?: number;   // inches
  height?: number;  // inches (thickness)
  ```

### Task 2: Eye Icon Toggle

**Replaced checkbox with eye icon button:**
- Open eye SVG for visible items
- Slashed eye SVG for hidden items
- Button with hover/focus states matching artisan theme
- Accessibility: `aria-label` and `title` attributes
- Removed all checkbox-related CSS

**Visual behavior:**
- Default: Muted color (`--color-ink-muted`)
- Hover: Walnut color with subtle background
- Focus: Ring shadow for keyboard navigation
- Hidden items: Reduced opacity (0.6)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

- Dimensions stored in inches (consistent with existing project dimensions)
- Dimensions nullable to support non-lumber items (hardware, finishes, consumables)
- Eye icons use HeroIcons-style SVG paths
- Mobile responsive padding updated from 18px (checkbox) to 28px (eye button)

## Commits

| Hash | Message |
|------|---------|
| 3275487 | feat(17-01): add lumber dimension columns to schema and type |
| 6da410a | feat(17-01): replace visibility checkbox with eye icon toggle |

## Next Phase Readiness

Phase 17-02 can proceed. This plan provides:
- Database ready for lumber dimension storage
- Foundation for cut optimizer (dimensions required)
- Improved visibility toggle UX
