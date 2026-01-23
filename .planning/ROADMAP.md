# Roadmap: WoodShop Toolbox

## Overview

Build a modular web application for woodworking tools, starting with an AI-powered Bill of Materials generator. The journey goes from project scaffolding through AI integration, guided BOM workflow, editing capabilities, export, and final polish — delivering a usable personal tool for woodworking project planning.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - SvelteKit scaffolding, database, dashboard shell
- [x] **Phase 2: AI Integration** - Vercel AI SDK infrastructure with streaming chat
- [x] **Phase 3: BOM Core Flow** - Guided prompts, templates, BOM generation
- [x] **Phase 4: BOM Editing** - Edit quantities, add items, toggle visibility, categories
- [x] **Phase 5: Export** - CSV export functionality
- [x] **Phase 6: Polish & Integration** - End-to-end flow refinement
- [x] **Phase 7: Tech Debt Cleanup** - Remove orphaned chat interface from Phase 2→3 pivot

## Phase Details

### Phase 1: Foundation
**Goal**: Project scaffolding with SvelteKit, database, and basic routing
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01
**Success Criteria** (what must be TRUE):
  1. Project builds and runs locally without errors
  2. Dashboard home page displays with placeholder tool card(s)
  3. Database connection established (Drizzle + Turso)
  4. Basic app shell/layout in place (header, main content area)
**Research**: Unlikely (tech stack decided, following SvelteKit patterns)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: AI Integration
**Goal**: Working AI conversation infrastructure with Vercel AI SDK
**Depends on**: Phase 1
**Requirements**: BOM-02
**Success Criteria** (what must be TRUE):
  1. AI chat endpoint responds to messages
  2. Configurable LLM provider (Claude/GPT switchable via env)
  3. Streaming responses work in the UI
  4. Basic chat UI component exists and functions
**Research**: Likely (Vercel AI SDK + SvelteKit integration patterns)
**Research topics**: Vercel AI SDK with SvelteKit, streaming UI patterns, provider configuration
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: BOM Core Flow
**Goal**: User can complete guided prompt workflow and receive AI-generated BOM
**Depends on**: Phase 2
**Requirements**: BOM-01, BOM-03, BOM-04
**Success Criteria** (what must be TRUE):
  1. User can start new BOM project from dashboard
  2. User answers guided questions (project type, dimensions, joinery, materials)
  3. User can select project template (table, cabinet, shelf, etc.) to guide AI
  4. AI generates comprehensive BOM with all categories (lumber, hardware, finishes, consumables)
  5. Generated BOM displays in organized, readable view
**Research**: Likely (template structure, prompt engineering for woodworking domain)
**Research topics**: Prompt templates for BOM generation, project template data model, woodworking domain knowledge
**Design**: Use `/frontend-design` skill for guided prompt UI and BOM display view
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: BOM Editing
**Goal**: User can edit and customize generated BOM
**Depends on**: Phase 3
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. User can edit quantity for any material in the BOM
  2. User can add custom materials not suggested by AI
  3. User can toggle visibility on items (greyed out, excluded from export and totals)
  4. Materials are grouped by category (Lumber, Hardware, Finishes, Consumables)
**Research**: Unlikely (standard CRUD + state management patterns)
**Design**: Use `/frontend-design` skill for edit interface, quantity controls, and category grouping
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Export
**Goal**: User can export completed BOM to CSV
**Depends on**: Phase 4
**Requirements**: EXPORT-01
**Success Criteria** (what must be TRUE):
  1. Export button visible on BOM view
  2. CSV downloads with all visible items (hidden items excluded)
  3. CSV includes category grouping, quantities, and item details
**Research**: Unlikely (standard CSV generation)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Polish & Integration
**Goal**: End-to-end flow works smoothly, ready for personal use
**Depends on**: Phase 5
**Requirements**: None new (integration of all previous)
**Success Criteria** (what must be TRUE):
  1. Complete flow works: Dashboard -> Start BOM -> Answer prompts -> View BOM -> Edit -> Export
  2. Error states handled gracefully (network errors, AI failures)
  3. Loading states provide visual feedback
  4. UI is usable on desktop and tablet viewports
**Research**: Unlikely (internal polish)
**Design**: Use `/frontend-design` skill to polish dashboard and BOM tool entry pages
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Tech Debt Cleanup
**Goal**: Remove orphaned chat interface files from Phase 2->3 architecture pivot
**Depends on**: Phase 6
**Requirements**: None (tech debt cleanup)
**Gap Closure**: Addresses tech debt from v1-MILESTONE-AUDIT.md
**Success Criteria** (what must be TRUE):
  1. Orphaned /bom chat page removed
  2. Orphaned /api/chat endpoint removed
  3. Orphaned ChatMessage.svelte and ChatInput.svelte components removed
  4. No broken imports or references remain
  5. Application builds and runs without errors
**Research**: Unlikely (file deletion and import cleanup)
**Plans**: 1 plan

Plans:
- [x] 07-01-PLAN.md — Delete orphaned chat files and remove unused @ai-sdk/svelte dependency

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | ✓ Complete | 2026-01-20 |
| 2. AI Integration | 2/2 | ✓ Complete | 2026-01-20 |
| 3. BOM Core Flow | 4/4 | ✓ Complete | 2026-01-20 |
| 4. BOM Editing | 3/3 | ✓ Complete | 2026-01-21 |
| 5. Export | 1/1 | ✓ Complete | 2026-01-21 |
| 6. Polish & Integration | 2/2 | ✓ Complete | 2026-01-22 |
| 7. Tech Debt Cleanup | 1/1 | ✓ Complete | 2026-01-23 |

---
*Roadmap created: 2026-01-20*
*Last updated: 2026-01-23*
