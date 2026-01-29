# Domain Pitfalls: v3.0 Multi-User & Cut Optimizer

**Project:** WoodShop Toolbox v3.0
**Researched:** 2026-01-29
**Context:** Adding RBAC, email flows, BOM refinements, and Cut List Optimizer to EXISTING v2.0 application
**Confidence:** HIGH (based on existing codebase analysis, established security patterns, and algorithmic knowledge)

## Critical Integration Warning

This research focuses on pitfalls when **adding** multi-user RBAC, email-based flows, and a new optimization tool to an **existing** SvelteKit application. The challenges are different from greenfield because:

- Existing admin routes (`/admin/templates`) currently only check authentication, not role
- Auth system exists (Argon2 + sessions in Turso) but has no role concept
- BOM items exist without dimension fields (need migration)
- Adding new tables (cut_lists) must integrate with cascade delete patterns
- Users table needs `role` column added with migration strategy

---

## Critical Pitfalls

Mistakes that cause security breaches, data exposure, or major rewrites.

---

### Pitfall 1: Admin Route Protection Without Role Check (EXISTING VULNERABILITY)

**What goes wrong:** Current admin routes (`/admin/templates`) only check `locals.user` existence, not role. When RBAC is added, any authenticated user can still access admin functionality if role checks aren't retrofitted.

**Evidence from codebase:**
```typescript
// Current: src/routes/admin/templates/+page.server.ts line 8-11
export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/auth/login?redirect=/admin/templates');
  }
  // NO ROLE CHECK - any authenticated user can access
```

**Why it happens:** v2.0 was single-user focus with implicit "owner is admin." When adding RBAC, teams often build new role-protected routes but forget to retrofit existing admin routes.

**Consequences:**
- Any registered user can create/edit/delete templates
- Privilege escalation from user to admin capabilities
- Data integrity issues if malicious user modifies templates

**Warning signs:**
- Admin pages accessible when logged in as non-admin during testing
- No `role` field check in existing `/admin/**` route guards

**Prevention:**
1. Create centralized `requireAdmin(locals)` utility that checks both auth AND role
2. Audit ALL existing `/admin/**` routes before RBAC goes live
3. Add automated test: "non-admin user gets 403 on admin routes"
4. Update existing admin routes FIRST, before adding new role-based features

**Detection:** Penetration test: login as regular user, try to access `/admin/templates`

**Which phase should address:** Phase 1 (RBAC) - retrofit existing admin routes FIRST before adding new features

---

### Pitfall 2: Forgetting Authorization in Form Actions

**What goes wrong:** SvelteKit `load` function has auth check, but `actions` handlers are accessed directly via POST - missing parallel check.

**Evidence from codebase:**
```typescript
// Current pattern in src/routes/admin/templates/+page.server.ts
export const actions: Actions = {
  create: async ({ request, locals }) => {
    // Auth check in action too (load check doesn't protect actions)
    if (!locals.user) {
      throw redirect(302, '/auth/login');
    }
    // But NO ROLE CHECK here either
```

**Why it happens:** Developers assume "if load is protected, actions are protected." False. Form actions can be called directly via POST without triggering load.

**Consequences:**
- Attackers can POST directly to action endpoints bypassing load guards
- Data modification by unauthorized users
- Existing pattern shows auth awareness, but role check is missing

**Warning signs:**
- Action handlers that don't start with auth/role check
- Different auth logic in load vs actions (inconsistency)

**Prevention:**
1. Create middleware/helper: `requireRole('admin', locals)` throws redirect/error
2. Code review checklist item: "Every action has role check matching load"
3. Grep check: actions without `locals.user?.role === 'admin'` call in admin routes

**Detection:** Review every `actions:` block in `/admin/**` - does it check role?

**Which phase should address:** Phase 1 (RBAC) - establish pattern, then enforce in all subsequent phases

---

### Pitfall 3: Indirect Object Reference Without Ownership Check

**What goes wrong:** Query uses resource ID without filtering by `userId` OR checking `role === 'admin'`. User A accesses User B's project by guessing UUID.

