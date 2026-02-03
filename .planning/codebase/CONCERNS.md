# Codebase Concerns

**Analysis Date:** 2026-02-03

## Tech Debt

**Manual Ownership Verification at Route Level:**
- Issue: User-data isolation (`projectId`, `bomId`, `cutListId`) is enforced via manual ownership checks at each route rather than middleware/hooks.
- Files: `src/routes/projects/[id]/+page.server.ts`, `src/routes/projects/[id]/bom/[bomId]/+page.server.ts`, `src/routes/api/bom/save/+server.ts`, `src/routes/api/cutlist/save/+server.ts`, `src/routes/cutlist/[id]/+page.server.ts`
- Impact: Risk of missing ownership checks in future routes; maintainers must remember to add `userId` or `projectId` filters on every query. Multiple verification sites create maintenance burden.
- Fix approach: Extract common ownership validation into reusable helpers, e.g., `verifyProjectOwnership(userId, projectId)` in `src/lib/server/auth.ts`, callable from all relevant routes to centralize logic.

**Placeholder Cut Optimizer Algorithms:**
- Issue: Cut optimizer currently uses greedy First-Fit-Decreasing (FFD) for both 1D and 2D. Header comment states "simple greedy... will be replaced with proper algorithms in Phases 19 (1D FFD) and 20 (2D Guillotine)." Current FFD is acceptable for MVP but suboptimal for material waste reduction.
- Files: `src/lib/server/cutOptimizer.ts` (lines 1-7, 50-246 for 1D, 434-659 for 2D)
- Impact: Sub-optimal cut layouts for complex projects; users may not get best possible waste reduction. 2D Guillotine is partially implemented but not as robust as commercial algorithms.
- Fix approach: Phase 19/20 will replace FFD with domain-optimized 1D and true 2D Guillotine. Current code already has structure in place; refactor into separate algorithm module and add benchmarking tests.

**No Automated Test Suite:**
- Issue: Codebase has no `.test.ts` or `.spec.ts` files in `src/`. Only node_modules dependencies have tests. Verification happens manually.
- Files: Entire `src/` directory
- Impact: Regression risk on auth flows, BOM validation, cut optimizer algorithms, and ownership checks. No CI validation before deployment.
- Fix approach: Add Jest/Vitest config, write tests for: auth functions (hash, verify, session), cutOptimizer 1D/2D algorithms with sample data, CSV import validation, data isolation checks (ownership verification).

**Email Failures Are Non-Blocking:**
- Issue: In `src/routes/auth/signup/+page.server.ts` (lines 99-106), if Resend API fails, signup continues silently without alerting user that verification email wasn't sent.
- Files: `src/routes/auth/signup/+page.server.ts` (lines 99-106)
- Impact: Users may expect verification email but never receive it; their account will have `emailVerified = false` permanently until they manually request resend.
- Fix approach: Either: (1) Make email sending blocking with user-facing error, or (2) Set a flag on user indicating "email send failed, prompt for resend" and show banner on dashboard.

**CSV Import Missing Dimension Validation:**
- Issue: CSV import accepts lumber items but doesn't validate dimensional consistency (e.g., negative dimensions, excessively large values).
- Files: `src/lib/utils/csv-import.ts` (lines 93-150, dimension parsing logic)
- Impact: Users can import invalid dimensional lumber data (negative length/width/height) that may cause issues in cut optimizer or BOM calculations.
- Fix approach: Add min/max validation in `validateRow()` function: length/width/height must be > 0 and < 1000 inches; warn on extreme values.

---

## Known Bugs

**Cut Assignment Conflict Detection Could Fail with Null Overrides:**
- Symptoms: In manual placement UI, the `detectConflicts()` function only considers cuts with both `assignedStockId` AND non-null `overridePosition`. Cuts with automatic placement (null override) are silently ignored.
- Files: `src/lib/components/cutlist/ManualPlacement.svelte` (lines 49-92)
- Trigger: User assigns a cut to stock but doesn't set override position; moves to another cut with override position; overlap isn't detected.
- Workaround: Always set override position when assigning to stock; validate positions before saving.
- Fix: Update conflict detection to include auto-placed cuts using their algorithm-suggested positions.

