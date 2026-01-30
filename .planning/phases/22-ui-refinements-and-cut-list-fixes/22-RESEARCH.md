# Phase 22: UI Refinements & Cut List Fixes - Research

**Researched:** 2026-01-30
**Domain:** UI/UX polish, navigation restructure, cut list workflow refinements
**Confidence:** HIGH

## Summary

Phase 22 is a polish and refinement phase addressing user feedback and UX issues discovered during Phase 21 testing. The phase focuses on four key areas:

1. **Account Logic & Header UI** - Add user name fields to schema, update header dropdown to show first name instead of email, ensure fixed positioning of header elements
2. **Sidebar Restructure & Dashboard Logic** - Reorganize navigation hierarchy (separate content viewing from tool creation), add new "View All" pages, limit dashboard to 6 most recent projects
3. **Cut List Optimizer UI & Logic** - Reorder form sections (kerf first, stock/cuts side-by-side), fix BOM loading logic to populate stock instead of cuts, add mandatory loading screen
4. **Optimization Results & Data Persistence** - Create dedicated results page route, fix saved cut list viewing bug

The current codebase has all foundational pieces in place. This phase requires schema changes (firstName/lastName columns), route additions (/projects view-all, /cutlist/results), component refactoring (Sidebar, Header, cut list page layouts), and bug fixes (saved list loading, BOM import target).

**Primary recommendation:** Schema migration first (adds firstName/lastName with defaults), then tackle each plan area independently. Plans are largely independent and can be executed in parallel or any order.

## Standard Stack

The established stack for this phase:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 2.x | Framework | Project framework, established patterns |
| Svelte 5 | Latest | Reactive UI | Uses runes ($state, $props, $derived) |
| Drizzle ORM | Latest | Database | Schema migrations, query API |
| Turso (LibSQL) | Latest | Database | SQLite-based persistence |
| Tailwind CSS | v4 | Styling | CSS-first approach with @tailwindcss/vite |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-kit | Latest | Migrations | Schema changes (firstName/lastName) |
| oslo | Latest | Auth utilities | Already in use for session management |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 CSS-first | Inline Tailwind classes | CSS-first is project standard, don't mix approaches |
| Drizzle migrations | Manual SQL | Drizzle provides type safety and rollback support |
| Native HTML5 drag-drop | svelte-dnd-action | Phase 21 chose native (already decided) |

**Installation:**
No new dependencies required. All tools already in package.json.

## Architecture Patterns

### Current Project Structure
```
src/
├── lib/
│   ├── components/
│   │   ├── Header.svelte              # User dropdown, mobile menu trigger
│   │   ├── Sidebar.svelte             # Desktop nav, brand, nav items
│   │   ├── UserMenu.svelte            # Dropdown with email, admin links, logout
│   │   └── cutlist/                   # Cut optimizer components
│   └── server/
│       ├── schema.ts                  # Drizzle schema definitions
│       └── auth.ts                    # requireAuth, requireAdmin helpers
├── routes/
│   ├── +layout.svelte                 # App shell (sidebar + header + content)
│   ├── +page.svelte                   # Dashboard (hero, projects grid, tools)
│   ├── projects/
│   │   ├── +page.svelte               # Projects list (create form + grid)
│   │   └── [id]/+page.svelte          # Project detail
│   └── cutlist/
│       ├── +page.svelte               # Optimizer UI (mode, inputs, optimize)
│       ├── from-bom/+page.svelte      # BOM import flow
│       └── [id]/+page.svelte          # Saved cut list view (checklist + manual)
```

### Pattern 1: Schema Migration with Defaults
**What:** Add nullable columns with runtime defaults for backward compatibility
**When to use:** Adding user profile fields without requiring existing users to update
**Example:**
```typescript
// Schema change
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  // NEW fields
  firstName: text('first_name'), // nullable
  lastName: text('last_name'),   // nullable
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  // ... existing fields
});

// Runtime default in component
const displayName = user.firstName || 'Wood'; // Default to 'Wood Worker'
```

**Why this pattern:**
- Existing users don't break when schema changes
- No required data migration for existing users
- Can prompt for names on next login or profile edit
- Defaults provide immediate UX improvement

