# Phase 18: Cut Optimizer Foundation - Research

**Researched:** 2026-01-29
**Domain:** Cut list optimization for woodworking (1D linear and 2D sheet cutting)
**Confidence:** MEDIUM

## Summary

Cut optimization solves the "cutting stock problem" - an NP-hard computational problem that determines optimal material purchases and cutting patterns to minimize waste. The domain has two distinct modes: 1D linear optimization (for lumber, pipes, bars) and 2D sheet optimization (for plywood, panels). This phase focuses on foundation/scaffolding with placeholder algorithms.

Research identified three JavaScript/TypeScript libraries suitable for this problem space, established UI/UX patterns from existing woodworking tools, and common pitfalls in cutting optimizer implementations. The standard approach uses greedy or first-fit-decreasing algorithms for fast results, with kerf (blade width) compensation as a critical feature.

**Primary recommendation:** Use a modular architecture with separate 1D/2D algorithm modules (placeholder implementations initially), Svelte 5 `$state` runes for managing dynamic cut lists and stock arrays, and clear result visualization showing waste percentage and cut-to-stock mappings. Follow established woodworking tool patterns for kerf input and validation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| stock-cutting | Latest | 1D cutting stock problem solver | TypeScript-native, works in Node.js and browser, active development, clean API |
| bin-packing | Latest | 2D rectangle bin packing | Mature (2011), binary tree algorithm, widely used for 2D layout problems |
| Svelte 5 runes | 5.x | State management for dynamic arrays | Project standard, `$state` handles deep reactivity for arrays/objects |
| Drizzle ORM | Current | Database persistence | Project standard for saving cut lists |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| genetic-cutting | Latest | Multi-dimensional cutting (1D, 1.5D, 2D) | If unified algorithm needed across modes |
| stock-cutter | 1.0 | Simple greedy 1D optimizer | Lightweight alternative, single-file implementation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| stock-cutting | Custom greedy algorithm | Custom is simpler but misses edge cases (kerf handling, waste minimization) |
| bin-packing | Custom 2D packing | 2D packing is complex; binary tree approach handles many cases well |
| Svelte stores | `$state` runes in .svelte.js | Stores work but runes are Svelte 5 standard, simpler API |

**Installation:**
```bash
# For phase 19/20 (actual algorithm implementation)
npm install stock-cutting
npm install bin-packing

# Phase 18 uses placeholder algorithms (no external dependencies needed yet)
```

## Architecture Patterns

### Recommended Project Structure
```
src/routes/cutlist/
├── +page.svelte              # Main cut optimizer page
├── +page.ts                  # Load data (saved cut lists if auth)
src/lib/components/cutlist/
├── ModeSelector.svelte       # Linear vs Sheet mode toggle
├── CutInputForm.svelte       # Required cuts input (dynamic array)
├── StockInputForm.svelte     # Available stock input (dynamic array)
├── KerfConfig.svelte         # Kerf/blade width configuration
├── OptimizationResults.svelte # Results display with waste % and mapping
└── CutListActions.svelte     # Save/Clear buttons
src/lib/server/
├── cutOptimizer1D.ts         # Placeholder 1D algorithm (phase 18)
├── cutOptimizer2D.ts         # Placeholder 2D algorithm (phase 18)
└── schema.ts                 # Add cutLists table
```

### Pattern 1: Mode-Based Component Switching
**What:** Single page with dynamic component rendering based on selected mode (Linear/Sheet)
**When to use:** When two modes share similar workflow but different inputs/outputs
**Example:**
```typescript
// Source: Established pattern from BOM tool (choose/wizard/result views)
type OptimizationMode = 'linear' | 'sheet';
let mode = $state<OptimizationMode>('linear');

// Conditional rendering
{#if mode === 'linear'}
  <CutInputForm1D />
  <StockInputForm1D />
{:else}
  <CutInputForm2D />
  <StockInputForm2D />
{/if}
```