**Missing Crypto Import in BOM Save Endpoint:**
- Symptoms: `src/routes/api/bom/save/+server.ts` uses `crypto.randomUUID()` at lines 44 and 68 but does not import `crypto` module.
- Files: `src/routes/api/bom/save/+server.ts` (lines 1-10, missing import)
- Trigger: This will fail at runtime when endpoint is called; BOM save will throw "crypto is not defined."
- Workaround: Manually test the endpoint before deploying to production.
- Fix: Add `import crypto from 'crypto';` at top of file (see `src/routes/api/cutlist/save/+server.ts` line 1 for reference pattern).

**Kerf Not Properly Accounted in 1D Waste Calculation:**
- Symptoms: In `optimizeCuts1D()`, kerf calculation at line 157 uses `plan.cuts.length * kerf` but should use `(plan.cuts.length - 1) * kerf` (only between cuts, not before first cut).
- Files: `src/lib/server/cutOptimizer.ts` (line 157)
- Trigger: When checking if cut fits in existing plan, kerf allowance is inflated by one extra blade width.
- Impact: Cuts may be placed less efficiently; waste percentage may be underestimated.
- Fix: Line 157: change `plan.cuts.length > 0 ? plan.cuts.length * kerf : 0` to `plan.cuts.length > 0 ? (plan.cuts.length) * kerf : 0` (between existing cuts, not before).

---

## Security Considerations

**Email Tokens Sent in URL Query String:**
- Risk: Password reset and email verification tokens are sent as URL parameters (`?token=...`) in plain text HTTP(S). If logs are not properly secured or links are forwarded, tokens can be intercepted.
- Files: `src/lib/server/email.ts` (lines 24, 84 - password reset and verification URLs)
- Current mitigation: Tokens are hashed in database (SHA-256); plaintext only in email. Single-use consumption. HTTPS recommended in production.
- Recommendations: (1) Consider POST-based token submission instead of query params; (2) Add rate-limiting on token validation endpoints to prevent brute-force; (3) Ensure logs never capture query strings (`?token=...`).

**Admin Role Hard-Coded to First User:**
- Risk: First user to sign up becomes admin. If account is compromised, attacker gains admin access to template management and user admin panel.
- Files: `src/routes/auth/signup/+page.server.ts` (lines 76-82); `src/lib/server/auth.ts` (comment lines 9-34)
- Current mitigation: Admin panel is at `/admin/*` requiring `requireAdmin()` check.
- Recommendations: (1) Add secondary admin verification step (email confirmation, manual approval); (2) Allow first user to invite second admin; (3) Log all admin actions; (4) Consider TOTP 2FA for admin accounts.

**Email Verification Not Enforced:**
- Risk: Users can access all app features without verifying email (`emailVerified` is not checked at route level). Compromised/typo emails can create dead-end accounts.
- Files: Routes do not check `locals.user.emailVerified` before granting access
- Current mitigation: Password reset flow does send verification email at signup.
- Recommendations: (1) Add `requireVerifiedEmail()` helper for feature-gating; (2) Gate certain actions (e.g., creating projects) behind verification; (3) Show verification reminder banner if not verified after 24 hours.

**Disabled Account Not Fully Enforced:**
- Risk: `users.disabled` flag is checked in `hooks.server.ts` (session validation) but not in every API endpoint. Routes using `requireAuth()` will allow disabled users if they already have a valid session.
- Files: `src/hooks.server.ts` (lines 22-27); compare with `src/routes/api/bom/save/+server.ts` which only checks `locals.user` exists
- Current mitigation: Session is destroyed for disabled users on next request (good), but current request succeeds.
- Recommendations: (1) Add `requireEnabledUser()` check that verifies `!user.disabled` in API endpoints; (2) Audit all auth-protected routes for consistency.

---

## Performance Bottlenecks

**2D Guillotine Algorithm Quadratic Complexity:**
- Problem: In `optimizeCuts2D()`, the cut placement loop (line 547) tries every cut against every existing plan's free rectangles. With 100 cuts and multiple sheets, this approaches O(n²) comparisons.
- Files: `src/lib/server/cutOptimizer.ts` (lines 547-620, nested loops in guillotinePack at lines 372-426)
- Cause: No spatial indexing of free rectangles; naive linear search through all free space candidates.
- Impact: On 500+ item BOMs, cut optimization may take several seconds; timeout risk if API backend is slow.
- Improvement path: (1) Add spatial hash for free rectangles; (2) Implement bin-packing cache; (3) Set iteration limits and return partial results; (4) Cache algorithm results to avoid re-computation.