### Pattern 2: Fixed Positioning for Header Elements
**What:** Use `position: fixed` or `position: sticky` with high z-index for header elements that should remain visible during scroll
**When to use:** User dropdowns, action buttons that need to remain accessible
**Example:**
```css
.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--color-white);
}

.user-menu {
  position: relative; /* Contains absolute dropdown */
}

.user-menu-dropdown {
  position: fixed; /* Fixed to viewport, not container */
  top: calc(var(--header-height) + 4px);
  right: var(--space-md);
  z-index: 50; /* Above header */
}
```

**Current implementation issue:**
- Header.svelte uses `position: sticky` (line 63) which is correct
- UserMenu.svelte dropdown uses `position: absolute` with `right: 0` (line 37) - relative to parent, not viewport
- On scroll, dropdown may scroll with content instead of staying fixed

**Fix:** Change UserMenu dropdown to `position: fixed` with viewport-based positioning

### Pattern 3: Navigation Hierarchy Separation
**What:** Separate "view existing content" actions from "create new content" actions in navigation
**When to use:** When users have both browsing and creation workflows
**Example:**
```typescript
const navigationSections = [
  {
    label: 'NAVIGATION',
    items: [
      { label: 'Dashboard', href: '/', icon: 'home' },
      { label: 'View All Projects', href: '/projects', icon: 'folder' },
      { label: 'View All BOMs', href: '/boms', icon: 'clipboard-list' },
      { label: 'View All Cut Lists', href: '/cutlists', icon: 'scissors-list' }
    ]
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'Create BOM', href: '/bom/new', icon: 'clipboard-plus' },
      { label: 'Create Cut List', href: '/cutlist', icon: 'scissors-plus' }
    ]
  }
];
```

**Current implementation:** Sidebar mixes viewing and creation (Dashboard, BOM Generator, Cut List, Calculator)

**Refactor:** Two sections with clear labels, distinct purposes

### Pattern 4: Dashboard Content Limiting
**What:** Limit dashboard content to most recent N items with "View All" link
**When to use:** Dashboard should provide quick access, not comprehensive listing
**Example:**
```typescript
// In +page.server.ts
const recentProjects = await db.query.projects.findMany({
  where: eq(projects.userId, user.id),
  orderBy: [desc(projects.createdAt)],
  limit: 6 // Only fetch 6 most recent
});

return {
  projects: recentProjects,
  hasMoreProjects: recentProjects.length === 6 // May have more
};
```

**Current implementation:** Dashboard shows all projects (lines 111-138 in +page.svelte)

**Why limit:** Performance at scale, cleaner UI, encourages use of dedicated views

### Pattern 5: Form Section Reordering
**What:** Place configuration options before input forms to establish context
**When to use:** When configuration affects how input forms behave
**Example:**
```svelte
<!-- Current order -->
<ModeSelector />
<CutInputForm />
<StockInputForm />
<KerfConfig />

<!-- New order -->
<ModeSelector />
<KerfConfig />      <!-- Configuration first -->
<div class="input-grid">
  <StockInputForm />  <!-- Stock (what you have) -->
  <CutInputForm />    <!-- Cuts (what you need) -->
</div>
```

**Rationale:** Kerf affects both stock and cuts, so show it first. Stock (what you have) logically comes before cuts (what you need from it).

### Pattern 6: Loading State with Minimum Duration
**What:** Enforce minimum loading duration for operations that feel too fast
**When to use:** Complex operations that users expect to take time (optimization algorithms)
**Example:**
```typescript
async function handleOptimize() {
  isOptimizing = true;
  const startTime = Date.now();

  try {
    const response = await fetch('/api/cutlist/optimize', {
      method: 'POST',
      body: JSON.stringify({ mode, cuts, stock, kerf })
    });

    // Enforce minimum 2.5 second display
    const elapsed = Date.now() - startTime;
    if (elapsed < 2500) {
      await new Promise(resolve => setTimeout(resolve, 2500 - elapsed));
    }

    result = await response.json();
  } finally {
    isOptimizing = false;
  }
}
```

**Why this pattern:** Prevents jarring instant results that make users question if optimization actually ran. Provides perceived value and professionalism.

