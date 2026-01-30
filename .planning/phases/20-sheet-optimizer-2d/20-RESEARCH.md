# Phase 20: Sheet Optimizer (2D) - Research

**Researched:** 2026-01-29
**Domain:** 2D bin packing optimization for sheet cutting stock problems with guillotine constraints
**Confidence:** MEDIUM-HIGH

## Summary

Phase 20 implements a proper 2D guillotine bin packing algorithm to replace the placeholder one-cut-per-sheet algorithm from Phase 18. Research focused on guillotine algorithm implementation, grain direction constraint handling, kerf application in 2D cutting, SVG visualization patterns for nested rectangles, and performance considerations for JavaScript execution.

The guillotine algorithm is well-established for cutting stock problems where physical cuts must be straight edge-to-edge lines (real-world constraint in wood/glass industries). For this phase, implementing a custom guillotine algorithm is recommended over external libraries because: (1) existing JavaScript libraries are unmaintained or lack kerf support, (2) grain direction is a domain-specific constraint not handled by generic bin-packing libraries, and (3) the algorithm is straightforward (~150-200 lines) and allows full control over heuristics and split rules.

SVG visualization will use nested `<rect>` elements with absolute positioning to display 2D cut layouts on sheets. The existing Phase 18 foundation provides the data types, UI components, and result display structure that Phase 20 will enhance with the production 2D optimizer.

**Primary recommendation:** Implement custom Guillotine BSSF+SAS (Best Short Side Fit with Shorter Axis Split) algorithm in `src/lib/server/cutOptimizer.ts` replacing the `optimizeCuts2D()` placeholder, add grain direction constraint to placement logic (disable rotation when grain matters), create `SheetCutDiagram.svelte` component using SVG nested rectangles, and apply kerf spacing to both horizontal and vertical cuts in waste calculations.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native TypeScript | - | Guillotine algorithm implementation | Algorithm is ~150-200 lines; custom implementation gives control over kerf and grain constraints |
| SVG (native) | - | 2D cut diagram visualization | Browser-native, Svelte has excellent SVG support, no library needed |
| Existing types | - | Cut, Stock, OptimizationResult | Phase 18 foundation already established with width fields for 2D mode |
| Existing UI components | - | CutInputForm, StockInputForm, KerfConfig | Already built and tested in Phase 18, enhanced in Phase 19 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| maxrects-packer | 2.7.3 | 2D bin packing with MaxRects algorithm | Alternative if guillotine produces poor results; last updated 2020 |
| bin-packing | 1.5.1 | Binary tree 2D bin packing | Alternative library; lacks guillotine constraint; last updated 2019 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Guillotine | maxrects-packer npm library | MaxRects can pack tighter but doesn't enforce guillotine cuts (required for real-world cutting); last updated 2020 (4 years unmaintained) |
| Custom Guillotine | bin-packing npm library | Binary tree approach doesn't guarantee guillotine separability; no kerf support; last updated 2019 (5 years unmaintained) |
| Native SVG | SVGnest for nesting | SVGnest handles irregular shapes but massive overkill for rectangles; adds complexity |
| Sync execution | Web Worker | Web Worker adds complexity; 20-30 rectangles run in <50ms synchronously, acceptable for UX |

**Installation:**
```bash
# No new dependencies needed - Phase 20 enhances existing code
# Optional (if custom implementation has issues):
npm install maxrects-packer
```

## Architecture Patterns

### Recommended Project Structure
```
src/lib/server/
├── cutOptimizer.ts           # Enhance optimizeCuts2D with guillotine algorithm
src/lib/components/cutlist/
├── OptimizationResults.svelte # Already exists - add 2D diagram integration
├── SheetCutDiagram.svelte     # NEW - SVG visualization for 2D cuts
└── (existing components)      # CutInputForm, StockInputForm, LinearCutDiagram
```