**Evidence from codebase (GOOD pattern to maintain):**
```typescript
// Current: src/routes/projects/[id]/+page.server.ts line 13-14
// IMPORTANT: Filter by BOTH id AND userId for security
const project = await db.query.projects.findFirst({
  where: and(eq(projects.id, params.id), eq(projects.userId, locals.user.id))
});
```

**Why it happens:** Existing code correctly uses `and(eq(id), eq(userId))` pattern - but new cut_lists routes might forget this pattern.

**Consequences:**
- Data breach - users see other users' projects/BOMs/cut lists
- Data modification of other users' resources
- Trust destruction

**Warning signs:**
- Queries with only `eq(resource.id, params.id)` without user filter
- No test for "user cannot access another user's resource"

**Prevention:**
1. Create typed helpers: `findOwnedProject(userId, projectId)`, `findOwnedCutList(userId, cutListId)`
2. Automated test: Create resource as User A, try to access as User B, expect 404
3. Code review: Any `eq(*.id, params.*)` must be paired with ownership check

**Detection:** Grep for `eq(cutLists.id` or `eq(cuts.id` without adjacent `userId` filter

**Which phase should address:** Phase 1 (RBAC) - audit existing, establish helpers; Phase 3 (Cut Optimizer) - apply to new tables

---

### Pitfall 4: Password Reset Token Predictability or Reuse

**What goes wrong:** Reset token is predictable (sequential, timestamp-based) or can be reused after password change.

**Why it happens:**
- Using `Date.now()` or incrementing counter instead of crypto-random
- Not invalidating token after successful reset
- Not expiring tokens

**Consequences:**
- Account takeover via guessed tokens
- Token interception and delayed use
- Attacker resets password, user resets it back, attacker uses captured token again

**Warning signs:**
- Token generation not using `crypto.randomUUID()` or `crypto.getRandomValues()`
- No `usedAt` or deletion after successful reset
- No expiry check on token validation

**Prevention:**
1. Generate 32+ byte random token using existing pattern from `auth.ts`: `crypto.randomUUID()`
2. Store token HASH in database, not plaintext (if DB is dumped, tokens are useless)
3. Set short expiry: 1 hour max
4. Delete or mark token used IMMEDIATELY on successful reset (before password update)
5. Rate limit reset requests per email (prevent enumeration)

**Token storage pattern:**
```typescript
// Generate token
const rawToken = crypto.randomUUID();
const tokenHash = await hashToken(rawToken); // SHA-256 hash

// Store hash in DB
await db.insert(passwordResets).values({
  userId,
  tokenHash,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
});

// Send raw token in email link
// On reset: hash submitted token, compare to stored hash
```

**Detection:**
- Review token generation code for entropy
- Test: use reset link twice - second should fail
- Test: use reset link after expiry - should fail

**Which phase should address:** Phase 2 (Email Flows) - password reset implementation

---

### Pitfall 5: Email Enumeration via Timing/Response Differences

**What goes wrong:** "Email not found" vs "Reset link sent" responses reveal which emails are registered.

**Why it happens:** Natural impulse to be helpful: "That email isn't in our system."

**Consequences:**
- Attackers build list of valid accounts
- Targeted phishing against known users
- Privacy violation (revealing account existence)

**Warning signs:**
- Different response text for found vs not-found email
- Different response time (DB lookup vs immediate response)

**Prevention:**
1. ALWAYS return same message: "If this email exists, we've sent a reset link"
2. ALWAYS perform same operations regardless of email existence
3. Add consistent delay (200-500ms) to mask timing differences
4. Log whether email was found (for debugging) but don't expose to user

**Code pattern:**
```typescript
export const actions = {
  requestReset: async ({ request }) => {
    const email = formData.get('email');

    // Always do the lookup (for consistent timing)
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    // Always add delay (masks timing differences)
    await new Promise(r => setTimeout(r, 300));

    if (user) {
      // Actually send email
      await sendPasswordResetEmail(user.email, token);
    }

    // ALWAYS return same message
    return {
      message: "If this email exists in our system, we've sent a reset link."
    };
  }
};
```

**Detection:** Test reset flow with valid email, invalid email - responses should be identical

**Which phase should address:** Phase 2 (Email Flows) - password reset AND email verification

---

### Pitfall 6: Transactional Email Landing in Spam