### Anti-Patterns to Avoid
- **Hard-coding names in code:** UI-01 requires "Wood Worker" default, but don't hard-code strings. Use constants or server-side defaults.
- **Mixing absolute and fixed positioning:** Pick one positioning strategy for dropdowns. Fixed is better for viewport-level UI.
- **Removing routes without checking references:** Wood Movement Calculator (NAV-03) may have links elsewhere in codebase. Grep before deleting.
- **Changing BOM logic without considering existing saved cut lists:** CUT-35 changes where BOM items load. Ensure existing saved lists still work.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database migrations | Manual SQL scripts | Drizzle Kit migrations | Type safety, rollback support, version tracking |
| Form state persistence | Custom localStorage | SvelteKit form actions | Server-validated, works without JS |
| Fixed positioning calculations | Custom scroll handlers | CSS position: fixed | Browser-optimized, simpler |
| Date formatting | String concatenation | Intl.DateTimeFormat | Locale-aware, handles edge cases |
| User defaults | Null checks everywhere | Schema defaults + runtime fallbacks | Single source of truth |

**Key insight:** This is a polish phase, not a feature phase. Don't over-engineer. Use existing patterns and helpers.

## Common Pitfalls

### Pitfall 1: Schema Migration Without Nullability
**What goes wrong:** Adding non-nullable columns to existing table with data causes migration failure
**Why it happens:** Drizzle/SQLite can't populate values for existing rows
**How to avoid:**
- Make new columns nullable in schema
- Provide runtime defaults in application code
- Optionally add data migration script to backfill values
**Warning signs:** Migration errors mentioning "NOT NULL constraint failed"

### Pitfall 2: Breaking Existing User Sessions
**What goes wrong:** Changing user schema breaks session middleware expecting old shape
**Why it happens:** Session data shape cached, middleware expects certain fields
**How to avoid:**
- Ensure `requireAuth` and `requireAdmin` only use existing fields (id, email, role)
- Add new fields (firstName, lastName) to user type in app.d.ts but make them optional
- Don't use new fields in critical auth paths until after migration
**Warning signs:** 500 errors on all pages after migration, "Cannot read property X of undefined" in auth middleware

### Pitfall 3: Fixed Positioning Z-Index Conflicts
**What goes wrong:** Fixed dropdown appears behind other fixed elements (header, sidebar)
**Why it happens:** Z-index stacking context conflicts
**How to avoid:**
- Establish z-index scale: sidebar (40), header (30), dropdowns (50), modals (60), overlays (70)
- Document z-index values in CSS variables or comments
- Use consistent z-index across components
**Warning signs:** Dropdown appears behind header, user can't interact with menu

### Pitfall 4: Reordering Forms Breaks Existing State
**What goes wrong:** Moving form components breaks reactive bindings
**Why it happens:** Svelte component keys or binding order matters
**How to avoid:**
- Keep `bind:` directives intact when moving components
- Test all form interactions after reordering
- Verify mode switching still works correctly
**Warning signs:** Form inputs not updating, bindings out of sync, console errors

### Pitfall 5: Dashboard Limiting Breaks "Create Project" Flow
**What goes wrong:** Users can't see newly created project because limit is reached
**Why it happens:** Limit applied without considering sort order
**How to avoid:**
- Sort by `createdAt DESC` or `updatedAt DESC`
- New projects appear at top, pushing older ones out
- Redirect to project detail after creation (already implemented)
**Warning signs:** User creates project but doesn't see it on dashboard

### Pitfall 6: BOM Loading Logic Changes Break Existing Imports
**What goes wrong:** Changing target from cuts to stock breaks existing saved cut lists
**Why it happens:** Database has assignedStockId references that become invalid
**How to avoid:**
- CUT-35 changes initial load target, not saved list structure
- Saved lists already have cuts and stock populated
- Only affects new imports from BOM, not viewing existing lists
**Warning signs:** Saved cut lists show empty or incorrect data

### Pitfall 7: Loading Screen Blocks Error Messages
**What goes wrong:** Mandatory 2.5s loading screen prevents showing optimization errors immediately
**Why it happens:** Error occurs before minimum duration elapsed
**How to avoid:**
- Show loading screen during API call
- If error occurs, skip remaining delay and show error immediately
- Use try/catch to handle errors before delay enforcement
**Warning signs:** Users wait 2.5 seconds only to see error message