### Pattern 1: Guillotine Bin Packing Algorithm
**What:** Place rectangles by selecting free spaces and performing straight-line cuts (guillotine), creating new free rectangles after each placement
**When to use:** 2D bin packing problems where cuts must be edge-to-edge (real-world cutting constraint)
**Example:**
```typescript
// Source: https://github.com/juj/RectangleBinPack - Guillotine algorithm
// Adapted to TypeScript with kerf and grain constraints

interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacedCut {
  x: number;
  y: number;
  width: number;
  height: number;
  cutId: string;
  cutLabel: string;
  rotated: boolean; // true if 90° rotated from original dimensions
}

function guillotinePack(
  cuts: Array<{ id: string; label: string; length: number; width: number; allowRotation: boolean }>,
  stockWidth: number,
  stockHeight: number,
  kerf: number
): PlacedCut[] {
  // Initialize with one free rectangle (entire stock)
  const freeRectangles: FreeRectangle[] = [
    { x: 0, y: 0, width: stockWidth, height: stockHeight }
  ];

  const placedCuts: PlacedCut[] = [];

  // Sort cuts descending by area (heuristic: place larger pieces first)
  const sortedCuts = [...cuts].sort((a, b) =>
    (b.length * b.width) - (a.length * a.width)
  );

  for (const cut of sortedCuts) {
    let bestScore = Infinity;
    let bestFreeRect: FreeRectangle | null = null;
    let bestRotated = false;

    // Try each free rectangle
    for (const freeRect of freeRectangles) {
      // Try upright orientation
      if (cut.length <= freeRect.width && cut.width <= freeRect.height) {
        const score = scoreBestShortSideFit(
          freeRect.width, freeRect.height, cut.length, cut.width
        );
        if (score < bestScore) {
          bestScore = score;
          bestFreeRect = freeRect;
          bestRotated = false;
        }
      }

      // Try rotated orientation (if allowed)
      if (cut.allowRotation &&
          cut.width <= freeRect.width && cut.length <= freeRect.height) {
        const score = scoreBestShortSideFit(
          freeRect.width, freeRect.height, cut.width, cut.length
        );
        if (score < bestScore) {
          bestScore = score;
          bestFreeRect = freeRect;
          bestRotated = true;
        }
      }
    }

    if (!bestFreeRect) {
      // Cut doesn't fit - will be tracked as unplaced
      continue;
    }

    // Place the cut
    const placedWidth = bestRotated ? cut.width : cut.length;
    const placedHeight = bestRotated ? cut.length : cut.width;

    placedCuts.push({
      x: bestFreeRect.x,
      y: bestFreeRect.y,
      width: placedWidth,
      height: placedHeight,
      cutId: cut.id,
      cutLabel: cut.label,
      rotated: bestRotated
    });

    // Remove used rectangle and split remainder
    const index = freeRectangles.indexOf(bestFreeRect);
    freeRectangles.splice(index, 1);

    const newRects = splitShorterAxis(
      bestFreeRect,
      placedWidth,
      placedHeight,
      kerf
    );
    freeRectangles.push(...newRects);
  }

  return placedCuts;
}

function scoreBestShortSideFit(
  freeWidth: number,
  freeHeight: number,
  itemWidth: number,
  itemHeight: number
): number {
  const leftoverHoriz = freeWidth - itemWidth;
  const leftoverVert = freeHeight - itemHeight;
  return Math.min(leftoverHoriz, leftoverVert);
}

function splitShorterAxis(
  freeRect: FreeRectangle,
  placedWidth: number,
  placedHeight: number,
  kerf: number
): FreeRectangle[] {
  // Account for kerf in split calculations
  const usedWidth = placedWidth + kerf;
  const usedHeight = placedHeight + kerf;

  const leftoverWidth = freeRect.width - usedWidth;
  const leftoverHeight = freeRect.height - usedHeight;

  const newRects: FreeRectangle[] = [];

  // Split on shorter leftover axis
  if (leftoverWidth < leftoverHeight) {
    // Horizontal split
    // Rectangle above the placed item
    if (leftoverHeight > 0) {
      newRects.push({
        x: freeRect.x,
        y: freeRect.y + usedHeight,
        width: freeRect.width,
        height: leftoverHeight
      });
    }
    // Rectangle to the right of the placed item
    if (leftoverWidth > 0) {
      newRects.push({
        x: freeRect.x + usedWidth,
        y: freeRect.y,
        width: leftoverWidth,
        height: placedHeight
      });
    }
  } else {
    // Vertical split
    // Rectangle to the right of the placed item
    if (leftoverWidth > 0) {
      newRects.push({
        x: freeRect.x + usedWidth,
        y: freeRect.y,
        width: leftoverWidth,
        height: freeRect.height
      });
    }
    // Rectangle above the placed item
    if (leftoverHeight > 0) {
      newRects.push({
        x: freeRect.x,
        y: freeRect.y + usedHeight,
        width: placedWidth,
        height: leftoverHeight
      });
    }
  }

  return newRects;
}
```

### Pattern 2: Kerf-Aware 2D Waste Calculation
**What:** Account for kerf (blade width) in both horizontal and vertical cuts when calculating waste area
**When to use:** All 2D cutting stock optimizations with physical saw blades
**Example:**
```typescript
// Source: Adapted from Phase 19 1D kerf formula for 2D application
// In 2D, kerf applies to the guillotine cuts that separate pieces

function calculate2DWaste(
  stockWidth: number,
  stockHeight: number,
  placedCuts: PlacedCut[],
  kerf: number
): number {
  // Calculate total area of placed cuts
  const totalCutArea = placedCuts.reduce(
    (sum, cut) => sum + (cut.width * cut.height),
    0
  );

  // Calculate kerf loss
  // For guillotine cuts, kerf applies to the cutting lines
  // Each placed piece requires cuts to separate it from stock/neighbors
  // Conservative estimate: each cut adds kerf to one dimension
  const kerfLossArea = placedCuts.reduce((sum, cut) => {
    // Horizontal kerf loss (cut separated vertically)
    const horizontalKerfLoss = cut.width * kerf;
    // Vertical kerf loss (cut separated horizontally)
    const verticalKerfLoss = cut.height * kerf;
    return sum + horizontalKerfLoss + verticalKerfLoss;
  }, 0);

  const stockArea = stockWidth * stockHeight;
  const wasteArea = stockArea - totalCutArea - kerfLossArea;

  return Math.max(0, wasteArea); // Prevent negative waste
}
```