### Pattern 2: Dynamic Array Management with $state
**What:** Use Svelte 5 `$state` rune for managing arrays of cuts and stock
**When to use:** Form inputs with add/remove functionality
**Example:**
```typescript
// Source: https://svelte.dev/docs/svelte/$state
interface Cut {
  id: string;
  length: number;
  quantity: number;
}

let cuts = $state<Cut[]>([]);

function addCut() {
  cuts.push({ id: crypto.randomUUID(), length: 0, quantity: 1 });
}

function removeCut(id: string) {
  cuts = cuts.filter(c => c.id !== id);
}

// Svelte 5: Direct mutation triggers reactivity
// No reassignment needed for .push(), unlike Svelte 4
```

### Pattern 3: Kerf-Aware Validation
**What:** Validate that cuts + kerf fit within stock dimensions
**When to use:** Before running optimization algorithm
**Example:**
```typescript
// Source: https://www.trade-schools.net/tools/cut-list-optimizer
function validateCuts(cuts: Cut[], stock: Stock, kerf: number): string | null {
  const maxStockLength = Math.max(...stock.map(s => s.length));

  for (const cut of cuts) {
    // Cut length + one kerf (material removed by blade)
    const requiredLength = cut.length + kerf;

    if (requiredLength > maxStockLength) {
      return `Cut ${cut.length}" + kerf ${kerf}" = ${requiredLength}" exceeds max stock ${maxStockLength}"`;
    }
  }

  return null; // Valid
}
```

### Pattern 4: Results Display with Waste Percentage
**What:** Show optimization results with clear waste metrics and visual layout
**When to use:** Displaying cutting plan to user
**Example:**
```typescript
// Source: https://cutlistevo.com/articles/best-cutting-optimization-software.html
interface OptimizationResult {
  plans: CuttingPlan[];
  totalWaste: number;      // inches or square inches
  wastePercentage: number; // 0-100
  totalMaterialUsed: number;
}

interface CuttingPlan {
  stockId: string;
  stockLength: number;
  cuts: { cutId: string; length: number; position: number; }[];
  remainderLength: number;
}

// Display: "Waste: 15.2% (45.6 inches of 300 inches total)"
```

