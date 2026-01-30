# ROADMAP.md

**Current Milestone:** v3.0 Multi-User & Cut Optimizer

See: `.planning/milestones/v3.0-ROADMAP.md` for full roadmap details.

## Quick Reference

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 13 | RBAC Foundation | 6 | ✓ Complete |
| 14 | User Management (Admin) | 6 | ✓ Complete |
| 15 | Email Infrastructure & Password Reset | 3 | ✓ Complete |
| 16 | Email Verification | 3 | Planned (2 plans) |
| 17 | BOM Refinements | 6 | Pending |
| 18 | Cut Optimizer Foundation | 10 | Pending |
| 19 | Linear Optimizer (1D) | 6 | Pending |
| 20 | Sheet Optimizer (2D) | 6 | Pending |
| 21 | BOM Integration & Shop Checklist | 10 | Pending |

**Total:** 9 phases, 44 requirements

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
```

## Next Action

Run `/gsd:execute-phase 16` to implement Email Verification.

---
*Updated: 2026-01-29 after phase 16 planning*