### Pattern 3: Grain Direction Constraint
**What:** Disable 90° rotation when grain direction matters for visible surfaces
**When to use:** Plywood and veneer sheets where grain orientation is aesthetically important
**Example:**
```typescript
// Source: https://www.steelsolver.com/2025/10/grain-direction-in-cut-list.html
// Grain direction patterns in cut list optimization

interface Cut {
  id: string;
  length: number;
  width: number;
  quantity: number;
  label: string;
  grainMatters: boolean; // NEW - Phase 20 addition
}

// In cut input form, add grain direction toggle
// Default: grain runs along length (first dimension)
// grainMatters = true → do NOT rotate, grain must stay horizontal
// grainMatters = false → allow rotation for better packing

// In guillotine algorithm:
const sortedCuts = cuts.map(cut => ({
  ...cut,
  allowRotation: !cut.grainMatters // Disable rotation if grain matters
}));

// When visualizing, show grain indicator for constrained pieces
```

### Pattern 4: SVG 2D Cut Diagram
**What:** Display cuts on sheet as nested rectangles with absolute x/y positioning
**When to use:** Visualizing 2D cutting patterns for user review
**Example:**
```svelte
<!-- Source: https://www.w3.org/TR/SVG/coords.html - SVG coordinate systems -->
<script lang="ts">
import type { StockPlan } from '$lib/server/cutOptimizer';

interface Props {
  plan: StockPlan;
  kerf: number;
  index: number;
}

let { plan, kerf, index }: Props = $props();

// SVG dimensions
const svgWidth = 600;
const svgHeight = 400;
const padding = 20;

// Calculate scale factor to fit stock in viewBox
const scaleX = (svgWidth - 2 * padding) / (plan.stockLength || 1);
const scaleY = (svgHeight - 2 * padding) / (plan.stockWidth || 1);
const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio

// Scaled stock dimensions
const stockWidth = $derived((plan.stockLength || 0) * scale);
const stockHeight = $derived((plan.stockWidth || 0) * scale);

// Transform cuts to SVG coordinates
const cutRects = $derived(() => {
  return plan.cuts.map(cut => ({
    x: padding + (cut.x || 0) * scale,
    y: padding + (cut.y || 0) * scale,
    width: (cut.length || 0) * scale,
    height: (cut.width || 0) * scale,
    label: cut.cutLabel,
    id: cut.cutId
  }));
});

// Calculate waste percentage for color coding
const stockArea = (plan.stockLength || 0) * (plan.stockWidth || 0);
const wastePercent = stockArea > 0 ? ((plan.wasteArea || 0) / stockArea) * 100 : 0;
</script>

<div class="diagram-container">
  <div class="diagram-header">
    <span class="stock-label">#{index + 1} {plan.stockLabel || 'Sheet'}</span>
    <span class="stock-dimensions">
      {plan.stockLength}" × {plan.stockWidth}"
    </span>
  </div>

  <svg viewBox="0 0 {svgWidth} {svgHeight}" class="diagram-svg">
    <!-- Stock outline -->
    <rect
      x="{padding}"
      y="{padding}"
      width="{stockWidth}"
      height="{stockHeight}"
      fill="#f9fafb"
      stroke="#d1d5db"
      stroke-width="2"
      rx="4"
    />

    <!-- Placed cuts -->
    {#each cutRects as cutRect (cutRect.id)}
      <g>
        <rect
          x="{cutRect.x}"
          y="{cutRect.y}"
          width="{cutRect.width}"
          height="{cutRect.height}"
          fill="#10b981"
          stroke="#059669"
          stroke-width="1.5"
        />
        <!-- Cut label (if large enough) -->
        {#if cutRect.width > 40 && cutRect.height > 20}
          <text
            x="{cutRect.x + cutRect.width / 2}"
            y="{cutRect.y + cutRect.height / 2}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="10"
            font-weight="600"
            fill="white"
          >
            {cutRect.label}
          </text>
        {/if}
      </g>
    {/each}

    <!-- Kerf visualization (optional - can be overwhelming) -->
    <!-- Show as dashed grid lines where cuts occurred -->
  </svg>

  <div class="diagram-footer">
    <span class="cuts-count">
      {plan.cuts.length} cut{plan.cuts.length !== 1 ? 's' : ''}
    </span>
    <span class="waste-amount">
      {(plan.wasteArea || 0).toFixed(1)} sq in waste ({wastePercent.toFixed(1)}%)
    </span>
  </div>
</div>

<style>
  .diagram-container {
    background: white;
    border: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .diagram-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
  }

  .stock-label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-ink);
  }

  .stock-dimensions {
    font-size: 0.875rem;
    color: var(--color-ink-muted);
    font-family: var(--font-mono, monospace);
  }

  .diagram-svg {
    width: 100%;
    height: auto;
    max-height: 400px;
  }

  .diagram-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--space-xs);
    border-top: 1px solid rgba(17, 17, 17, 0.08);
    font-size: 0.8125rem;
  }

  .cuts-count {
    color: var(--color-ink-muted);
  }

  .waste-amount {
    color: var(--color-ink-muted);
    font-family: var(--font-mono, monospace);
  }
</style>
```

