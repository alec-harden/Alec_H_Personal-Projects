# v3.0 Research Summary

**Project:** WoodShop Toolbox v3.0 Multi-User & Cut Optimizer
**Domain:** Multi-user SaaS features + algorithmic optimization tool
**Researched:** 2026-01-29
**Confidence:** MEDIUM-HIGH

## Executive Summary

WoodShop Toolbox v3.0 adds three major feature groups to the existing v2.0 application: Role-Based Access Control (RBAC) with admin user management, email-based authentication flows (password reset and verification), and a Cut List Optimizer tool for minimizing material waste. The existing architecture provides solid integration points -- the hooks.server.ts auth middleware, Drizzle schema with relations, and project-scoped data patterns all extend naturally to support these features.

The recommended approach is security-first: implement RBAC and retrofit existing admin routes before adding any new functionality. This addresses a critical gap where current admin routes (`/admin/templates`) only check authentication, not role authorization. Email infrastructure should follow, establishing the foundation for self-service password reset before adding the Cut List Optimizer. The optimizer itself should start with the simpler 1D linear mode before tackling the more complex 2D sheet nesting.

Key risks include: (1) security vulnerabilities from incomplete RBAC retrofitting, (2) email deliverability issues requiring proper SPF/DKIM/DMARC setup, and (3) 2D nesting algorithm complexity causing browser freezes. All are mitigable with proper sequencing and architecture choices detailed below.

## Key Findings

### Recommended Stack Additions

v3.0 requires only **two new dependencies** -- a testament to the existing stack's completeness.

**New packages to install:**
- **resend** (^6.9.1): Transactional email API -- simple developer experience, 3,000 emails/month free tier, modern API designed for serverless
- **svelte-dnd-action** (^0.9.69): Drag-and-drop for cut assignment -- explicit Svelte 5 support, accessibility features built-in, handles both mouse and touch

**Do NOT install:**
- Bin-packing libraries (maxrects-packer, bin-pack, etc.) -- domain-specific requirements (kerf, grain) make custom implementation better
- SVG libraries (d3, svg.js) -- Svelte handles SVG natively with reactive bindings
- nodemailer -- Resend is simpler for API-based transactional email