### Pitfall 8: Removing Routes Without Updating Links
**What goes wrong:** Wood Movement Calculator removed (NAV-03) but links remain in dashboard/sidebar
**Why it happens:** Links scattered across multiple components
**How to avoid:**
- Grep entire codebase for `/calculator` links
- Check Sidebar.svelte nav items
- Check dashboard ToolCard components
- Verify no hardcoded links in markdown/docs
**Warning signs:** 404 errors, broken navigation links

## Code Examples

Verified patterns from current codebase:

### User Display Name with Default
```typescript
// In Header.svelte or UserMenu.svelte
interface User {
  id: string;
  email: string;
  firstName?: string; // Optional after migration
  lastName?: string;  // Optional after migration
  role: 'user' | 'admin';
}

// Display logic
const displayName = $derived(
  user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User'
);
```

### Fixed Dropdown Positioning
```css
/* UserMenu.svelte - Fixed approach */
.user-menu {
  position: relative; /* For toggle button positioning */
}

.user-menu-dropdown {
  position: fixed;
  top: calc(var(--header-height) + 0.25rem);
  right: 1rem;
  z-index: 50;
  width: 12rem;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

### Dashboard Project Limiting
```typescript
// In routes/+page.server.ts
import { requireAuth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
  const user = event.locals.user;

  if (!user) {
    return {
      isAuthenticated: false,
      projects: []
    };
  }

  // Fetch only 6 most recent projects
  const recentProjects = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    orderBy: [desc(projects.createdAt)],
    limit: 6
  });

  return {
    isAuthenticated: true,
    projects: recentProjects
  };
};
```

### Sidebar Navigation Restructure
```typescript
// In Sidebar.svelte
const navSections = [
  {
    label: 'NAVIGATION',
    items: [
      {
        label: 'Dashboard',
        href: '/',
        icon: 'home',
        description: 'Overview & recent projects'
      },
      {
        label: 'Projects',
        href: '/projects',
        icon: 'folder',
        description: 'View all projects'
      },
      // Note: "View all BOMs" and "View all Cut Lists" need new routes
    ]
  },
  {
    label: 'TOOLS',
    items: [
      {
        label: 'Create BOM',
        href: '/bom/new',
        icon: 'clipboard',
        description: 'New bill of materials'
      },
      {
        label: 'Create Cut List',
        href: '/cutlist',
        icon: 'scissors',
        description: 'New cut optimizer'
      }
    ]
  }
];
```

### Loading Screen with Minimum Duration
```typescript
// In cutlist/+page.svelte
async function handleOptimize() {
  isOptimizing = true;
  error = null;
  result = null;

  const startTime = Date.now();

  try {
    const response = await fetch('/api/cutlist/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, cuts, stock, kerf })
    });

    if (!response.ok) {
      // Error occurred - skip delay, show immediately
      const data = await response.json();
      error = data.error || 'Optimization failed';
      isOptimizing = false;
      return;
    }

    // Success - enforce minimum 2.5 second loading display
    const optimizationResult = await response.json();
    const elapsed = Date.now() - startTime;

    if (elapsed < 2500) {
      await new Promise(resolve => setTimeout(resolve, 2500 - elapsed));
    }

    result = optimizationResult;
  } catch (e) {
    // Network error - show immediately
    error = e instanceof Error ? e.message : 'An error occurred';
  } finally {
    isOptimizing = false;
  }
}
```

### BOM Loading into Stock (Not Cuts)
```typescript
// In cutlist/from-bom/+page.server.ts action
// Current implementation loads into cuts array
// Change to load into stock array

