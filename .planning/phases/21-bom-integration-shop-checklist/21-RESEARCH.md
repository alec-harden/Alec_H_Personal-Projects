# Phase 21: BOM Integration & Shop Checklist - Research

**Researched:** 2026-01-30
**Domain:** Full-stack SvelteKit form handling, project selection UI, checklist state management, drag-drop interactions
**Confidence:** HIGH

## Summary

This phase integrates the existing Cut List Optimizer with the BOM system by allowing users to select projects, multi-select BOMs, auto-filter lumber items, and pre-populate cuts from BOM dimensions. Additionally, it implements a shop checklist feature for tracking cut completion with persistent state.

The standard approach uses **native SvelteKit form patterns** (formData.getAll() for multi-select), **Drizzle relational queries** to load nested project/BOM/item data, **svelte-dnd-action** (already installed) for drag-drop material assignment, and **database persistence** for checklist state (avoiding localStorage due to cross-device and data integrity requirements).

Key architectural patterns include **optimistic UI updates** for checklist interactions, **inline editing** for manual override inputs, and **multi-stage forms** for BOM selection flow. The existing codebase already demonstrates these patterns in BOMItem.svelte (inline dimension editing) and SaveCutListModal.svelte (project selection UI).

**Primary recommendation:** Use server-side database persistence for checklist completion state, implement multi-select checkboxes with native form handling (no external library needed), and extend existing inline editing patterns for manual override of cut placement.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SvelteKit | 2.49.1 | Full-stack framework | Already in use, provides form actions and server routes |
| Drizzle ORM | 0.45.1 | Database queries | Already in use, supports relational queries with v2 API |
| Svelte 5 | 5.45.6 | UI framework | Already in use, runes ($state, $derived, $effect) for reactive state |
| svelte-dnd-action | 0.9.69 | Drag-drop library | Already installed, production-ready, Svelte 5 compatible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | N/A | Multi-select checkboxes | Native HTML + formData.getAll() is sufficient |
| N/A | N/A | Checklist state | Database persistence (cutListCuts table) instead of external state library |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Database persistence | localStorage | localStorage doesn't sync across devices, loses data on clear, not suitable for critical checklist state |
| Native multi-select | svelte-multiselect library | External dependency adds 50KB+ for features not needed (autocomplete, tagging) |
| svelte-dnd-action | @thisux/sveltednd | Newer library for Svelte 5 but less mature, svelte-dnd-action is production-proven with 0.9.69 supporting Svelte 5 |

**Installation:**
```bash
# All dependencies already installed - no new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/routes/
├── cutlist/
│   ├── +page.svelte              # Cut list optimizer (exists)
│   ├── +page.server.ts            # Modify: load projects with BOMs
│   └── from-bom/
│       ├── +page.svelte           # NEW: BOM selection flow
│       └── +page.server.ts        # NEW: load user projects with BOMs
src/lib/components/cutlist/
├── BomSelector.svelte             # NEW: Multi-select BOM component
├── ShopChecklist.svelte           # NEW: Checklist view with completion tracking
└── ManualPlacement.svelte         # NEW: Override cut placement UI
src/lib/server/
└── schema.ts                      # Modify: add completion state to cutListCuts
```

### Pattern 1: Multi-Select Checkboxes with formData.getAll()
**What:** Native HTML checkboxes with SvelteKit form action handling
**When to use:** Selecting multiple BOMs from a project
**Example:**
```typescript
// Source: https://scottspence.com/posts/handling-multi-select-form-data
// Client-side: BomSelector.svelte
<form method="POST" use:enhance>
  {#each boms as bom (bom.id)}
    <label>
      <input type="checkbox" name="selectedBoms" value={bom.id} />
      {bom.name}
    </label>
  {/each}
  <button type="submit">Load Cuts</button>
</form>

// Server-side: +page.server.ts (form action)
export const actions = {
  loadFromBoms: async ({ request }) => {
    const formData = await request.formData();
    // CRITICAL: Use getAll() not get() for multiple checkboxes
    const selectedBomIds = formData.getAll('selectedBoms') as string[];

    // Query BOM items with lumber category
    const items = await db.query.bomItems.findMany({
      where: and(
        inArray(bomItems.bomId, selectedBomIds),
        eq(bomItems.category, 'lumber')
      )
    });

    return { items };
  }
};
```