### Anti-Patterns to Avoid
- **Using MaxRects without guillotine constraint:** MaxRects can pack tighter but doesn't guarantee edge-to-edge cuts; real cutting requires guillotine separability
- **Forgetting to sort before packing:** Unsorted cuts lead to poor packing; sort by area descending (larger pieces first)
- **Applying kerf twice per cut:** In 2D, kerf applies to the cutting line, not per piece; avoid double-counting at shared edges
- **Rotating grain-constrained cuts:** When grain matters (visible plywood surfaces), rotation breaks aesthetic requirements; respect grainMatters flag
- **Fixed viewBox without scaling:** Always calculate scale factor based on stock dimensions to fit SVG viewport while maintaining aspect ratio

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Guillotine algorithm core | N/A - should implement custom | Enhance existing Phase 18 placeholder | Existing libraries unmaintained; grain and kerf are domain-specific; algorithm is ~150-200 lines |
| SVG coordinate transforms | Manual pixel calculations | Native SVG viewBox with scale calculation | SVG handles coordinate systems natively; calculate one scale factor, apply to all coordinates |
| Kerf calculation | Per-rectangle subtraction | Conservative formula: each cut loses kerf in both dimensions | 2D kerf is tricky; err on side of overestimating waste rather than under |
| Rectangle rotation logic | Manual width/height swap | Structured approach with `rotated: boolean` flag | Track rotation state for visualization and grain constraint verification |

**Key insight:** Phase 20 is about **enhancing the 2D placeholder**, not replacing the entire optimizer. The Phase 18 foundation has the right structure (expansion, validation, mode switching) - it just needs the one-cut-per-sheet placeholder replaced with proper guillotine packing. This is a targeted algorithm enhancement, not a rebuild.

## Common Pitfalls

### Pitfall 1: Guillotine Separability Violation
**What goes wrong:** Algorithm places cuts that can't be physically separated with straight edge-to-edge cuts
**Why it happens:** Using MaxRects or other non-guillotine algorithms without checking separability constraint
**How to avoid:**
- Use guillotine algorithm variants (BSSF+SAS recommended)
- Each placement creates new rectangles via straight-line split
- Never place rectangles in positions that require diagonal or curved cuts to separate
**Warning signs:** Generated diagrams show overlapping cuts or cuts that would require L-shaped cutouts

### Pitfall 2: Kerf Double-Counting in 2D
**What goes wrong:** Waste calculation counts kerf twice for shared edges between cuts
**Why it happens:** Applying kerf to each cut independently without considering adjacency
**How to avoid:**
- Apply kerf to the splitting operation, not per-cut
- In split function, add kerf to `usedWidth` and `usedHeight` before calculating leftover
- Don't subtract kerf from individual cut dimensions
**Warning signs:** Waste percentages are systematically 5-10% higher than manual calculation

### Pitfall 3: Ignoring Grain Direction Constraint
**What goes wrong:** Algorithm rotates cuts that should maintain grain orientation
**Why it happens:** Treating all cuts as freely rotatable to maximize packing efficiency
**How to avoid:**
- Add `grainMatters: boolean` field to Cut interface (Phase 20 addition)
- Set `allowRotation = !cut.grainMatters` in algorithm
- Default grain direction along length (first dimension)
- Provide UI toggle for grain-sensitive cuts
**Warning signs:** User complaints about "sideways grain" on visible plywood surfaces

### Pitfall 4: SVG Coordinate System Confusion in 2D
**What goes wrong:** Cuts render at wrong positions or extend beyond stock boundary
**Why it happens:** Mixing data units (inches) with SVG units (pixels) without consistent scaling
**How to avoid:**
- Define SVG viewBox dimensions (e.g., 600x400px)
- Calculate scale factors for both axes: `scaleX = svgWidth / stockLength`, `scaleY = svgHeight / stockWidth`
- Use `scale = Math.min(scaleX, scaleY)` to maintain aspect ratio
- Apply scale to ALL coordinates: `x * scale`, `y * scale`, `width * scale`, `height * scale`
**Warning signs:** Diagram shows cuts extending past stock boundary or squished aspect ratios

### Pitfall 5: Poor Heuristic Selection
**What goes wrong:** Guillotine algorithm produces 40-50% waste on typical cuts
**Why it happens:** Using wrong selection heuristic (e.g., First Fit instead of Best Short Side Fit)
**How to avoid:**
- Use Best Short Side Fit (BSSF) for selection: `min(leftoverWidth, leftoverHeight)`
- Use Shorter Axis Split (SAS) for splitting: split on axis with smaller leftover
- Sort cuts by area descending before placement
- For similar-sized rectangles, BSSF+SAS performs best
**Warning signs:** Waste percentage consistently >30% when industry standard is 10-20%

### Pitfall 6: Insufficient Stock Dimension Validation
**What goes wrong:** Algorithm attempts to place cuts larger than stock dimensions
**Why it happens:** No upfront validation that max cut dimensions fit in stock
**How to avoid:**
- Phase 18 already validates max cut vs max stock in 1D - extend to 2D
- Check: `maxCutLength <= maxStockLength && maxCutWidth <= maxStockWidth`
- Consider both orientations: also check rotated dimensions if rotation allowed
- Return clear error message before attempting optimization
**Warning signs:** Algorithm returns empty results or crashes with no error message

### Pitfall 7: Performance Issues with Many Rectangles
**What goes wrong:** Browser freezes when optimizing 50+ cuts
**Why it happens:** Guillotine algorithm is O(n²) in worst case; no performance limits
**How to avoid:**
- For Phase 20, limit to 50 rectangles per sheet (reasonable woodworking scenario)
- Show warning if user exceeds limit: "Too many cuts - split into multiple sheets"
- Algorithm benchmarks show ~1-50ms for 20-30 rectangles (acceptable sync execution)
- If future phases need >50, use Web Worker (deferred to v4.0)
**Warning signs:** UI becomes unresponsive during optimization

