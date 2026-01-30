# ROADMAP.md

**Current Milestone:** v3.0 Multi-User & Cut Optimizer

See: `.planning/milestones/v3.0-ROADMAP.md` for full roadmap details.

## Quick Reference

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 13 | RBAC Foundation | 6 | Complete |
| 14 | User Management (Admin) | 6 | Complete |
| 15 | Email Infrastructure & Password Reset | 3 | Complete |
| 16 | Email Verification | 3 | Complete |
| 17 | BOM Refinements | 6 | Complete |
| 18 | Cut Optimizer Foundation | 10 | Complete |
| 19 | Linear Optimizer (1D) | 6 | Complete |
| 20 | Sheet Optimizer (2D) | 6 | Complete |
| 21 | BOM Integration & Shop Checklist | 10 | Complete |
| 22 | UI Refinements & Cut List Fixes | 15 | Complete |

**Total:** 10 phases, 71 requirements

## Phase 21: BOM Integration & Shop Checklist (Complete)

**Goal:** BOM Integration allows pre-populating cuts from project lumber; Shop Checklist tracks cut completion with persistent progress; Manual overrides enable drag-drop stock assignment and position editing.

**Plans:** 3 plans
**Status:** COMPLETE (2026-01-30)

Plans:
- [x] 21-01-PLAN.md — BOM Integration (project selection, BOM multi-select, lumber filter, cut pre-population)
- [x] 21-02-PLAN.md — Shop Checklist (schema extension, checklist view, progress indicator, persistence)
- [x] 21-03-PLAN.md — Manual Overrides (drag-drop stock assignment, position editing, conflict detection)

## Phase 22: UI Refinements & Cut List Fixes (Complete)

**Goal:** Polish user account handling and header UI, reorganize navigation sidebar, improve cut list optimizer layout and BOM loading logic, and fix saved cut list viewing.

**Plans:** 4 plans in 2 waves
**Status:** COMPLETE (2026-01-30)

Wave 1 (parallel):
- [x] 22-01-PLAN.md — Account Logic & Header UI (schema migration, name fields, fixed dropdown)
- [x] 22-02-PLAN.md — Sidebar Restructure & Dashboard Logic (navigation sections, project limit)
- [x] 22-03-PLAN.md — Cut List Optimizer UI & Logic (kerf first, stock/cuts layout, BOM fix, loading screen)

Wave 2 (depends on 22-03):
- [x] 22-04-PLAN.md — Optimization Results & Data Persistence (results page, cut lists listing, viewing fix)

## Dependencies

```
Phase 13: RBAC Foundation
    |-- Phase 14: User Management (Admin)
    |-- Phase 15: Email Infrastructure & Password Reset
    |       +-- Phase 16: Email Verification
    +-- Phase 17: BOM Refinements
            +-- Phase 18: Cut Optimizer Foundation
                    +-- Phase 19: Linear Optimizer (1D)
                            +-- Phase 20: Sheet Optimizer (2D)
                                    +-- Phase 21: BOM Integration & Shop Checklist
                                            +-- Phase 22: UI Refinements & Cut List Fixes
```

## Next Action

**v3.0 MILESTONE COMPLETE!** All 10 phases (13-22) executed and verified.

Run `/gsd:audit-milestone` to verify requirements coverage and cross-phase integration.

---
*Updated: 2026-01-30 after completing phase 22*