### Pattern 2: Drizzle Relational Queries for Nested Data
**What:** Load projects with nested BOMs and items in single query
**When to use:** BOM selection page needs projects → BOMs → item counts
**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/rqb-v2
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, locals.user.id),
    with: {
      boms: {
        with: {
          items: {
            where: eq(bomItems.category, 'lumber'),
            columns: { id: true, length: true, width: true, height: true }
          }
        }
      }
    },
    orderBy: desc(projects.updatedAt)
  });

  return { projects: userProjects };
};
```

### Pattern 3: Optimistic UI Updates for Checklist
**What:** Update UI immediately, persist to database in background
**When to use:** Marking cuts as complete in shop checklist
**Example:**
```typescript
// Source: https://github.com/paoloricciuti/optimistikit
// ShopChecklist.svelte
let cuts = $state<Cut[]>(data.cuts);

async function toggleComplete(cutId: string) {
  // Optimistic update
  cuts = cuts.map(c =>
    c.id === cutId
      ? { ...c, completed: !c.completed }
      : c
  );

  // Persist to server (no await - fire and forget)
  fetch(`/api/cutlist/cuts/${cutId}/complete`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      completed: cuts.find(c => c.id === cutId)?.completed
    })
  }).catch(() => {
    // Revert on failure
    cuts = data.cuts;
  });
}
```

### Pattern 4: Inline Editing for Manual Override
**What:** Click to edit pattern for numeric input fields
**When to use:** Manual override of cut placement in optimization results
**Example:**
```typescript
// Source: Existing BOMItem.svelte (lines 18-70)
// ManualPlacement.svelte
let editingCutId = $state<string | null>(null);
let positionInput = $state('');

function startEdit(cutId: string, currentPos: number) {
  editingCutId = cutId;
  positionInput = currentPos.toString();
  requestAnimationFrame(() => inputRef?.focus());
}

function commitEdit(cutId: string) {
  const parsed = parseFloat(positionInput);
  if (!isNaN(parsed) && parsed >= 0) {
    // Update cut position
    updateCutPosition(cutId, parsed);
  }
  editingCutId = null;
}