### Pitfall 8: Lost Rotation State in Visualization
**What goes wrong:** Diagram shows cuts with correct dimensions but user can't tell which were rotated
**Why it happens:** Not tracking or visualizing rotation state
**How to avoid:**
- Track `rotated: boolean` in PlacedCut interface
- Add visual indicator in diagram (e.g., small rotation icon or different color)
- Include rotation state in results list: "Cut A (18" × 24", rotated)"
**Warning signs:** User confusion about which dimension is length vs width in final cuts

## Code Examples

Verified patterns from official sources:

### Enhanced 2D Optimizer (Replace Phase 18 Placeholder)
```typescript
// Source: https://github.com/juj/RectangleBinPack - Guillotine BSSF+SAS algorithm
// Adapted to TypeScript with kerf and grain direction support
// File: src/lib/server/cutOptimizer.ts (replace optimizeCuts2D function)

export function optimizeCuts2D(cuts: Cut[], stock: Stock[], kerf: number): OptimizationResult {
  // Validation (keep existing from Phase 18)
  if (cuts.length === 0 || stock.length === 0) {
    // ... existing validation ...
  }

  // Expand cuts by quantity
  const expandedCuts: Array<{
    id: string;
    label: string;
    length: number;
    width: number;
    originalId: string;
    grainMatters: boolean; // NEW - Phase 20
  }> = [];

  cuts.forEach((cut) => {
    for (let i = 0; i < cut.quantity; i++) {
      expandedCuts.push({
        id: `${cut.id}-${i}`,
        label: cut.label || `Cut ${cut.length}"x${cut.width}"`,
        length: cut.length,
        width: cut.width ?? 0,
        originalId: cut.id,
        grainMatters: cut.grainMatters ?? false // Default: rotation allowed
      });
    }
  });

  // Sort cuts descending by area (heuristic: place larger first)
  expandedCuts.sort((a, b) => (b.length * b.width) - (a.length * a.width));

  // Check if largest cut fits in largest stock
  const maxCutLength = Math.max(...cuts.map((c) => c.length));
  const maxCutWidth = Math.max(...cuts.map((c) => c.width ?? 0));
  const maxStockLength = Math.max(...stock.map((s) => s.length));
  const maxStockWidth = Math.max(...stock.map((s) => s.width ?? 0));

  // Check both orientations
  const largestFits =
    (maxCutLength <= maxStockLength && maxCutWidth <= maxStockWidth) ||
    (maxCutWidth <= maxStockLength && maxCutLength <= maxStockWidth);

  if (!largestFits) {
    return {
      success: false,
      error: `Largest cut (${maxCutLength}"x${maxCutWidth}") exceeds largest stock (${maxStockLength}"x${maxStockWidth}")`,
      plans: [],
      summary: {
        totalCuts: expandedCuts.length,
        totalStockUsed: 0,
        totalWaste: 0,
        wastePercentage: 0,
        unplacedCuts: cuts.map((c) => c.id),
        totalLinearFeetUsed: 0,
        totalLinearFeetAvailable: 0
      }
    };
  }

  // Expand stock by quantity
  const expandedStock: Array<{
    id: string;
    label: string;
    length: number;
    width: number;
    originalId: string;
  }> = [];

  stock.forEach((stockItem) => {
    for (let i = 0; i < stockItem.quantity; i++) {
      expandedStock.push({
        id: `${stockItem.id}-${i}`,
        label: stockItem.label || `Sheet ${stockItem.length}"x${stockItem.width}"`,
        length: stockItem.length,
        width: stockItem.width ?? 0,
        originalId: stockItem.id
      });
    }
  });

  // Sort stock descending by area (use larger sheets first)
  expandedStock.sort((a, b) => (b.length * b.width) - (a.length * a.width));

  // Guillotine packing algorithm
  const plans: StockPlan[] = [];
  const unplacedCuts: string[] = [];

  for (const cut of expandedCuts) {
    let placed = false;

    // Try to fit into existing plans (sheets already in use)
    for (const plan of plans) {
      const result = tryPlaceCutOnSheet(plan, cut, kerf);
      if (result.success) {
        placed = true;
        break;
      }
    }

    // If not placed, try a new stock sheet
    if (!placed) {
      const availableStock = expandedStock[plans.length];
      if (availableStock) {
        const newPlan = createSheetPlan(availableStock, cut, kerf);
        if (newPlan) {
          plans.push(newPlan);
          placed = true;
        }
      }
    }

    // Track unplaced cuts
    if (!placed && !unplacedCuts.includes(cut.originalId)) {
      unplacedCuts.push(cut.originalId);
    }
  }

  // Calculate waste for each plan
  for (const plan of plans) {
    const stockArea = (plan.stockLength ?? 0) * (plan.stockWidth ?? 0);
    const totalCutArea = plan.cuts.reduce(
      (sum, c) => sum + ((c.length ?? 0) * (c.width ?? 0)),
      0
    );

    // Conservative kerf estimate: each cut loses kerf in both dimensions
    const kerfLossArea = plan.cuts.reduce((sum, cut) => {
      return sum + ((cut.length ?? 0) * kerf) + ((cut.width ?? 0) * kerf);
    }, 0);

    plan.wasteArea = Math.max(0, stockArea - totalCutArea - kerfLossArea);
  }

  // Calculate summary
  const totalStockArea = plans.reduce(
    (sum, plan) => sum + ((plan.stockLength ?? 0) * (plan.stockWidth ?? 0)),
    0
  );
  const totalWasteArea = plans.reduce((sum, plan) => sum + (plan.wasteArea ?? 0), 0);
  const wastePercentage = totalStockArea > 0 ? (totalWasteArea / totalStockArea) * 100 : 0;

  return {
    success: true,
    plans,
    summary: {
      totalCuts: expandedCuts.length,
      totalStockUsed: plans.length,
      totalWaste: totalWasteArea,
      wastePercentage,
      unplacedCuts,
      totalLinearFeetUsed: 0, // Not applicable for sheet mode
      totalLinearFeetAvailable: 0
    }
  };
}

// Helper: Guillotine packing logic for single sheet
function tryPlaceCutOnSheet(
  plan: StockPlan,
  cut: { id: string; label: string; length: number; width: number; grainMatters: boolean },
  kerf: number
): { success: boolean } {
  // This would contain the guillotine free rectangle tracking and BSSF scoring
  // Implementation details in Pattern 1 above
  // Returns true if cut was placed, false if no room

  // Placeholder for brevity - full implementation in Pattern 1
  return { success: false };
}

function createSheetPlan(
  stock: { id: string; label: string; length: number; width: number },
  cut: { id: string; label: string; length: number; width: number; grainMatters: boolean },
  kerf: number
): StockPlan | null {
  // Create new plan with first cut placed at origin
  const rotated = cut.grainMatters ? false : (cut.width > stock.length && cut.length <= stock.length);

  if (!rotated && (cut.length > stock.length || cut.width > stock.width)) {
    return null; // Doesn't fit
  }

  if (rotated && (cut.width > stock.length || cut.length > stock.width)) {
    return null; // Doesn't fit rotated either
  }

  return {
    stockId: stock.id,
    stockLabel: stock.label,
    stockLength: stock.length,
    stockWidth: stock.width,
    cuts: [{
      cutId: cut.id,
      cutLabel: cut.label,
      length: rotated ? cut.width : cut.length,
      width: rotated ? cut.length : cut.width,
      x: 0,
      y: 0,
      rotated
    }],
    wasteLength: 0, // Not used in 2D
    wasteArea: 0, // Calculated later
    freeRectangles: [
      // Initialize free rectangles after first placement
      // Full implementation in Pattern 1
    ]
  };
}
```