**What goes wrong:** Password reset / verification emails go to spam folder. Users never see them, think system is broken.

**Why it happens:**
- Missing SPF/DKIM/DMARC records for sending domain
- Using generic "from" address (noreply@gmail.com)
- No warm-up of sending domain
- Missing List-Unsubscribe header

**Consequences:**
- Users can't reset passwords or verify accounts
- Support burden increases ("I never got the email")
- Bad first impression, lost users

**Warning signs:**
- Test emails land in spam folder
- Low email open rates
- "I never got the email" support tickets

**Prevention:**
1. Use transactional email service (Resend, SendGrid, Postmark) - not raw SMTP
2. Configure SPF, DKIM, DMARC for sending domain
3. Use subdomain for transactional email (e.g., mail.woodshoptoolbox.com)
4. Include List-Unsubscribe header even for transactional
5. Test with mail-tester.com before launch (aim for 9+/10)
6. Provide "resend" button with rate limiting

**Detection:**
- Send test email to Gmail, Outlook, Yahoo - check spam folder
- Use mail-tester.com score

**Which phase should address:** Phase 2 (Email Flows) - setup and verification BEFORE sending user-facing emails

---

### Pitfall 7: Session Not Updated After Role Change

**What goes wrong:** Admin demotes user or changes their role. User's active session still has old role cached in `locals.user`.

**Evidence from codebase (partially good):**
```typescript
// Current: src/hooks.server.ts line 15
const session = await db.query.sessions.findFirst({
  where: eq(sessions.token, sessionToken),
  with: { user: true }  // Fetches fresh user data - GOOD
});
```

**Why it happens:** Session lookup fetches from users table (good!), but `role` field doesn't exist yet. When role is added, must ensure it's included in locals.

**Consequences:**
- Demoted admin retains admin access until session expires (30 days!)
- Role changes don't take effect immediately
- Security violation during transition period

**Warning signs:**
- User role change requires re-login to take effect
- `locals.user.role` different from database `users.role`

**Prevention:**
1. Existing `with: { user: true }` is correct - fetches fresh user data
2. When adding role, ensure `event.locals.user` includes role field
3. Update `app.d.ts` type: `user: { id, email, role, createdAt }`
4. Consider: invalidate all user's sessions on role change (stricter but more secure)

**Code update needed:**
```typescript
// hooks.server.ts - add role to locals
if (session.expiresAt > now) {
  event.locals.user = {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,  // ADD THIS
    createdAt: session.user.createdAt
  };
  event.locals.sessionId = session.id;
}
```

**Detection:**
- Change user role in DB while they're logged in
- Refresh page - should reflect new role immediately

**Which phase should address:** Phase 1 (RBAC) - ensure hooks fetch fresh role on every request

---

## Moderate Pitfalls

Mistakes that cause significant bugs, poor UX, or technical debt.

---

### Pitfall 8: Rate Limiting Gaps in Email Endpoints

**What goes wrong:** No rate limit on password reset or resend verification allows abuse.

**Why it happens:** Focus on "make it work" before "make it secure." Rate limiting feels like polish, not core.

**Consequences:**
- Attacker floods user's inbox (harassment)
- Email sending costs spike (Resend/SendGrid charge per email)
- IP/domain reputation damage from volume
- Potential DDoS vector

**Warning signs:**
- Can rapidly click "resend" without throttling
- No cooldown message

**Prevention:**
1. Per-email rate limit: 1 reset request per email per 15 minutes
2. Per-IP rate limit: 10 reset requests per IP per hour
3. Store last request timestamp in new table or in-memory
4. Show "Please wait X minutes before requesting again"

**Implementation:**
```typescript
// Simple rate limit check
const lastRequest = await db.query.emailRateLimits.findFirst({
  where: and(
    eq(emailRateLimits.email, email),
    gt(emailRateLimits.lastSentAt, new Date(Date.now() - 15 * 60 * 1000))
  )
});

if (lastRequest) {
  const waitTime = Math.ceil((lastRequest.lastSentAt.getTime() + 15 * 60 * 1000 - Date.now()) / 60000);
  return fail(429, {
    error: `Please wait ${waitTime} minute(s) before requesting another email.`
  });
}
```