// Usage in template
{#if editingCutId === cut.id}
  <input
    type="number"
    bind:value={positionInput}
    onblur={() => commitEdit(cut.id)}
    onkeydown={(e) => {
      if (e.key === 'Enter') commitEdit(cut.id);
      if (e.key === 'Escape') editingCutId = null;
    }}
  />
{:else}
  <button onclick={() => startEdit(cut.id, cut.position)}>
    {cut.position}"
  </button>
{/if}
```

### Pattern 5: Drag-Drop with svelte-dnd-action
**What:** Drag stock materials and drop onto cuts to assign
**When to use:** Manual assignment of which stock piece to cut from
**Example:**
```typescript
// Source: https://github.com/isaacHagoel/svelte-dnd-action
<script>
  import { dndzone } from 'svelte-dnd-action';

  let stockItems = $state(data.stock);
  let assignedCuts = $state(data.cuts);

  function handleDrop(e: CustomEvent) {
    const { items, info } = e.detail;

    if (info.trigger === 'droppedIntoZone') {
      // Stock item dropped onto cut zone
      const stockId = items[0].id;
      const cutId = e.target.dataset.cutId;

      assignStockToCut(stockId, cutId);
    }
  }
</script>

<!-- Drop zone for each cut -->
{#each assignedCuts as cut (cut.id)}
  <div
    class="cut-drop-zone"
    data-cut-id={cut.id}
    use:dndzone={{ items: cut.assignedStock, dropTargetStyle: {} }}
    on:consider={handleDrop}
    on:finalize={handleDrop}
  >
    <div class="cut-info">Cut: {cut.length}" x {cut.width}"</div>
    {#if cut.assignedStock}
      <div class="assigned-stock">{cut.assignedStock.label}</div>
    {:else}
      <div class="drop-hint">Drop stock here</div>
    {/if}
  </div>
{/each}
```

### Anti-Patterns to Avoid
- **Using localStorage for checklist state:** Data doesn't sync across devices, user loses progress if they clear browser data. Use database persistence.
- **Object.fromEntries() for multi-select:** Only captures last selected item. Use formData.getAll() directly.
- **Blocking UI during database writes:** Use optimistic updates so checklist feels instant, persist in background.
- **External multi-select library:** Adds unnecessary bundle size for simple checkbox list. Native HTML is sufficient.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-drop interaction | Custom mouse/touch event handlers | svelte-dnd-action | Handles accessibility, keyboard nav, touch devices, scrolling zones, edge cases |
| Multi-select checkboxes | Custom checkbox state management | Native HTML + formData.getAll() | Built-in browser behavior, form submission, accessibility |
| Inline editing | Custom edit mode state | Existing BOMItem.svelte pattern | Already proven in codebase, handles focus, blur, keyboard events |
| Optimistic updates | Manual state sync logic | Svelte 5 $state with try-catch revert | Simple pattern, no race conditions if kept client-side first |
| Lumber filtering | Manual category checking | Drizzle where() clauses | Type-safe, SQL-optimized, handles null dimensions correctly |

**Key insight:** The codebase already contains proven patterns for most features needed. Extend existing components (BOMItem inline editing, SaveCutListModal project selection) rather than creating from scratch.

## Common Pitfalls

### Pitfall 1: formData.get() vs formData.getAll() for Multi-Select
**What goes wrong:** Using `Object.fromEntries(await request.formData())` or `formData.get('selectedBoms')` only returns the LAST checked item, not an array of all selections.
**Why it happens:** Multiple checkboxes with same name create multiple form entries. `get()` returns only the last value.
**How to avoid:** Use `formData.getAll('selectedBoms')` which returns an array of all checked values.
**Warning signs:** Multi-select form only processes one item, user selects 3 BOMs but only last one loads.

### Pitfall 2: Filtering Lumber Items with Incomplete Dimensions
**What goes wrong:** BOM items in 'lumber' category may have null/undefined dimensions (user hasn't filled them yet). Filtering only by category can populate cut list with invalid cuts.
**Why it happens:** Schema allows nullable dimensions (length, width, height) for lumber items.
**How to avoid:** Filter for lumber category AND non-null required dimensions:
```typescript
// BAD: Only checks category
where: eq(bomItems.category, 'lumber')

// GOOD: Checks category AND required dimensions
where: and(
  eq(bomItems.category, 'lumber'),
  isNotNull(bomItems.length),
  mode === 'sheet' ? isNotNull(bomItems.width) : undefined
)
```
**Warning signs:** Cut list shows "0 x 0" dimensions, optimization fails with "invalid cut dimensions" error.

### Pitfall 3: Checklist State Persistence Timing
**What goes wrong:** Using optimistic updates with `onblur` or `onclick` can lose state if user closes browser/tab before request completes.
**Why it happens:** Fire-and-forget fetch requests may not complete if page unloads.
**How to avoid:** For critical state (completion progress), use `navigator.sendBeacon()` on page unload OR debounce updates and track pending state.
**Warning signs:** User marks 5 cuts complete, refreshes page, only 3 are saved.

### Pitfall 4: Drag-Drop Without Unique IDs
**What goes wrong:** svelte-dnd-action requires each draggable item to have unique `id` property. Using array index or non-unique keys breaks drag behavior.
**Why it happens:** Library uses id for tracking during drag operations.
**How to avoid:** Ensure all draggable items have unique `id: string` property. Use crypto.randomUUID() or database IDs.
**Warning signs:** Dragging moves wrong item, drop fails silently, console errors about duplicate keys.

### Pitfall 5: Manual Override Without Validation Bounds
**What goes wrong:** User can input negative positions or positions beyond stock length, breaking visualization or creating invalid cut plans.
**Why it happens:** Inline editing pattern accepts any number input without bounds checking.
**How to avoid:** Validate override values against stock dimensions before committing:
```typescript
function commitEdit(cutId: string, newPosition: number) {
  const stock = findStockForCut(cutId);
  const cut = findCut(cutId);

  // Validate: position + cut length must fit in stock
  if (newPosition < 0 || newPosition + cut.length > stock.length) {
    // Revert to original
    return;
  }

  updateCutPosition(cutId, newPosition);
}
```
**Warning signs:** Cut diagram shows pieces hanging off edge, negative positions, overlapping cuts after manual override.

### Pitfall 6: Drizzle Relations v1 vs v2 Syntax
**What goes wrong:** Using old relational query syntax from v1 fails with current Drizzle version (0.45.1).
**Why it happens:** Drizzle Relations v2 changed API significantly in 2024-2025.
**How to avoid:** Use v2 syntax with `with:` for nested relations, not `include:` or junction table manual queries.
**Warning signs:** TypeScript errors on relational queries, "Property 'include' does not exist" errors.

## Code Examples

Verified patterns from official sources:

### BOM Selection Flow (Multi-Page Pattern)
```typescript
// Source: Existing SaveCutListModal.svelte + formData.getAll() pattern
// Route: /cutlist/from-bom/+page.svelte

<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  let { data }: { data: PageData } = $props();
  let selectedProjectId = $state<string | null>(null);
  let selectedBomIds = $state<Set<string>>(new Set());

  function toggleBom(bomId: string) {
    if (selectedBomIds.has(bomId)) {
      selectedBomIds.delete(bomId);
    } else {
      selectedBomIds.add(bomId);
    }
    selectedBomIds = selectedBomIds; // Trigger reactivity
  }
</script>

<!-- Step 1: Select Project -->
{#if !selectedProjectId}
  <div class="project-selection">
    <h2>Select a Project</h2>
    {#each data.projects as project}
      <button onclick={() => selectedProjectId = project.id}>
        {project.name}
      </button>
    {/each}
  </div>
{:else}
  <!-- Step 2: Multi-Select BOMs -->
  <form method="POST" action="?/loadFromBoms" use:enhance>
    <input type="hidden" name="projectId" value={selectedProjectId} />

    <h2>Select BOMs to Load</h2>
    {#each data.projects.find(p => p.id === selectedProjectId).boms as bom}
      <label class="bom-checkbox">
        <input
          type="checkbox"
          name="selectedBoms"
          value={bom.id}
          checked={selectedBomIds.has(bom.id)}
          onchange={() => toggleBom(bom.id)}
        />
        <span>{bom.name}</span>
        <span class="item-count">
          ({bom.items.filter(i => i.length && i.width).length} lumber items)
        </span>
      </label>
    {/each}

    <button type="submit" disabled={selectedBomIds.size === 0}>
      Load {selectedBomIds.size} BOM{selectedBomIds.size !== 1 ? 's' : ''}
    </button>
  </form>
{/if}
```

### Shop Checklist with Progress Indicator
```typescript
// Source: Optimistic update pattern + existing schema
// Component: ShopChecklist.svelte

<script lang="ts">
  import type { Cut } from '$lib/types/cutlist';

  interface ChecklistCut extends Cut {
    completed: boolean;
  }

  interface Props {
    cuts: ChecklistCut[];
    cutListId: string;
  }

  let { cuts: initialCuts, cutListId }: Props = $props();
  let cuts = $state<ChecklistCut[]>(initialCuts);

  // Derived progress
  const progress = $derived({
    total: cuts.length,
    completed: cuts.filter(c => c.completed).length,
    percentage: Math.round((cuts.filter(c => c.completed).length / cuts.length) * 100)
  });

  async function toggleCutComplete(cutId: string) {
    // Find cut and toggle
    const cutIndex = cuts.findIndex(c => c.id === cutId);
    if (cutIndex === -1) return;

    const newCompleted = !cuts[cutIndex].completed;

    // Optimistic update
    cuts[cutIndex] = { ...cuts[cutIndex], completed: newCompleted };

    // Persist to database
    try {
      await fetch(`/api/cutlist/${cutListId}/cuts/${cutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      });
    } catch (error) {
      // Revert on error
      cuts[cutIndex] = { ...cuts[cutIndex], completed: !newCompleted };
      console.error('Failed to save completion state:', error);
    }
  }
</script>

<!-- Progress Indicator -->
<div class="progress-header">
  <h3>Shop Checklist</h3>
  <div class="progress-bar">
    <div class="progress-fill" style="width: {progress.percentage}%"></div>
  </div>
  <p class="progress-text">
    {progress.completed} of {progress.total} cuts complete ({progress.percentage}%)
  </p>
</div>

<!-- Checklist Items -->
<ul class="checklist">
  {#each cuts as cut (cut.id)}
    <li class="checklist-item" class:completed={cut.completed}>
      <label>
        <input
          type="checkbox"
          checked={cut.completed}
          onchange={() => toggleCutComplete(cut.id)}
        />
        <span class="cut-label">{cut.label || `Cut ${cuts.indexOf(cut) + 1}`}</span>
        <span class="cut-dimensions">
          {cut.length}"{cut.width ? ` x ${cut.width}"` : ''}
        </span>
        {#if cut.quantity > 1}
          <span class="cut-quantity">x{cut.quantity}</span>
        {/if}
      </label>
    </li>
  {/each}
</ul>

<style>
  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-paper-dark);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--color-walnut);
    transition: width 0.3s ease;
  }

  .checklist-item.completed {
    opacity: 0.6;
    text-decoration: line-through;
  }
</style>
```

### Database Schema Extension for Completion State
```typescript
// Source: Existing schema.ts + SQLite boolean pattern
// Add to cutListCuts table definition:

export const cutListCuts = sqliteTable('cut_list_cuts', {
  id: text('id').primaryKey(),
  cutListId: text('cut_list_id')
    .notNull()
    .references(() => cutLists.id, { onDelete: 'cascade' }),
  length: real('length').notNull(),
  width: real('width'),
  quantity: integer('quantity').notNull().default(1),
  label: text('label'),
  position: integer('position').notNull(),
  // NEW: Checklist completion tracking
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at', { mode: 'timestamp' })
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage for state | Database persistence | 2024-2025 | Better cross-device sync, no data loss on browser clear |
| External multi-select libs | Native formData.getAll() | SvelteKit 1.0+ (2022) | Smaller bundles, native browser behavior, better accessibility |
| Drizzle Relations v1 | Drizzle Relations v2 | Drizzle 0.30+ (2024) | Simpler many-to-many queries, `with:` instead of junction tables |
| Custom drag-drop logic | svelte-dnd-action | Library stable 0.9.x (2021-2025) | Production-ready, Svelte 5 compatible as of 0.9.46 |
| Class-based Svelte | Svelte 5 runes | Svelte 5.0 (2024) | `$state`, `$derived`, `$effect` replace stores and reactive declarations |

**Deprecated/outdated:**
- **Svelte stores in components:** Replaced by Svelte 5 runes ($state, $derived)
- **Drizzle v1 relations API:** Use v2 with `with:` keyword for nested queries
- **localStorage for critical data:** Use database persistence for checklist state, project data

## Open Questions

Things that couldn't be fully resolved:

1. **Checklist completion state scope**
   - What we know: Schema supports per-cut completion tracking with timestamp
   - What's unclear: Should completion state reset when cut list is re-optimized? Or persist across optimization runs?
   - Recommendation: Persist completion state even after re-optimization. If user marks "Table leg 1" complete, it stays complete even if they add more cuts and re-optimize. Clear completion only on explicit user action.

2. **Manual override conflict resolution**
   - What we know: User can drag-drop stock assignment OR manually input cut positions
   - What's unclear: What happens if manual position creates overlap with algorithm-placed cuts?
   - Recommendation: When user manually overrides, flag affected cuts with warning icon. Provide "Reset to algorithm" button to revert manual overrides. Don't auto-resolve conflicts.

3. **BOM selection edge cases**
   - What we know: User can multi-select BOMs from one project
   - What's unclear: Should user be able to select BOMs from MULTIPLE projects in one cut list?
   - Recommendation: Start with single-project limitation (simpler UX, clearer context). Can extend to multi-project in future phase if users request it.

## Sources

### Primary (HIGH confidence)
- Drizzle ORM Relations v2 docs: https://orm.drizzle.team/docs/rqb-v2
- svelte-dnd-action GitHub: https://github.com/isaacHagoel/svelte-dnd-action
- SvelteKit formData.getAll() pattern: https://scottspence.com/posts/handling-multi-select-form-data
- Existing codebase patterns: BOMItem.svelte (inline edit), SaveCutListModal.svelte (project selection), schema.ts (database structure)

### Secondary (MEDIUM confidence)
- Optimistic updates in SvelteKit: https://github.com/paoloricciuti/optimistikit (pattern reference, library not needed)
- Inline editing UX: https://www.patternfly.org/components/inline-edit/design-guidelines/
- Drag-drop UX best practices: https://www.nngroup.com/articles/drag-drop/

### Tertiary (LOW confidence)
- localStorage vs database persistence general guidance (verified with existing project requirements)
- Manual override patterns for algorithmic placement (adapted from Figma/design tool patterns)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and proven in codebase
- Architecture: HIGH - Extends existing proven patterns (BOMItem, SaveCutListModal, schema)
- Pitfalls: MEDIUM - Some pitfalls are hypothetical based on common SvelteKit/Drizzle issues, not yet encountered in this codebase
- Drag-drop: MEDIUM - svelte-dnd-action is proven library but not yet used in this codebase, implementation details need validation

**Research date:** 2026-01-30
**Valid until:** 30 days (2026-03-01) - Stack is stable, SvelteKit/Drizzle patterns unlikely to change