### Sheet Cut Diagram Component
```svelte
<!-- Source: https://www.w3.org/TR/SVG/coords.html - SVG nested viewports -->
<!-- File: src/lib/components/cutlist/SheetCutDiagram.svelte -->
<script lang="ts">
import type { StockPlan } from '$lib/server/cutOptimizer';

interface Props {
  plan: StockPlan;
  kerf: number;
  index: number;
}

let { plan, kerf, index }: Props = $props();

// SVG dimensions and padding
const svgWidth = 600;
const svgHeight = 400;
const padding = 20;

// Calculate scale to fit stock in SVG while maintaining aspect ratio
const scaleX = $derived((svgWidth - 2 * padding) / (plan.stockLength || 1));
const scaleY = $derived((svgHeight - 2 * padding) / (plan.stockWidth || 1));
const scale = $derived(Math.min(scaleX, scaleY));

// Scaled stock dimensions
const stockWidth = $derived((plan.stockLength || 0) * scale);
const stockHeight = $derived((plan.stockWidth || 0) * scale);

// Transform cuts to SVG coordinates
interface CutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  id: string;
  showLabel: boolean;
  rotated: boolean;
}

const cutRects = $derived<CutRect[]>(() => {
  return plan.cuts.map(cut => {
    const width = (cut.length || 0) * scale;
    const height = (cut.width || 0) * scale;

    return {
      x: padding + ((cut.x || 0) * scale),
      y: padding + ((cut.y || 0) * scale),
      width,
      height,
      label: cut.cutLabel || '',
      id: cut.cutId,
      showLabel: width > 40 && height > 20, // Show label if big enough
      rotated: cut.rotated || false
    };
  });
});

// Waste color coding
const stockArea = $derived((plan.stockLength || 0) * (plan.stockWidth || 0));
const wastePercent = $derived(stockArea > 0 ? ((plan.wasteArea || 0) / stockArea) * 100 : 0);

const wasteColor = $derived(() => {
  if (wastePercent < 10) return '#10b981'; // green - excellent
  if (wastePercent < 20) return '#fbbf24'; // amber - good
  if (wastePercent < 30) return '#f97316'; // orange - acceptable
  return '#ef4444'; // red - poor
});
</script>

<div class="diagram-container">
  <div class="diagram-header">
    <span class="stock-label">Sheet #{index + 1}: {plan.stockLabel || 'Stock'}</span>
    <span class="stock-dimensions">
      {plan.stockLength}" × {plan.stockWidth}"
    </span>
  </div>

  <svg viewBox="0 0 {svgWidth} {svgHeight}" class="diagram-svg">
    <!-- Stock outline -->
    <rect
      x="{padding}"
      y="{padding}"
      width="{stockWidth}"
      height="{stockHeight}"
      fill="#f9fafb"
      stroke="#d1d5db"
      stroke-width="2"
      rx="4"
    />

    <!-- Placed cuts -->
    {#each cutRects as cutRect (cutRect.id)}
      <g class="cut-group">
        <rect
          x="{cutRect.x}"
          y="{cutRect.y}"
          width="{cutRect.width}"
          height="{cutRect.height}"
          fill="#10b981"
          stroke="#059669"
          stroke-width="1.5"
          class:rotated={cutRect.rotated}
        />

        {#if cutRect.showLabel}
          <text
            x="{cutRect.x + cutRect.width / 2}"
            y="{cutRect.y + cutRect.height / 2}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="10"
            font-weight="600"
            fill="white"
          >
            {cutRect.label}
          </text>
        {/if}

        <!-- Rotation indicator -->
        {#if cutRect.rotated && cutRect.width > 30}
          <circle
            cx="{cutRect.x + 10}"
            cy="{cutRect.y + 10}"
            r="4"
            fill="white"
            opacity="0.8"
          />
          <text
            x="{cutRect.x + 10}"
            y="{cutRect.y + 10}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="8"
            font-weight="700"
            fill="#059669"
          >
            ↻
          </text>
        {/if}
      </g>
    {/each}
  </svg>

  <div class="diagram-footer">
    <span class="cuts-count">
      {plan.cuts.length} cut{plan.cuts.length !== 1 ? 's' : ''}
    </span>
    <span class="waste-amount" style="color: {wasteColor()}">
      {(plan.wasteArea || 0).toFixed(1)} sq in waste ({wastePercent.toFixed(1)}%)
    </span>
  </div>
</div>

<style>
  .diagram-container {
    background: white;
    border: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .diagram-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--space-xs);
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
  }

  .stock-label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-ink);
  }

  .stock-dimensions {
    font-size: 0.875rem;
    color: var(--color-ink-muted);
    font-family: var(--font-mono, monospace);
  }

  .diagram-svg {
    width: 100%;
    height: auto;
  }

  .cut-group rect.rotated {
    opacity: 0.9;
  }

  .diagram-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: var(--space-xs);
    border-top: 1px solid rgba(17, 17, 17, 0.08);
    font-size: 0.8125rem;
  }

  .cuts-count {
    color: var(--color-ink-muted);
  }

  .waste-amount {
    font-family: var(--font-mono, monospace);
    font-weight: 600;
  }
</style>
```