**Environment variables to add:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxx
PUBLIC_BASE_URL=https://yourdomain.com
```

### Expected Features

**Must have (table stakes):**
- Admin role with user management (create, disable, reset password)
- Password reset via email (forgot password flow)
- Email verification on signup
- Cut list optimizer with Linear (1D) and Sheet (2D) modes
- Kerf/blade width configuration
- Cut diagram visualization
- BOM-to-cut-list import (auto-filter lumber items)
- Eye icon visibility toggle (replacing checkbox)
- Lumber dimension fields (L x W x T)
- Board feet calculation

**Should have (differentiators):**
- Drag-drop material assignment
- Shop checklist with completion tracking
- Waste percentage and efficiency reporting
- Manual cut placement override

**Defer (v2+ / v4.0):**
- 3D visualization
- CNC machine integration
- Stock inventory tracking
- Two-factor authentication
- OAuth providers
- Grain direction matching optimization

### Architecture Approach

v3.0 extends the existing architecture rather than replacing it. The hooks.server.ts middleware pattern adds role checking alongside existing auth. New tables (passwordResetTokens, emailVerificationTokens, cutLists, cutListStock, cutListCuts, cutPatterns) follow established Drizzle patterns with cascade deletes. The Cut List Optimizer is a self-contained tool route (`/cutlist`) with its own component hierarchy and optimization algorithms in `$lib/server/optimizer/`.

**Major components:**
1. **RBAC Layer** -- Role field on users, requireAdmin() guard, session includes role
2. **Email Service** -- `$lib/server/email.ts` wrapping Resend, sends verification and reset emails
3. **Token Tables** -- Short-lived cryptographic tokens for password reset and email verification
4. **Cut Optimizer Core** -- 1D bin packing (First Fit Decreasing) + 2D guillotine nesting algorithms
5. **Cut Diagrams** -- Native SVG components for visualizing cut patterns
6. **Drag-Drop Assignment** -- svelte-dnd-action zones for manual material assignment

### Critical Pitfalls

From PITFALLS.md, the top security and stability risks:

1. **Admin routes unprotected by role** -- Existing `/admin/templates` only checks `if (!locals.user)`, not role. Must retrofit BEFORE adding new features. Use centralized `requireAdmin(event)` helper.

2. **Form actions bypass load guards** -- SvelteKit actions can be POST'd directly without triggering load. Every action must duplicate auth/role checks.

3. **Password reset token security** -- Tokens must be crypto-random (crypto.randomUUID()), hashed in storage, expire in 1 hour, and be deleted immediately on use.

4. **Email enumeration** -- "Email not found" vs "Reset link sent" reveals account existence. Always return identical response regardless of whether email exists.

5. **2D nesting complexity** -- Naive O(n!) implementation freezes browser. Use heuristic algorithm (guillotine), run in Web Worker, limit to 50 pieces per batch.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: RBAC Foundation
**Rationale:** Security must come first. Existing admin routes have no role protection -- this is a vulnerability that must be fixed before any new features deploy.
**Delivers:** Role column on users, requireAdmin() guard, retrofitted admin routes
**Addresses:** Admin role flag, middleware protection, data isolation audit
**Avoids:** Pitfalls 1-3 (privilege escalation, action bypass, ownership checks)

### Phase 2: Admin User Management
**Rationale:** Depends on RBAC foundation. Admin needs to manage users before self-service flows exist.
**Delivers:** /admin/users CRUD, disable/enable accounts, admin password reset
**Addresses:** User list, create user, reset password, disable account
**Uses:** RBAC guards from Phase 1

### Phase 3: Email Infrastructure & Password Reset
**Rationale:** Email service must be configured and tested before user-facing flows. Password reset is more critical than email verification.
**Delivers:** Resend integration, password reset flow, token tables
**Addresses:** Forgot password, reset link, token expiration
**Avoids:** Pitfalls 4-6 (token security, enumeration, spam folder)

### Phase 4: Email Verification
**Rationale:** Lower priority than password reset. Can be added after reset flow proves email delivery works.
**Delivers:** Verification on signup, resend verification, verified status display
**Addresses:** Email verification flow, restricted features for unverified users

### Phase 5: BOM Refinements
**Rationale:** Can run parallel with auth phases or after. Required before Cut Optimizer can import lumber dimensions.
**Delivers:** Eye icon toggle, lumber dimension fields, board feet calculation
**Addresses:** Visibility UX, dimension tracking, board feet display
**Avoids:** Pitfalls 16-17 (null dimension handling, eye icon ambiguity)

### Phase 6: Cut Optimizer Foundation
**Rationale:** New tool route with basic scaffolding. Linear mode is simpler and provides immediate value.
**Delivers:** /cutlist routes, stock/cut CRUD, kerf configuration, project/BOM selection
**Uses:** svelte-dnd-action for drag-drop
**Implements:** Route structure, schema tables

### Phase 7: Linear Optimizer (1D)
**Rationale:** 1D bin packing is well-understood (FFD algorithm). Simpler to implement and test than 2D.
**Delivers:** 1D optimization algorithm, linear cut diagrams, waste percentage
**Addresses:** Board/trim optimization, save results to project
**Avoids:** Pitfalls 10-11 (zero dimensions, kerf math)

### Phase 8: Sheet Optimizer (2D)
**Rationale:** Most complex phase. 2D nesting requires careful algorithm selection and performance constraints.
**Delivers:** 2D guillotine algorithm, sheet diagrams, grain direction toggle
**Addresses:** Plywood/panel optimization, visual cut layout
**Avoids:** Pitfall 12 (complexity explosion -- use Web Worker, limit pieces)

### Phase 9: Shop Checklist & Polish
**Rationale:** Enhancement phase after core optimizer works. Adds shop workflow features.
**Delivers:** Completion tracking, progress indicator, manual override
**Addresses:** Shop-friendly checklist view, drag-drop refinement
**Avoids:** Pitfalls 13-14 (keyboard accessibility, touch support)

### Phase Ordering Rationale

- **Security first (Phases 1-4):** RBAC and email flows establish secure foundation before adding features that create more attack surface
- **Auth before optimizer:** User management and password reset are higher-stakes features; optimizer is value-add
- **1D before 2D:** Linear optimizer is algorithmically simpler, validates architecture, provides quick value
- **BOM refinements parallel-safe:** Dimension fields can be added anytime before Phase 6 integration
- **Polish last:** Drag-drop refinement and checklist completion tracking are nice-to-have after core works

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 8 (Sheet Optimizer):** 2D nesting algorithm selection needs prototyping -- guillotine vs maximal rectangles vs skyline. Benchmark with realistic data (20+ cuts).
- **Phase 3 (Email Infrastructure):** Domain verification (SPF/DKIM/DMARC) is operational, not code -- verify with mail-tester.com before launch.

Phases with standard patterns (skip research-phase):
- **Phase 1 (RBAC):** Well-documented SvelteKit middleware pattern, already partially implemented
- **Phase 7 (Linear Optimizer):** First Fit Decreasing is textbook algorithm, ~50 lines of code
- **Phase 5 (BOM Refinements):** Isolated UI changes, no architectural complexity

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions verified via npm registry 2026-01-29; svelte-dnd-action Svelte 5 peer dep confirmed |
| Features | MEDIUM | Based on domain knowledge and established UX patterns; no live competitor research |
| Architecture | MEDIUM-HIGH | Based on existing v2.0 codebase analysis; integration points clearly identified |
| Pitfalls | HIGH | Based on direct codebase analysis and OWASP patterns; security issues verified in code |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Email deliverability:** Requires operational setup (domain verification, SPF/DKIM) -- test with mail-tester.com before launch
- **2D algorithm performance:** Theoretical analysis only; prototype with Web Worker and benchmark with 50+ pieces
- **Touch device DnD:** svelte-dnd-action claims touch support but needs device testing on iPad/Android tablet
- **Lumber category matching:** AI-generated categories may vary; test flexible matching with real BOM data

## Sources

### Primary (HIGH confidence)
- npm registry (2026-01-29) -- resend 6.9.1, svelte-dnd-action 0.9.69, peer dependencies verified
- Existing WoodShop Toolbox v2.0 codebase -- auth patterns, schema, hooks.server.ts

### Secondary (MEDIUM confidence)
- SvelteKit documentation patterns from training data
- OWASP password reset guidelines
- First Fit Decreasing algorithm literature

### Tertiary (LOW confidence)
- 2D nesting algorithm comparison -- needs prototyping to validate
- Email service pricing/features -- verify with Resend docs

---
*Research completed: 2026-01-29*
*Ready for roadmap: yes*
