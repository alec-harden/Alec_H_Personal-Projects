---
phase: 03-bom-core-flow
plan: 01
subsystem: bom-data
tags: [typescript-types, templates, data-models, woodworking]

dependency-graph:
  requires: [02-02]
  provides: [bom-types, project-templates, joinery-options]
  affects: [03-02, 03-03, 03-04]

tech-stack:
  added: []
  patterns:
    - Union types for constrained string values (BOMCategory)
    - Interface composition for data structures
    - HTML entities for cross-platform emoji support
    - Helper functions for template utilities

key-files:
  created:
    - src/lib/types/bom.ts
    - src/lib/data/templates.ts
  modified: []

decisions:
  - id: DIMENSION_RANGE_TYPE
    summary: Use min/max/default object structure for template dimension constraints
  - id: JOINERY_DIFFICULTY
    summary: Three-tier difficulty rating (beginner/intermediate/advanced) for joinery options
  - id: TEMPLATE_HELPERS
    summary: Include getTemplateById and createDefaultDetails utility functions

metrics:
  duration: 4m
  completed: 2026-01-20
---

# Phase 3 Plan 1: BOM Types and Templates Summary

**One-liner:** TypeScript type definitions for BOM workflow plus 5 woodworking project templates with joinery options, dimensions, and material suggestions

## What Was Built

### BOM Type Definitions (src/lib/types/bom.ts)

**BOMCategory** - Union type for material classification:
- `'lumber' | 'hardware' | 'finishes' | 'consumables'`

**BOMItem** - Individual line item in a bill of materials:
- id, name, description, quantity, unit, category, notes

**BOM** - Complete bill of materials output:
- projectName, projectType, generatedAt, items array

**ProjectDetails** - User input from wizard:
- templateId, projectName, dimensions, joinery array, woodSpecies, finish, additionalNotes

### Project Templates (src/lib/data/templates.ts)

**5 Complete Templates:**

| Template | Default Dimensions | Joinery Options |
|----------|-------------------|-----------------|
| Table | 60x36x30" | mortise-tenon, pocket screws, dowels, breadboard ends |
| Cabinet | 30x24x34" | dado joints, rabbet joints, pocket screws, dowels |
| Shelf/Bookcase | 36x12x48" | dado joints, floating brackets, pocket screws |
| Workbench | 72x24x34" | mortise-tenon, through-tenons, lag bolts, half-lap |
| Box/Chest | 24x12x12" | box joints, dovetails, rabbet joints, miter joints |

Each template includes:
- Dimension ranges (min/max/default) for length, width, height
- Joinery options with difficulty levels
- Suggested wood species
- Suggested finishes
- Typical hardware items

**Utility Functions:**
- `getTemplateById(id)` - Lookup template by ID
- `createDefaultDetails(template)` - Generate default ProjectDetails from template

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/types/bom.ts` | BOM type definitions | 55 |
| `src/lib/data/templates.ts` | Project templates and utilities | 277 |

## Technical Details

### Type Architecture
- Types are importable via `$lib/types/bom`
- Templates import `ProjectDetails` for type consistency
- All exports are explicit (no default exports)
- Optional fields use `?` for flexibility

### Template Structure
```typescript
interface ProjectTemplate {
  id: string;           // Unique identifier (table, cabinet, etc.)
  name: string;         // Display name
  icon: string;         // HTML entity for emoji
  description: string;  // Use case description
  defaultDimensions: { length, width, height?, unit };
  joineryOptions: JoineryOption[];
  suggestedWoods: string[];
  suggestedFinishes: string[];
  typicalHardware: string[];
}
```

### Joinery Difficulty System
- **beginner**: pocket screws, dowels, rabbet joints, floating brackets
- **intermediate**: mortise-tenon, dado joints, box joints, miter joints, half-lap
- **advanced**: through-tenons, dovetails, breadboard ends

## Decisions Made

### Dimension Range Structure
- **Decision:** Use `{ min, max, default }` object for each dimension
- **Rationale:** Enables UI validation and slider controls in wizard
- **Implementation:** All dimensions use 'inches' as base unit

### Joinery Difficulty Rating
- **Decision:** Three-tier difficulty system
- **Rationale:** Helps users choose appropriate techniques for skill level
- **Implementation:** `'beginner' | 'intermediate' | 'advanced'` union type

### Template Helper Functions
- **Decision:** Include utility functions for common operations
- **Rationale:** Reduces boilerplate in wizard and API code
- **Implementation:** getTemplateById, createDefaultDetails

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:
- [x] `npm run build` succeeds without errors
- [x] `npm run check` passes (0 errors, 0 warnings)
- [x] `src/lib/types/bom.ts` exports BOMCategory, BOMItem, BOM, ProjectDetails
- [x] `src/lib/data/templates.ts` exports ProjectTemplate interface and templates array
- [x] templates array contains exactly 5 items
- [x] Each template has all required fields populated
- [x] Types are importable from $lib/types/bom
- [x] Templates are importable from $lib/data/templates
- [x] Import link verified: templates.ts imports ProjectDetails from bom.ts

## Next Phase Readiness

**Ready for 03-02:** Project Wizard UI
- Templates provide data for wizard template selection UI
- Dimension ranges enable form validation
- Joinery options ready for multi-select component
- Suggested woods/finishes ready for dropdown population

**Ready for 03-03:** BOM Prompt Construction
- ProjectDetails type defines wizard output shape
- Templates provide context for AI prompt generation
- Hardware/finish suggestions inform BOM completeness checks

## Commits

| Hash | Message |
|------|---------|
| 6f760de | feat(03-01): add BOM TypeScript type definitions |
| 11b9ac2 | feat(03-01): add 5 woodworking project templates |