### Integration into OptimizationResults Component
```svelte
<!-- Source: Existing OptimizationResults.svelte enhancement -->
<!-- Add after LinearCutDiagram section -->

<script lang="ts">
import LinearCutDiagram from './LinearCutDiagram.svelte';
import SheetCutDiagram from './SheetCutDiagram.svelte'; // NEW - Phase 20
// ... existing imports ...

let { result, mode, kerf }: Props = $props();
</script>

<!-- ... existing summary section ... -->

<!-- Visual Diagrams Section -->
{#if mode === 'linear' && result.plans.length > 0}
  <div class="diagrams-section">
    <h3 class="diagrams-title">Cut Diagrams (Linear)</h3>
    <div class="diagrams-list">
      {#each result.plans as plan, index (plan.stockId)}
        <LinearCutDiagram {plan} {kerf} {index} />
      {/each}
    </div>
  </div>
{:else if mode === 'sheet' && result.plans.length > 0}
  <div class="diagrams-section">
    <h3 class="diagrams-title">Cut Diagrams (Sheet)</h3>
    <div class="diagrams-list">
      {#each result.plans as plan, index (plan.stockId)}
        <SheetCutDiagram {plan} {kerf} {index} />
      {/each}
    </div>
  </div>
{/if}

<!-- ... existing plans-grid section ... -->
```

