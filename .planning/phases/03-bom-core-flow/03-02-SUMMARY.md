---
phase: 03-bom-core-flow
plan: 02
subsystem: ai-generation
tags: [vercel-ai-sdk, generateObject, zod, structured-output, bom-api]

dependency-graph:
  requires: [02-01, 03-01]
  provides: [bom-generation-endpoint, zod-bom-schema]
  affects: [03-03, 03-04]

tech-stack:
  added: []
  patterns:
    - Zod schema with describe() annotations for AI context
    - generateObject() for structured AI responses
    - Template-aware prompt construction

key-files:
  created:
    - src/lib/server/schemas/bom-schema.ts
    - src/routes/api/bom/generate/+server.ts
  modified: []

decisions:
  - id: ZOD_DESCRIBE_ANNOTATIONS
    summary: Added .describe() to schema fields to provide AI with context for generation
  - id: TEMPLATE_AWARE_PROMPT
    summary: buildBOMPrompt() resolves template metadata for richer context in AI prompt

metrics:
  duration: 6m
  completed: 2026-01-20
---

# Phase 3 Plan 2: BOM Generation API Summary

**One-liner:** POST /api/bom/generate endpoint using Vercel AI SDK generateObject() with Zod schema for structured BOM output

## What Was Built

### Zod Schema for BOM Output
- Created `src/lib/server/schemas/bom-schema.ts` with `bomSchema` and `bomItemSchema`
- Schema matches existing BOM TypeScript types from `src/lib/types/bom.ts`
- Added `.describe()` annotations to all fields for AI context
- Exports both schema (`bomSchema`) and inferred TypeScript type (`BOMSchema`)

### BOM Generation API Endpoint
- Created `POST /api/bom/generate` at `src/routes/api/bom/generate/+server.ts`
- Accepts `ProjectDetails` payload with project name, dimensions, joinery, wood species, finish
- Uses Vercel AI SDK's `generateObject()` with Zod schema for structured output
- Returns complete BOM JSON with items in all 4 categories

### Detailed Woodworking Prompt
- `buildBOMPrompt()` function constructs comprehensive AI prompt including:
  - Project details (name, type, dimensions)
  - Joinery methods resolved to human-readable names from template
  - Template-specific typical hardware suggestions
  - Detailed instructions for all 4 BOM categories:
    - **Lumber**: Standard lumber yard dimensions, board feet, milling allowance
    - **Hardware**: Specific screw sizes, quantities, template-typical items
    - **Finishes**: Surface area estimates, finish type matching
    - **Consumables**: Sandpaper grits, glue, rags, applicators

### Error Handling
- Validates required fields (projectName, templateId)
- Returns 400 for missing required fields
- Returns 503 for AI service configuration errors
- Returns 500 for general generation failures

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/server/schemas/bom-schema.ts` | Zod schema for structured AI output | 39 |
| `src/routes/api/bom/generate/+server.ts` | BOM generation API endpoint | 139 |

## Decisions Made

### Zod Describe Annotations
- **Decision:** Add `.describe()` to all schema fields
- **Rationale:** Provides context to the AI model during structured generation, improving output quality
- **Example:** `name: z.string().describe('Name of the material or component')`

### Template-Aware Prompt Construction
- **Decision:** Resolve template metadata in buildBOMPrompt() for richer prompts
- **Rationale:** Joinery IDs like "mortise-tenon" become "Mortise and Tenon"; template's typicalHardware array included
- **Trade-off:** Additional lookup per request, but significantly better AI output

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:
- [x] `npm run build` succeeds without errors
- [x] `npm run check` passes (0 errors, 0 warnings)
- [x] `src/lib/server/schemas/bom-schema.ts` exports bomSchema and BOMSchema type
- [x] `src/routes/api/bom/generate/+server.ts` exports POST handler
- [x] Endpoint uses generateObject() with the Zod schema
- [x] Prompt includes template context and all user inputs

## Next Phase Readiness

**Ready for 03-03:** Project Wizard UI
- API endpoint ready for form submission
- ProjectDetails interface defines form fields
- Response structure (BOMSchema) matches display needs

**Ready for 03-04:** BOM Display Component
- BOM JSON structure established
- Categories defined for grouping display
- Items have all fields needed for table display

## Commits

| Hash | Message |
|------|---------|
| fde5299 | feat(03-02): add Zod schema for BOM structured output |
| af33452 | feat(03-02): add BOM generation API endpoint |