export const actions: Actions = {
  loadFromBoms: async ({ request, locals }) => {
    const user = requireAuth(locals);
    const data = await request.formData();
    const bomIds = data.getAll('selectedBoms') as string[];

    // ... fetch BOM items with lumber filter

    // Current (wrong): loads as cuts
    // const cuts = lumberItems.map(item => ({ ... }));

    // Correct: loads as stock (available material)
    const stock = lumberItems.map(item => ({
      id: crypto.randomUUID(),
      length: item.length,
      width: item.width, // null for linear mode
      quantity: item.quantity,
      label: item.name,
      position: index
    }));

    return {
      stock, // Return as stock, not cuts
      mode: detectMode(lumberItems)
    };
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Email-only user identity | First/Last name fields | Phase 22 (UI-01) | More personal UX |
| Flat navigation | Hierarchical sections | Phase 22 (NAV-01) | Clearer information architecture |
| All projects on dashboard | 6 most recent | Phase 22 (NAV-04) | Performance, focus |
| Cuts before stock | Stock before cuts | Phase 22 (CUT-34) | Logical workflow |
| Instant optimization | Minimum 2.5s loading | Phase 22 (CUT-36) | Perceived quality |
| Absolute dropdown positioning | Fixed viewport positioning | Phase 22 (UI-03) | Scroll behavior fix |

**Deprecated/outdated:**
- Wood Movement Calculator tool - Removed in NAV-03 (never implemented, placeholder only)
- Email display in dropdown - Replaced with firstName display in UI-02
- Unlimited dashboard projects - Replaced with limit of 6 in NAV-04

## Open Questions

Things that couldn't be fully resolved:

1. **"View All BOMs" and "View All Cut Lists" Routes**
   - What we know: NAV-01 requires these routes
   - What's unclear: Do these need new list views, or do they navigate to existing routes?
   - Recommendation: Create dedicated list views at `/boms` and `/cutlists` showing all user's items with filters/search. Similar pattern to `/projects` page.

2. **Results Page vs In-Place Results**
   - What we know: CUT-37 requires new results page with Go Back and Save buttons
   - What's unclear: Does "results page" mean new route `/cutlist/results`, or just a UI state change on `/cutlist`?
   - Recommendation: New route `/cutlist/results` with results passed via goto() state (similar to from-bom flow). Cleaner separation, enables sharing result URLs.

3. **First/Last Name Defaults**
   - What we know: UI-01 says "default to 'Wood' and 'Worker' if blank"
   - What's unclear: Apply defaults at schema level, runtime level, or during display?
   - Recommendation: Runtime display defaults (most flexible). Schema remains nullable, display logic provides "Wood Worker" fallback.

4. **Saved Cut List Viewing Bug**
   - What we know: CUT-39 says "fix bug where saved Cut Lists are not viewable"
   - What's unclear: What is the exact bug? Route doesn't exist? Data doesn't load? UI broken?
   - Investigation needed: Test `/cutlist/[id]` route with saved cut list. Current code (cutlist/[id]/+page.server.ts) looks correct. May be frontend rendering issue.

5. **Admin Users Link Location**
   - What we know: Quick task 001 added admin route to user dropdown
   - What's unclear: Does this replace or supplement sidebar admin links?
   - Recommendation: Keep in dropdown (always accessible). Remove from sidebar if sidebar is already crowded after restructure.

## Sources

### Primary (HIGH confidence)
- **Current Codebase** - Direct examination of implementation
  - `src/lib/components/Header.svelte` - Header structure and positioning
  - `src/lib/components/Sidebar.svelte` - Navigation items and structure
  - `src/lib/components/UserMenu.svelte` - Dropdown implementation
  - `src/routes/+page.svelte` - Dashboard layout and project display
  - `src/routes/cutlist/+page.svelte` - Cut optimizer UI and flow
  - `src/routes/cutlist/from-bom/+page.svelte` - BOM loading implementation
  - `src/routes/cutlist/[id]/+page.svelte` - Saved cut list view
  - `src/lib/server/schema.ts` - Database schema (users table)
  - `.planning/milestones/v3.0-ROADMAP.md` - Requirements UI-01 through CUT-39
  - `.planning/STATE.md` - Phase context and accumulated decisions

### Secondary (MEDIUM confidence)
- **Svelte 5 Documentation** - Runes syntax ($state, $props, $derived)
- **Drizzle ORM Documentation** - Migration patterns for adding nullable columns
- **CSS Positioning Spec** - Fixed vs absolute vs sticky positioning behavior

### Tertiary (LOW confidence)
- None - All findings based on direct codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use, no new dependencies
- Architecture: HIGH - Patterns based on existing codebase inspection
- Pitfalls: HIGH - Based on actual implementation details and SQLite constraints
- Open questions: MEDIUM - Some requirements need clarification, but paths forward are clear

**Research date:** 2026-01-30
**Valid until:** 60 days (stable refinement phase, no fast-moving dependencies)

**Key takeaways:**
1. Schema migration required first (firstName/lastName columns)
2. Four largely independent plan areas can be tackled in parallel
3. No new external dependencies needed
4. Several open questions need resolution during planning
5. Current implementation is solid - this is polish, not rebuild