**Detection:** Script: send 100 reset requests in 1 minute - should fail after first few

**Which phase should address:** Phase 2 (Email Flows) - build rate limiting into email endpoints from start

---

### Pitfall 9: Database Migration Breaking Existing Data

**What goes wrong:** Adding `role` column to `users` table fails because NOT NULL column has no default for existing rows.

**Why it happens:**
- SQLite limitations: cannot add NOT NULL column without default
- Turso/LibSQL inherits SQLite behavior
- Drizzle `db:push` fails or corrupts data

**Consequences:**
- Migration fails, deployment blocked
- Or worse: migration "succeeds" but data is inconsistent
- Rollback complexity

**Warning signs:**
- `db:push` fails with NOT NULL constraint error
- Existing users have NULL role after migration

**Prevention:**
1. Add new column with DEFAULT: `role: text('role').notNull().default('user')`
2. Test migration on copy of production data before deploying
3. Plan for first admin: SQL script or environment flag to promote existing user

**Schema pattern:**
```typescript
// schema.ts - add role with default
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

**First admin promotion:**
```sql
-- Run once after migration to promote yourself
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

**Detection:**
- Run migration on local with existing user data
- Check: existing users should have `role = 'user'`

**Which phase should address:** Phase 1 (RBAC) - schema migration planning with explicit backfill strategy

---

### Pitfall 10: Cut Optimizer Zero-Length or Negative Dimension Handling

**What goes wrong:** User enters 0 or negative length for cut, algorithm crashes or produces nonsense output.

**Why it happens:** UI allows any number input, algorithm assumes positive values.

**Consequences:**
- JavaScript errors or infinite loops
- Nonsense cut diagrams (negative waste)
- User confusion

**Warning signs:**
- No input validation on dimension fields
- Algorithm doesn't check inputs
- NaN or Infinity in calculations

**Prevention:**
1. UI validation: `min="0.1"` on number inputs
2. Server validation: reject dimensions <= 0
3. Algorithm guard: filter out zero/negative cuts before processing
4. Helpful error: "Cut length must be greater than 0"

**Validation layer:**
```typescript
// Before running optimizer
function validateCuts(cuts: Cut[]): { valid: Cut[], errors: string[] } {
  const errors: string[] = [];
  const valid = cuts.filter((cut, i) => {
    if (cut.length <= 0) {
      errors.push(`Cut ${i + 1}: Length must be greater than 0`);
      return false;
    }
    if (cut.width && cut.width <= 0) {
      errors.push(`Cut ${i + 1}: Width must be greater than 0`);
      return false;
    }
    return true;
  });
  return { valid, errors };
}
```

**Detection:** Test: enter 0, -5, empty string in dimension fields

**Which phase should address:** Phase 3 (Cut Optimizer) - validation layer before algorithm

---

### Pitfall 11: Kerf Width Exceeds Available Material

**What goes wrong:** Each cut loses material to kerf. If kerf + cut > remaining stock, algorithm fails or produces negative waste.

**Why it happens:** Kerf subtraction not properly accounted in bin packing:
- Cut needs 12" + 0.125" kerf = 12.125" actual consumption
- But final cut on a board doesn't need kerf after it

**Consequences:**
- Calculated fits don't work in reality
- Negative numbers in waste calculation
- Algorithm infinite loop trying to fit impossible cuts

**Warning signs:**
- Cuts "fit" mathematically but not physically
- Negative waste percentages
- Strange results with large kerf values