### Anti-Patterns to Avoid
- **Global kerf application:** Don't add trailing kerf to final cut on each stock piece - wastes material unnecessarily
- **Ignoring fractional inches:** Woodworking uses fractions (1/8", 1/16") - support decimal or fraction input, store as decimal
- **Reassigning arrays for reactivity:** Svelte 5 doesn't need `cuts = [...cuts, newCut]` - use `cuts.push(newCut)` directly
- **Mixing imperial/metric without conversion:** Always store in single unit system, display in user preference

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 1D cutting stock optimization | Custom greedy first-fit | `stock-cutting` library | NP-hard problem with exponential worst-case runtime; library handles edge cases (kerf, waste minimization, multiple stock lengths) |
| 2D rectangle bin packing | Custom rectangle packing | `bin-packing` library | Binary tree approach handles rotation, guillotine cuts, and space optimization; easy to get wrong |
| Unique ID generation for cuts | `Date.now()` or counters | `crypto.randomUUID()` | Browser-native, no collisions, works offline |
| Fraction parsing ("1 1/2"") | Regex + manual parsing | Fraction library or store decimals only | Edge cases: mixed numbers, improper fractions, precision errors |

**Key insight:** Cutting stock is an NP-hard problem studied extensively in operations research. Existing algorithms (first-fit-decreasing, best-fit-decreasing, genetic algorithms) have been optimized over decades. Simple greedy approaches miss important optimizations and edge cases.

## Common Pitfalls

### Pitfall 1: Forgetting Kerf on Interior Cuts
**What goes wrong:** Algorithm doesn't account for blade width between cuts, resulting in pieces that are too short in reality
**Why it happens:** Kerf seems like a simple subtraction, but it applies *per cut*, not per piece
**How to avoid:**
- Kerf applies between pieces: if cutting 2 pieces from 1 stock, you make 2 cuts (initial + between), so subtract 2× kerf
- Final piece on stock doesn't need trailing kerf
- Formula: `usedLength = sum(cutLengths) + (numCuts - 1) * kerf`
**Warning signs:** User reports pieces are consistently short by 1/8" or blade width

### Pitfall 2: Not Validating Stock Length vs Cut Length + Kerf
**What goes wrong:** Optimization runs but produces invalid plans (cuts that don't fit in stock)
**Why it happens:** Validation only checks cut length, forgets to add kerf to required length
**How to avoid:** Validate `cutLength + kerf <= stockLength` before optimization runs
**Warning signs:** Results show cuts assigned to stock that can't physically fit them

### Pitfall 3: Displaying Results Without Context
**What goes wrong:** User sees "3 cuts from stock 1" but doesn't know what stock 1 is or how much waste
**Why it happens:** Results focus on algorithm output, not user comprehension
**How to avoid:**
- Always show stock dimensions alongside cut assignments
- Display waste as percentage AND absolute measurement
- Visual representation helps (bar chart showing cuts on stock)
**Warning signs:** User asks "which board do I cut first?" or "is this good?"

### Pitfall 4: Treating All Waste as Equal
**What goes wrong:** Algorithm minimizes total waste but produces many small unusable remnants
**Why it happens:** Some cutters prioritize total waste over practical waste (usable remnants)
**How to avoid:**
- Consider remnants above certain threshold (e.g., 12") as "usable" - don't count as waste
- Some algorithms support "reusable remnant" thresholds
- For phase 18 placeholder: just minimize total waste
**Warning signs:** User has lots of 4" scraps that aren't useful

### Pitfall 5: Integer vs Float Precision Errors
**What goes wrong:** Cutting stock algorithms expect integers, but inches use decimals (1.5", 2.75")
**Why it happens:** Academic literature often assumes integer units; JavaScript uses floating point
**How to avoid:**
- Store dimensions in smallest unit as integers (1/16" increments = multiply by 16)
- Or use decimals throughout and round final results appropriately
- Be consistent across inputs and outputs
**Warning signs:** 48.00000001 appears in results, or comparisons fail due to float precision

### Pitfall 6: Mode Confusion (1D vs 2D Inputs)
**What goes wrong:** User enters 2D dimensions (length × width) in 1D mode, gets confusing results
**Why it happens:** Modes require different input structures; UI doesn't make this clear
**How to avoid:**
- Clear labeling: "Linear Mode: Length only" vs "Sheet Mode: Length × Width"
- Disable irrelevant fields based on mode
- Validation error: "Width not used in Linear mode"
**Warning signs:** User enters width in 1D mode, wonders why it's ignored

## Code Examples

Verified patterns from official sources:

### Dynamic Cut Input Form (Svelte 5)
```typescript
// Source: https://svelte.dev/docs/svelte/$state
<script lang="ts">
interface Cut {
  id: string;
  length: number;
  width?: number; // Only for 2D mode
  quantity: number;
}

let cuts = $state<Cut[]>([
  { id: crypto.randomUUID(), length: 0, quantity: 1 }
]);

function addCut() {
  cuts.push({ id: crypto.randomUUID(), length: 0, quantity: 1 });
}

function removeCut(id: string) {
  cuts = cuts.filter(c => c.id !== id);
}

function updateCut(id: string, field: keyof Cut, value: any) {
  const cut = cuts.find(c => c.id === id);
  if (cut) {
    cut[field] = value; // Direct mutation - reactive in Svelte 5
  }
}
</script>

{#each cuts as cut (cut.id)}
  <div class="cut-input-row">
    <input
      type="number"
      bind:value={cut.length}
      placeholder="Length (inches)"
      min="0"
      step="0.125"
    />
    <input
      type="number"
      bind:value={cut.quantity}
      placeholder="Qty"
      min="1"
      step="1"
    />
    <button onclick={() => removeCut(cut.id)}>Remove</button>
  </div>
{/each}

<button onclick={addCut}>Add Cut</button>
```

### Kerf Configuration Component
```typescript
// Source: https://www.opticutter.com/cut-list-optimizer
<script lang="ts">
interface Props {
  kerf: number;
  onKerfChange: (kerf: number) => void;
}

let { kerf, onKerfChange }: Props = $props();

// Common kerf presets for woodworking
const presets = [
  { label: "Standard (1/8\")", value: 0.125 },
  { label: "Thin Kerf (3/32\")", value: 0.09375 },
  { label: "Thick Blade (5/32\")", value: 0.15625 },
  { label: "No Kerf", value: 0 }
];
</script>

<div class="kerf-config">
  <label>
    Blade Width (Kerf)
    <input
      type="number"
      value={kerf}
      oninput={(e) => onKerfChange(parseFloat(e.currentTarget.value))}
      min="0"
      max="0.5"
      step="0.015625"
      placeholder="inches"
    />
  </label>

  <div class="kerf-presets">
    {#each presets as preset}
      <button
        onclick={() => onKerfChange(preset.value)}
        class:active={kerf === preset.value}
      >
        {preset.label}
      </button>
    {/each}
  </div>

  <p class="kerf-help">
    Kerf is the material removed by the saw blade. Standard table saw blade is 1/8".
  </p>
</div>
```

### Placeholder 1D Optimization Algorithm
```typescript
// Source: Simplified from https://github.com/ccorcos/stock-cutting concept
// File: src/lib/server/cutOptimizer1D.ts

export interface Cut1D {
  id: string;
  length: number;
  quantity: number;
}

export interface Stock1D {
  id: string;
  length: number;
  quantity: number;
}

export interface CuttingPlan1D {
  stockId: string;
  stockLength: number;
  cuts: { cutId: string; length: number; }[];
  remainder: number;
}

export interface OptimizationResult1D {
  plans: CuttingPlan1D[];
  totalWaste: number;
  wastePercentage: number;
  totalStockUsed: number;
}

/**
 * Placeholder 1D optimization algorithm - SIMPLE GREEDY APPROACH
 * Phase 19 will replace with actual stock-cutting library
 */
export function optimizeCuts1D(
  cuts: Cut1D[],
  stock: Stock1D[],
  kerf: number
): OptimizationResult1D {
  // Expand cuts and stock by quantity
  const allCuts = cuts.flatMap(c =>
    Array(c.quantity).fill(null).map(() => ({
      cutId: c.id,
      length: c.length
    }))
  );

  const allStock = stock.flatMap(s =>
    Array(s.quantity).fill(null).map(() => ({
      stockId: s.id,
      length: s.length
    }))
  );

  // Sort cuts longest first (first-fit-decreasing heuristic)
  allCuts.sort((a, b) => b.length - a.length);

  const plans: CuttingPlan1D[] = [];
  let totalWaste = 0;
  let totalStockUsed = 0;

  // Simple greedy: try to fit each cut into first available stock
  const remainingCuts = [...allCuts];

  for (const stockPiece of allStock) {
    let remainingLength = stockPiece.length;
    const cutsInStock: { cutId: string; length: number }[] = [];

    let i = 0;
    while (i < remainingCuts.length) {
      const cut = remainingCuts[i];
      const requiredLength = cut.length + (cutsInStock.length > 0 ? kerf : 0);

      if (requiredLength <= remainingLength) {
        cutsInStock.push(cut);
        remainingLength -= requiredLength;
        remainingCuts.splice(i, 1);
      } else {
        i++;
      }
    }

    if (cutsInStock.length > 0) {
      plans.push({
        stockId: stockPiece.stockId,
        stockLength: stockPiece.length,
        cuts: cutsInStock,
        remainder: remainingLength
      });

      totalWaste += remainingLength;
      totalStockUsed += stockPiece.length;
    }

    if (remainingCuts.length === 0) break;
  }

  const wastePercentage = totalStockUsed > 0
    ? (totalWaste / totalStockUsed) * 100
    : 0;

  return {
    plans,
    totalWaste,
    wastePercentage,
    totalStockUsed
  };
}
```

### Waste Percentage Display
```typescript
// Source: https://cutlistevo.com/articles/best-cutting-optimization-software.html
<script lang="ts">
interface Props {
  result: OptimizationResult1D;
}

let { result }: Props = $props();

// Color-code waste percentage
const wasteLevel = $derived(
  result.wastePercentage < 10 ? 'excellent' :
  result.wastePercentage < 20 ? 'good' :
  result.wastePercentage < 30 ? 'acceptable' :
  'poor'
);
</script>

<div class="waste-summary">
  <div class="waste-metric">
    <span class="metric-label">Total Waste</span>
    <span class="metric-value waste-{wasteLevel}">
      {result.wastePercentage.toFixed(1)}%
    </span>
    <span class="metric-detail">
      {result.totalWaste.toFixed(2)}" of {result.totalStockUsed.toFixed(2)}"
    </span>
  </div>

  <div class="waste-indicator">
    <div class="waste-bar">
      <div
        class="waste-fill waste-{wasteLevel}"
        style="width: {result.wastePercentage}%"
      ></div>
    </div>
  </div>
</div>

<style>
  .waste-excellent { color: #16a34a; }
  .waste-good { color: #65a30d; }
  .waste-acceptable { color: #ca8a04; }
  .waste-poor { color: #dc2626; }
</style>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery + manual DOM | Svelte 5 with runes | 2024 (Svelte 5 release) | Simpler reactivity, less boilerplate |
| Svelte stores for arrays | `$state` runes with direct mutation | Svelte 5 | More intuitive, fine-grained reactivity |
| `export let` for props | `$props()` rune | Svelte 5 | Explicit, type-safe props |
| Integer-only algorithms | Float/decimal support | Ongoing | Better for imperial measurements (fractions) |
| Total waste minimization | Usable remnant tracking | 2020s | More practical results for users |

**Deprecated/outdated:**
- Svelte 4 reactivity patterns (`$:`, `export let`, stores for component state) - replaced by runes in Svelte 5
- Treating cutting stock as pure integer problem - modern tools support decimals for imperial units

## Open Questions

Things that couldn't be fully resolved:

1. **Database schema for saved cut lists**
   - What we know: Need to store cuts, stock, kerf, mode, results
   - What's unclear: Should results be computed on-demand or cached? How to handle project association?
   - Recommendation: Store inputs only (cuts, stock, kerf, mode), recompute results on load. Simpler, no stale data.

2. **Fraction input support**
   - What we know: Woodworkers use fractions (1 1/2", 3/4"), but storage should be decimal
   - What's unclear: Parse fractions in UI or force decimal input?
   - Recommendation: Phase 18 use decimal-only input (step="0.125" for 1/8" increments), phase 21+ add fraction parser if user feedback requests it.

3. **Usable remnant threshold**
   - What we know: Remnants above certain length are reusable, not "waste"
   - What's unclear: What threshold? 6"? 12"? 24"? User-configurable?
   - Recommendation: Phase 18 count all remnants as waste. Phase 20+ add configurable threshold.

4. **Print/export format**
   - What we know: Users need cutting plans in physical form (shop floor)
   - What's unclear: PDF? Print-optimized HTML? Export to CSV?
   - Recommendation: Phase 18 skip print/export, just display results. Phase 21+ add print stylesheet and PDF export.

## Sources

### Primary (HIGH confidence)
- [Svelte 5 $state documentation](https://svelte.dev/docs/svelte/$state) - State management patterns
- [Svelte 5 $props documentation](https://svelte.dev/docs/svelte/$props) - Component props
- [Svelte 5 migration guide](https://svelte.dev/docs/svelte/v5-migration-guide) - Runes vs old patterns

### Secondary (MEDIUM confidence)
- [GitHub: ccorcos/stock-cutting](https://github.com/ccorcos/stock-cutting) - TypeScript 1D cutting library (verified active)
- [GitHub: jakesgordon/bin-packing](https://github.com/jakesgordon/bin-packing) - 2D bin packing algorithm (verified mature)
- [optiCutter Cut List Optimizer](https://www.opticutter.com/cut-list-optimizer) - Industry tool examples (UI/UX patterns)
- [CutLogic 1D FAQ](https://www.tmachines.com/cutlogic-1d/faq/) - Kerf handling and validation patterns
- [Cutting Stock Problem - Wikipedia](https://en.wikipedia.org/wiki/Cutting_stock_problem) - Problem definition and complexity

### Tertiary (LOW confidence - WebSearch only)
- [Bin packing - npm search](https://www.npmjs.com/search?q=bin+packing) - Library landscape overview
- [Why Are Cutlist optimizer Trending Now?](https://tomorrowdesk.com/trending/3-25/cutlist-optimizer) - Market context
- Various commercial tools (CutList Plus, MaxCut, etc.) - Feature comparison

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Libraries verified but not tested in this context; Svelte 5 patterns are HIGH (project standard)
- Architecture: MEDIUM - Patterns adapted from established BOM tool structure, but cut optimizer is new domain
- Pitfalls: MEDIUM - Based on documentation and tool FAQs, not personal implementation experience
- Code examples: MEDIUM - Svelte patterns are HIGH (official docs), placeholder algorithm is LOW (simplified, needs real library)

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - stable domain, libraries mature)
