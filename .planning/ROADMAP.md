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
| 20 | Sheet Optimizer (2D) | 6 | Planned |
| 21 | BOM Integration & Shop Checklist | 10 | Pending |

**Total:** 9 phases, 44 requirements

## Phase 20: Sheet Optimizer (2D)

**Goal:** 2D guillotine bin packing algorithm optimizes plywood and panel cuts with grain direction support and visual diagram.

**Plans:** 2 plans

Plans:
- [ ] 20-01-PLAN.md — Guillotine algorithm + grain direction (BSSF+SAS, grainMatters toggle)
- [ ] 20-02-PLAN.md — Sheet cut diagram visualization (SVG component, integration)

## Dependencies

```
Phase 13: RBAC Foundation
    |-- Phase 14: User Management (Admin)
    |-- Phase 15: Email Infrastructure & Password Reset
    |       +-- Phase 16: Email Verification
    +-- Phase 17: BOM Refinements
            +-- Phase 18: Cut Optimizer Foundation
                    +-- Phase 19: Linear Optimizer (1D)
                            +-- Phase 20: Sheet Optimizer (2D) <-- CURRENT
                                    +-- Phase 21: BOM Integration & Shop Checklist
```

## Next Action

Run `/gsd:execute-phase 20` to execute Sheet Optimizer (2D).

---
*Updated: 2026-01-29 after phase 20 planning*