**Prevention:**
1. For N cuts from single board: total = sum(cuts) + (N-1) * kerf
2. NOT: total = sum(cuts) + N * kerf (no kerf after last cut)
3. Validate: if single cut + kerf > stock length, warn (cut won't fit with kerf)
4. Test with extreme kerf (1") to surface math errors

**Kerf accounting:**
```typescript
function calculateUsedLength(cuts: number[], kerf: number): number {
  if (cuts.length === 0) return 0;
  // Sum of cuts + (N-1) kerfs (no kerf after last cut)
  return cuts.reduce((sum, cut) => sum + cut, 0) + (cuts.length - 1) * kerf;
}

// Edge case: single cut
calculateUsedLength([12], 0.125) // = 12, not 12.125
// Two cuts
calculateUsedLength([12, 12], 0.125) // = 24.125, not 24.25
```

**Detection:**
- Test: 12" board, two 6" cuts, 0.125" kerf - should fit (6 + 0.125 + 6 = 12.125 > 12, doesn't fit!)
- Test: 12" board, one 12" cut, any kerf - should fit (no kerf needed)

**Which phase should address:** Phase 3 (Cut Optimizer) - algorithm implementation with edge case tests

---

### Pitfall 12: 2D Nesting Algorithm Complexity Explosion

**What goes wrong:** Sheet optimizer tries every possible arrangement, O(n!) complexity causes browser freeze for >10 pieces.

**Why it happens:** Naive implementation of 2D bin packing (NP-hard problem) without heuristics or limits.

**Consequences:**
- Browser unresponsive
- "Page not responding" dialog
- Users think app is broken

**Warning signs:**
- Performance degrades rapidly as pieces increase
- No progress indicator during calculation
- Calculation takes >5 seconds

**Prevention:**
1. Use proven heuristic: First-Fit Decreasing Height (FFDH) or Guillotine algorithm
2. Limit pieces per optimization: 50 max, batch if needed
3. Run algorithm in Web Worker to avoid UI freeze
4. Show progress indicator for calculations >500ms
5. Add "cancel" option for long-running optimizations

**Web Worker pattern:**
```typescript
// cut-optimizer.worker.ts
self.onmessage = (e) => {
  const { cuts, stock, kerf } = e.data;
  const result = optimizeCuts(cuts, stock, kerf);
  self.postMessage(result);
};

// +page.svelte
let worker = new Worker(new URL('./cut-optimizer.worker.ts', import.meta.url));
let calculating = $state(false);

async function runOptimization() {
  calculating = true;
  worker.postMessage({ cuts, stock, kerf });
  worker.onmessage = (e) => {
    result = e.data;
    calculating = false;
  };
}
```

**Detection:** Test with 5, 10, 20, 50 pieces - time should scale reasonably, not exponentially

**Which phase should address:** Phase 3 (Cut Optimizer) - algorithm selection and performance constraints

---

### Pitfall 13: Drag-Drop Without Keyboard Alternative

**What goes wrong:** Material assignment via drag-drop is inaccessible to keyboard-only users or those with motor impairments.

**Why it happens:** Drag-drop feels intuitive for mouse users; keyboard alternative seems like extra work.

**Consequences:**
- Accessibility violation (WCAG 2.1 failure)
- Screen reader users cannot use feature
- Potential legal liability (ADA)

**Warning signs:**
- Cannot complete task using only Tab/Enter/Arrow keys
- Screen reader announces nothing useful during drag operation

**Prevention:**
1. Add button alternative: "Assign to [dropdown]" for each cut
2. Implement arrow key movement within drag context
3. Announce drag state to screen readers: "Dragging Cut 1. Press Enter to drop."
4. Test with keyboard only, no mouse

**Accessible pattern:**
```svelte
<!-- Each cut has drag-drop AND button alternative -->
<div
  class="cut-item"
  draggable="true"
  ondragstart={handleDragStart}
>
  <span>Cut: 24" x 6"</span>

  <!-- Button alternative for accessibility -->
  <select
    onchange={(e) => assignToMaterial(cutId, e.target.value)}
    aria-label="Assign this cut to material"
  >
    <option value="">Assign to...</option>
    {#each materials as material}
      <option value={material.id}>{material.name}</option>
    {/each}
  </select>
</div>
```

**Detection:** Unplug mouse, complete material assignment workflow using only keyboard

**Which phase should address:** Phase 3 (Cut Optimizer) - implement keyboard alternative alongside drag-drop

---

### Pitfall 14: Drag-Drop Broken on Touch Devices

**What goes wrong:** Desktop drag-drop uses mouse events; mobile needs touch events. Feature doesn't work on tablets.

**Why it happens:**
- Using only `ondragstart/ondragend` (limited mobile support)
- Not testing on actual touch device
- HTML5 drag-drop has spotty touch support

**Consequences:**
- Mobile/tablet users cannot assign materials
- Frustrating UX on iPad (common device for woodworkers in shop)

**Warning signs:**
- Works on desktop, fails on tablet
- Touch causes scroll instead of drag

**Prevention:**
1. Use library with touch support: `svelte-dnd-action` or `@dnd-kit/core`
2. Or implement touch handlers: `touchstart/touchmove/touchend`
3. Test on actual iOS/Android device, not just Chrome devtools emulation
4. Provide tap-to-select alternative (select cut, tap destination)

**Library recommendation:**
```bash
npm install svelte-dnd-action
```

```svelte
<script>
  import { dndzone } from 'svelte-dnd-action';
</script>

<div use:dndzone={{ items: cuts }} on:consider={handleSort} on:finalize={handleDrop}>
  {#each cuts as cut (cut.id)}
    <div>{cut.name}</div>
  {/each}
</div>
```

**Detection:** Test on iPad or Android tablet - drag should work

**Which phase should address:** Phase 3 (Cut Optimizer) - use touch-friendly DnD library from start

---

### Pitfall 15: Cut List Not Filtering Lumber Correctly

**What goes wrong:** CUT-04 auto-filters lumber from BOMs, but category matching is fragile. "Hardwood" vs "Lumber" vs "Wood" inconsistency.

**Evidence from codebase:**
```typescript
// Current schema: bomItems.category is text, not enum
category: text('category').notNull()
```

**Why it happens:** AI-generated BOM items may use varied category names. Exact string matching fails.

**Consequences:**
- Lumber items not appearing in cut optimizer
- User manually adds items that should auto-filter
- "Where did my lumber go?" confusion

**Warning signs:**
- Some lumber items appear, others don't
- Different BOMs have different category strings

**Prevention:**
1. Normalize categories on BOM generation: always "Lumber" (check AI system prompt)
2. Filter by category containing "lumber" (case-insensitive)
3. Or add explicit `isLumber` boolean field
4. Audit existing BOM items for category consistency

**Flexible filter:**
```typescript
// Flexible lumber detection
function isLumberCategory(category: string): boolean {
  const lumberPatterns = ['lumber', 'wood', 'board', 'plywood', 'hardwood', 'softwood'];
  const normalized = category.toLowerCase();
  return lumberPatterns.some(pattern => normalized.includes(pattern));
}

// Filter lumber from BOM items
const lumberItems = bomItems.filter(item => isLumberCategory(item.category));
```

**Detection:** Create BOMs with various templates, check all lumber appears in cut optimizer

**Which phase should address:** Phase 3 (Cut Optimizer) - robust lumber detection logic

---

## Minor Pitfalls

Mistakes that cause annoyance but are quickly fixable.

---

### Pitfall 16: Lumber Dimension Fields Optional Confusion

**What goes wrong:** BOM-06 adds dimension fields to lumber items. What happens to existing lumber items without dimensions?

**Why it happens:** New fields are nullable, but UI doesn't clarify "not set" vs "intentionally blank."

**Consequences:**
- UI shows blank/0 for old items
- Board feet calculation shows 0 or NaN
- User confusion about required fields

**Warning signs:**
- Existing BOM items look broken after update
- "0 board feet" shown for legacy items

**Prevention:**
1. Make dimension fields nullable with clear "N/A" display for null
2. Board feet calculation: return null/dash if any dimension is null
3. UI: show "[dimensions not set]" placeholder, not 0
4. Migration: don't backfill with fake dimensions

**UI pattern:**
```svelte
<td>
  {#if item.length && item.width && item.thickness}
    {calculateBoardFeet(item.length, item.width, item.thickness).toFixed(2)} BF
  {:else}
    <span class="text-gray-400">--</span>
  {/if}
</td>
```

**Detection:** View existing BOM after adding dimension feature - should look reasonable

**Which phase should address:** Phase 2 (BOM Refinements) - handle null dimensions gracefully in UI

---

### Pitfall 17: Eye Icon Toggle State Ambiguity

**What goes wrong:** Eye icon means "visible" in some UIs, "click to hide" in others. Users confused about current state vs action.

**Why it happens:** Icon semantics are ambiguous - does filled eye mean "visible" or "watching"?

**Consequences:**
- Users toggle wrong direction
- Hidden items exported accidentally
- Frustrating trial-and-error

**Warning signs:**
- User clicks eye expecting to hide, item becomes visible
- Support questions about icon meaning

**Prevention:**
1. Eye open = visible, eye with slash = hidden (standard convention)
2. Add tooltip: "Click to hide" (when visible) / "Click to show" (when hidden)
3. Visual difference beyond icon: hidden row should be grayed/styled
4. Consistent with existing checkbox behavior being replaced

**Icon pattern:**
```svelte
<button
  onclick={() => toggleVisibility(item.id)}
  title={item.hidden ? 'Click to show' : 'Click to hide'}
  aria-label={item.hidden ? 'Show item' : 'Hide item'}
>
  {#if item.hidden}
    <!-- Eye with slash - hidden -->
    &#128065;&#xFE0E;&#x0338;
  {:else}
    <!-- Eye - visible -->
    &#128065;
  {/if}
</button>
```

**Detection:** User testing - ask 3 people what icon state means

**Which phase should address:** Phase 2 (BOM Refinements) - design with clear state indication

---

### Pitfall 18: Cut Diagram Unreadable at Scale

**What goes wrong:** Diagram shows 20 cuts on one board. Text overlaps, cuts are too small to see.

**Why it happens:** Fixed-size visualization doesn't scale to variable content.

**Consequences:**
- Diagram useless for complex cuts
- Users can't verify optimization is correct
- Defeats purpose of visual output

**Warning signs:**
- Labels overlap or truncate
- Thin cuts appear as lines, not rectangles
- No zoom or pan capability

**Prevention:**
1. Implement zoom/pan on diagram (scrollable container with scale)
2. Collapse small cuts into numbered markers, show details in legend
3. Minimum visual width for cuts (even if not to scale for very thin cuts)
4. Hover/tap to highlight and show details
5. Test with realistic data: 20+ cuts across 5 boards

**Detection:** Generate cut list with many cuts - diagram should be usable

**Which phase should address:** Phase 3 (Cut Optimizer) - diagram scalability in visualization implementation

---

### Pitfall 19: Email Service Credentials Not Set

**What goes wrong:** App deploys without email service API key. First user tries password reset, gets 500 error.

**Why it happens:** Email service is added but environment variable not configured in production.

**Consequences:**
- Password reset fails silently or with error
- Email verification fails
- Users locked out of accounts

**Warning signs:**
- Works in dev (different env), fails in prod
- No check for required email config at startup

**Prevention:**
1. Check for email API key at app startup (not first email send)
2. Add to `.env.example`: `RESEND_API_KEY=`
3. Fail fast: if email features enabled, require API key
4. Log warning if email disabled, don't allow password reset

**Startup check:**
```typescript
// lib/server/email.ts
import { env } from '$env/dynamic/private';

if (!env.RESEND_API_KEY) {
  console.warn('WARNING: RESEND_API_KEY not set. Email features disabled.');
}

export const emailEnabled = !!env.RESEND_API_KEY;

export async function sendEmail(...) {
  if (!emailEnabled) {
    throw new Error('Email service not configured');
  }
  // ... send email
}
```

**Detection:** Deploy without API key, try password reset - should fail gracefully with message

**Which phase should address:** Phase 2 (Email Flows) - environment validation

---

## Integration Pitfalls with Existing System

### Existing Code Patterns to Maintain

The codebase has good patterns that MUST be maintained when adding new features:

1. **Data isolation via `userId` filter** (see `projects/[id]/+page.server.ts` line 13-14)
   - Pattern: `and(eq(resource.id, params.id), eq(resource.userId, locals.user.id))`
   - Pitfall: Forgetting this pattern in new Cut List routes

2. **Auth check in both load AND actions** (see `admin/templates/+page.server.ts` line 21-23)
   - Pattern: Duplicate auth check at start of each action
   - Pitfall: Assuming load protection covers actions (it doesn't)

3. **Cascade deletes configured in schema** (see `schema.ts` foreign keys)
   - Pattern: `onDelete: 'cascade'` on child relations
   - Pitfall: New cut_lists table needs same pattern for project deletion

4. **Session includes user data** (see `hooks.server.ts` line 15)
   - Pattern: `with: { user: true }` fetches fresh user data
   - Pitfall: Must add `role` to fetched fields and locals type

### New Integration Points

| New Feature | Integrates With | Pitfall Risk |
|-------------|-----------------|--------------|
| Role column | users table | Migration breaks NOT NULL |
| Admin check | hooks.server.ts | Adding role to locals without breaking existing code |
| Email service | Environment vars | Missing API key crashes app |
| Password reset | sessions table | New tokens table or repurpose? (new table recommended) |
| Cut optimizer | projects, boms, bomItems | Cascading deletes, ownership checks |
| Lumber filter | bomItems.category | Category string inconsistency |
| Dimension fields | bomItems table | Nullable fields, display handling |

---

## Phase-Specific Warnings Summary

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1 | RBAC | Existing admin routes unprotected | Audit and retrofit before new features |
| Phase 1 | RBAC | Actions bypass load auth | Centralized `requireRole()` helper |
| Phase 1 | RBAC | Migration breaks NOT NULL | Add `role` column with DEFAULT |
| Phase 1 | RBAC | Session missing role | Update hooks to include role in locals |
| Phase 2 | Email | Spam folder delivery | Configure SPF/DKIM/DMARC, use transactional service |
| Phase 2 | Email | Token predictability | Crypto-random, hash storage, short expiry |
| Phase 2 | Email | User enumeration | Identical responses regardless of email existence |
| Phase 2 | Email | Rate limiting gaps | Per-email and per-IP limits |
| Phase 2 | Email | Missing API key | Startup check, fail fast |
| Phase 2 | BOM | Dimension null handling | Graceful UI for missing dimensions |
| Phase 2 | BOM | Eye icon ambiguity | Clear state indication, tooltips |
| Phase 3 | Cut Optimizer | Zero/negative dimensions | Input validation + algorithm guards |
| Phase 3 | Cut Optimizer | Kerf math errors | Careful accounting: (N-1) * kerf, not N |
| Phase 3 | Cut Optimizer | 2D complexity explosion | Heuristic algorithm + Web Worker + limits |
| Phase 3 | Cut Optimizer | Drag-drop accessibility | Keyboard alternative required |
| Phase 3 | Cut Optimizer | Drag-drop touch failure | Use touch-friendly DnD library |
| Phase 3 | Cut Optimizer | Lumber filter mismatch | Flexible category matching |
| Phase 3 | Cut Optimizer | Diagram unreadable | Zoom/pan, hover details |

---

## Priority Order for Addressing Pitfalls

**Must fix before any v3.0 deployment:**
1. Pitfall 1: Admin routes without role check (security)
2. Pitfall 2: Actions without role check (security)
3. Pitfall 3: Missing ownership checks in new routes (security)
4. Pitfall 4: Token security (security)
5. Pitfall 5: Email enumeration (privacy)

**Must fix before email features go live:**
6. Pitfall 6: Spam folder issues (functionality)
7. Pitfall 8: Rate limiting (abuse prevention)
8. Pitfall 19: Missing API key handling (reliability)

**Must fix before cut optimizer goes live:**
9. Pitfall 10: Zero/negative dimensions (crashes)
10. Pitfall 11: Kerf math (accuracy)
11. Pitfall 12: Complexity explosion (performance)
12. Pitfall 13: Keyboard accessibility (compliance)
13. Pitfall 14: Touch device support (usability)

---

## Sources and Confidence

**Confidence: HIGH**

This research is based on:
- Direct analysis of existing codebase (`auth.ts`, `hooks.server.ts`, `schema.ts`, `+page.server.ts` files)
- Existing v2.0 patterns already working in production
- OWASP guidelines for authentication and password reset
- Established bin packing algorithm complexity analysis
- WCAG 2.1 accessibility requirements

**Key observations from codebase:**
- Auth pattern is solid (Argon2, session tokens, cookie handling)
- Data isolation pattern exists and is correctly implemented
- Foreign key cascades properly configured
- Hooks correctly fetch fresh user data (just need role field)

**Gaps that need runtime validation:**
- Email service integration (no existing email code)
- Cut optimization algorithm performance (theoretical analysis only)
- Touch device DnD behavior (needs device testing)