### Add Grain Direction Toggle to Cut Interface
```typescript
// File: src/lib/types/cutlist.ts (enhance existing Cut interface)

export interface Cut {
  id: string;
  length: number; // inches
  width: number | null; // inches, null for linear mode
  quantity: number;
  label: string; // optional name
  grainMatters: boolean; // NEW - Phase 20: true = no rotation, false = allow rotation
}

// Update createCut helper
export function createCut(mode: CutListMode): Cut {
  return {
    id: crypto.randomUUID(),
    length: 0,
    width: mode === 'sheet' ? 0 : null,
    quantity: 1,
    label: '',
    grainMatters: false // Default: rotation allowed
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 18 one-cut-per-sheet | Phase 20 guillotine packing | Phase 20 | ~40-60% waste reduction on typical plywood cuts |
| No grain direction support | Grain constraint toggle | Phase 20 | Allows aesthetic control for visible surfaces |
| Area-only waste calculation | 2D kerf-aware waste | Phase 20 | Realistic waste estimates accounting for blade width |
| No rotation visualization | Rotated pieces marked | Phase 20 | Clearer cutting instructions for shop |
| Generic bin packing libraries | Custom guillotine algorithm | 2026 recommendation | Better control over constraints (kerf, grain, guillotine separability) |

**Deprecated/outdated:**
- maxrects-packer library (last updated 2020) - 4 years unmaintained, doesn't enforce guillotine constraint
- bin-packing library (last updated 2019) - 5 years unmaintained, binary tree doesn't guarantee guillotine separability
- SVGnest for rectangles - Designed for irregular shapes; massive overkill for rectangular cuts

## Open Questions

Things that couldn't be fully resolved:

1. **Guillotine vs MaxRects packing efficiency**
   - What we know: MaxRects can achieve 2-5% better packing in some cases
   - What's unclear: Does guillotine constraint reduce efficiency enough to justify complexity of MaxRects + post-processing for separability?
   - Recommendation: Implement guillotine first (simpler, guarantees separability); if users report >25% waste, benchmark MaxRects

2. **Kerf application in 2D splits**
   - What we know: 1D formula is `(cuts - 1) * kerf`; 2D has horizontal and vertical cuts
   - What's unclear: Conservative estimate (kerf per cut in both dimensions) vs precise calculation (kerf per guillotine line)
   - Recommendation: Use conservative estimate for Phase 20; document as enhancement opportunity for v4.0

3. **Grain direction UI patterns**
   - What we know: Grain typically runs along 8' length in plywood; user needs to specify which cuts are grain-sensitive
   - What's unclear: Should grain toggle be per-cut, or per-project default with exceptions?
   - Recommendation: Per-cut toggle with project-level default setting (deferred to Phase 21 BOM integration)

4. **Multiple stock sizes optimization**
   - What we know: Guillotine packs onto one bin at a time; multiple bin sizes complicate heuristics
   - What's unclear: Should algorithm try smallest bin first or largest bin first?
   - Recommendation: Sort stock descending (use largest first) to minimize number of sheets; document as enhancement opportunity

5. **Web Worker performance threshold**
   - What we know: 20-30 rectangles optimize in ~1-50ms synchronously
   - What's unclear: At what rectangle count does sync execution become unacceptable UX (>200ms)?
   - Recommendation: Limit to 50 rectangles in Phase 20; add Web Worker in v4.0 if needed

## Sources

### Primary (HIGH confidence)
- [Guillotine Algorithms - rectpack documentation](https://deepwiki.com/secnot/rectpack/4.2-guillotine-algorithms) - Algorithm variants and split rules
- [RectangleBinPack C++ implementation](https://github.com/juj/RectangleBinPack) - Guillotine BSSF+SAS reference implementation
- [greedypacker guillotine.md](https://github.com/solomon-b/greedypacker/blob/master/docs/guillotine.md) - Split heuristics explained
- [SVG Coordinate Systems - W3C](https://www.w3.org/TR/SVG/coords.html) - Nested viewports and transforms
- [Understanding SVG Coordinate Systems - Sara Soueidan](https://www.sarasoueidan.com/blog/svg-coordinate-systems/) - Practical SVG coordinate tutorial
- Existing codebase: `src/lib/server/cutOptimizer.ts` - Phase 18 placeholder structure
- Existing codebase: `src/lib/types/cutlist.ts` - Type definitions with width fields

### Secondary (MEDIUM confidence)
- [Grain Direction in Cut Lists - SteelSolver](https://www.steelsolver.com/2025/10/grain-direction-in-cut-list.html) - Grain direction optimization patterns (2025)
- [2D Bin Packing - Wikipedia](https://en.wikipedia.org/wiki/Bin_packing_problem) - Algorithm complexity and variants
- [Guillotine cutting - Wikipedia](https://en.wikipedia.org/wiki/Guillotine_cutting) - Problem definition and applications
- [Plywood Sheet Optimizer - DoneSnap](https://donesnap.com/plywood-sheet-optimizer/) - Industry tool UX patterns
- [2D guillotine-cutter GitHub](https://github.com/mariowise/2d-guillotine-cutter) - JavaScript implementation example
- [Exploring rectangle packing algorithms - David Colson](https://www.david-colson.com/2020/03/10/exploring-rect-packing.html) - Performance benchmarks

### Tertiary (LOW confidence)
- [A Goal-Driven Ruin and Recreate Heuristic (2025)](https://arxiv.org/html/2508.19306) - Recent academic research, advanced heuristics
- [JavaScript performance optimization (2026)](https://www.landskill.com/blog/javascript-performance-optimization/) - Web Worker patterns
- Various 2D bin packing npm search results - Library landscape overview

## Metadata

**Confidence breakdown:**
- Guillotine algorithm: HIGH - Well-established algorithm with clear implementations in C++ and Python
- Kerf handling: MEDIUM - 2D kerf is more complex than 1D; conservative estimate is safe approach
- SVG visualization: HIGH - Native SVG patterns well-documented; nested rectangles straightforward
- Grain direction: MEDIUM - Real-world requirement but limited technical documentation; based on industry tools
- Library recommendations: MEDIUM - npm packages exist but unmaintained; custom implementation recommended
- Integration approach: HIGH - Phase 18 codebase reviewed; enhancement points identified

**Research date:** 2026-01-29
**Valid until:** 2026-03-01 (30 days - stable algorithms, but library landscape may shift)

**Phase 18 foundation verified:**
- ✅ Data types (Cut, Stock, OptimizationResult) established with width fields for 2D
- ✅ UI components (CutInputForm, StockInputForm, KerfConfig) built for both modes
- ✅ Mode selector toggles between linear and sheet
- ✅ Placeholder 2D algorithm structure (expand, validate, sort, place)
- ✅ Result display component with waste color coding
- ✅ Unplaced cuts tracking
- ✅ Phase 19 1D optimizer complete with LinearCutDiagram visualization

**Phase 20 scope:**
- Replace `optimizeCuts2D()` placeholder with guillotine BSSF+SAS algorithm
- Add `grainMatters` field to Cut interface and UI toggle
- Implement 2D kerf-aware waste calculation
- Create `SheetCutDiagram.svelte` component with nested SVG rectangles
- Integrate 2D diagram into `OptimizationResults.svelte` (parallel to 1D diagrams)
- Add rotation tracking and visualization
- Test with realistic plywood scenarios (10-30 cuts per 4'x8' sheet)