**No Database Index on Common Queries:**
- Problem: Queries like `eq(projects.userId, userId)`, `eq(cutLists.userId, userId)` may do full table scans if schema lacks indexes.
- Files: `src/lib/server/schema.ts` (tables defined without explicit `index()` decorators)
- Impact: With thousands of users/projects, queries degrade. Less noticeable now but will hit as user base grows.
- Improvement path: Add Drizzle indexes on foreign keys and frequently queried columns: `userId` on `projects`, `cutLists`, `sessions`; `projectId` on `boms`, `cutLists`.

**CSV Import Processing Fully in Memory:**
- Problem: CSV import uses PapaParse to load entire file into memory before validation/processing (10MB max file size).
- Files: `src/lib/utils/csv-import.ts` (lines 34-59 file validation; actual parse not shown but uses PapaParse in component)
- Impact: Very large CSV files (8-10MB) could cause memory pressure or browser crash; no streaming support.
- Improvement path: (1) For now, 10MB limit is acceptable; (2) Future: implement chunked parsing or server-side CSV processing.

---

## Fragile Areas

**Manual Placement Component High Complexity:**
- Files: `src/lib/components/cutlist/ManualPlacement.svelte` (678 lines)
- Why fragile: Large component with complex drag-drop logic, conflict detection, position editing, and state synchronization. Multiple event handlers and computed derived state (`$derived conflicts`).
- Safe modification: Test all drag-drop scenarios when changing position calculation; add unit tests for `detectConflicts()` logic.
- Test coverage: No tests; conflict detection logic is untested. Manual testing needed before changes.

**BOM Item Inline Editing with Multiple State Paths:**
- Files: `src/lib/components/bom/BOMItem.svelte` (531 lines)
- Why fragile: Supports both inline editing (quantity, visibility toggle) and full form submission. State can diverge between client and server during network lag.
- Safe modification: Always test save/cancel flows; ensure optimistic UI updates are consistent with server response.
- Test coverage: No tests for optimistic update failures; manual testing required.

**Session Management Dual-Layer Validation:**
- Files: `src/hooks.server.ts` (session expiry + disabled check) + each route's `requireAuth()` check
- Why fragile: Two places validate sessions; inconsistency could allow stale sessions. Disabled user handling is split.
- Safe modification: Consolidate session validation logic into `src/lib/server/auth.ts` as a single `validateSessionAndUser()` function; call from hooks.
- Test coverage: No automated tests for session edge cases (expiry, disable during request, concurrent requests).

---

## Scaling Limits

**LibSQL/Turso Single Database Connection:**
- Current capacity: Single Turso database instance handles all users. No sharding, read replicas, or caching layer.
- Limit: SQLite-based architecture can handle ~100 concurrent connections before hitting resource limits. ~10,000 daily active users before query performance degrades.
- Scaling path: (1) Add Redis caching layer for frequently accessed data (user projects, templates); (2) Migrate to PostgreSQL if scaling beyond 1,000 concurrent users; (3) Implement read replicas for queries.

**No Rate Limiting on API Endpoints:**
- Current capacity: AI BOM generation endpoint has no per-user rate limit. One user calling repeatedly could exhaust API quota or cause DoS.
- Limit: If many users generate BOMs concurrently, Anthropic/OpenAI quota exhausted quickly; spike in usage causes service degradation.
- Scaling path: (1) Add in-memory rate limiter (e.g., `redis` or simple Map with decay); (2) Implement token bucket per user; (3) Queue long-running generation tasks; (4) Add cost tracking per user.

**No Pagination on Project/BOM Lists:**
- Current capacity: Routes load all user projects/BOMs at once (`findMany()` without limit). With 1,000+ projects, browser becomes slow.
- Limit: Rendering 1,000+ items in sidebar/lists causes UI lag.
- Scaling path: Implement cursor-based pagination; load first 50, then load-more on scroll.

---

## Dependencies at Risk

**Vercel AI SDK v6 Type Safety with `message.parts`:**
- Risk: SDK v6 has changed how streaming responses expose text. Code at `src/routes/api/bom/generate/+server.ts` line 119 uses `result.object` which assumes strongly-typed schema validation, but text extraction patterns may change in minor versions.
- Impact: If SDK updates with breaking changes to object generation, BOM generation fails.
- Migration plan: (1) Pin to `^6.0.42` with minor version testing; (2) Add integration tests that validate generateObject() output shape; (3) Wrap SDK calls in adapter layer that abstracts away version details.

**PapaParse Fork Risk (CSV Parsing):**
- Risk: PapaParse is maintained but CSS parsing is a secondary use case. If critical parsing bugs emerge, library may not be patched quickly.
- Impact: Malformed CSV imports could silently fail or produce incorrect data.
- Migration plan: CSV parsing is decoupled in `src/lib/utils/csv-import.ts`. Can swap implementations easily. Consider lightweight alternative: `csv-parser` or native solution if parse issues arise.

**Drizzle ORM v0.45 - Early Adoption Risk:**
- Risk: Drizzle v0.45 is relatively new. Edge cases in relations, transactions, or SQLite compatibility may surface.
- Impact: Cascading deletes, transaction atomicity, or relation queries could break unexpectedly in edge cases.
- Migration plan: (1) Thoroughly test all delete cascades before shipping features; (2) Monitor Drizzle changelog; (3) Keep integration tests comprehensive; (4) Have rollback plan to raw SQL if ORM fails.

---

## Missing Critical Features

**No Undo/Redo in BOM Editor:**
- Problem: Users can edit BOMs (add/remove/modify items) but can't undo mistakes without manual reversal. Destructive actions (delete item) are permanent.
- Blocks: (1) Users afraid to experiment with BOMs; (2) Accidental deletes of many items require manual re-entry.
- Severity: Medium - not blocking current features but UX friction.

**No CSV Export for Cut Lists:**
- Problem: BOMs can export to CSV; cut lists cannot. Users must manually record cut optimization results.
- Blocks: Integration with external cut tracking tools; shop floor documentation.
- Severity: Low - cut lists primarily for in-app reference, but limits portability.

**No Bulk Item Edit in BOM:**
- Problem: Editing many items requires clicking each one. No select-multiple, no batch operations.
- Blocks: Power users with large BOMs can't efficiently modify categories, units, or quantities across many items.
- Severity: Low - acceptable for MVP, but UX gap for complex projects.

---

## Test Coverage Gaps

**Authentication Flows Untested:**
- What's not tested: Signup (first user becomes admin), email verification, password reset token generation/validation, session creation/expiry, disabled user handling, concurrent logins.
- Files: `src/lib/server/auth.ts`, `src/routes/auth/**`
- Risk: Critical bugs in auth could allow unauthorized access or account hijacking. No regression detection if flows change.
- Priority: High

**Cut Optimizer Algorithm Not Tested:**
- What's not tested: 1D FFD kerf calculations, 2D Guillotine placement logic, edge cases (cuts larger than stock, zero quantities, unplaceable cuts).
- Files: `src/lib/server/cutOptimizer.ts`
- Risk: Sub-optimal packing, incorrect waste calculations, crashes on edge input. Bugs could persist undetected.
- Priority: High

**Data Isolation / Ownership Not Tested:**
- What's not tested: Users cannot access other users' projects/BOMs/cut lists, even with direct ID manipulation. Disabled users can't access resources. Cross-user data leaks.
- Files: All route handlers with ownership checks
- Risk: Critical security vulnerability if ownership checks are incorrect or forgotten.
- Priority: Critical

**CSV Import Validation Not Tested:**
- What's not tested: Header validation, row validation (missing fields, invalid types, dimension bounds), encoding issues (UTF-8 BOM, Excel exports).
- Files: `src/lib/utils/csv-import.ts`
- Risk: Users can import invalid data that corrupts BOMs or causes downstream errors.
- Priority: Medium

**Email Sending Not Tested:**
- What's not tested: Resend API failures, malformed email addresses, retry behavior.
- Files: `src/lib/server/email.ts`
- Risk: Silent failures during password reset / verification. Users lose ability to recover accounts.
- Priority: Medium

**Component UI State Not Tested:**
- What's not tested: BOM item inline editing (optimistic updates, cancel, concurrent saves), manual cut placement drag-drop, form validation errors.
- Files: `src/lib/components/bom/BOMItem.svelte`, `src/lib/components/cutlist/ManualPlacement.svelte`, etc.
- Risk: Unexpected state divergence between UI and server; users lose unsaved changes.
- Priority: Medium (lower than backend logic, but important for user experience)

---

*Concerns audit: 2026-02-03*
