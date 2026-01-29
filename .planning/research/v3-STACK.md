# Technology Stack Additions for v3.0

**Project:** WoodShop Toolbox
**Milestone:** v3.0 Multi-User & Cut Optimizer
**Researched:** 2026-01-29
**Confidence:** MEDIUM-HIGH (versions verified via npm registry; API patterns from training data)

## Existing Stack (DO NOT MODIFY)

These are validated and working. No changes needed:

| Technology | Version | Purpose |
|------------|---------|---------|
| SvelteKit | ^2.49.1 | Framework |
| Svelte | ^5.45.6 | UI (runes) |
| Tailwind CSS | ^4.1.18 | Styling |
| Drizzle ORM | ^0.45.1 | Database |
| @libsql/client | ^0.17.0 | Turso/LibSQL |
| ai (Vercel AI SDK) | ^6.0.42 | AI integration |
| oslo | ^1.2.1 | Crypto utilities |
| @node-rs/argon2 | ^2.0.2 | Password hashing |
| zod | ^4.3.5 | Validation |
| papaparse | ^5.5.3 | CSV parsing |

---

## NEW: Transactional Email

### Recommendation: Resend

| Technology | Version | Purpose |
|------------|---------|---------|
| resend | ^6.9.1 | Email delivery API |

**Version verified:** `npm view resend version` = 6.9.1

**Why Resend:**
1. **Developer experience** - Clean API, excellent TypeScript types
2. **Free tier** - 3,000 emails/month (sufficient for personal project growth)
3. **No SMTP complexity** - API-based, no server configuration
4. **Modern approach** - Built for serverless, works well with SvelteKit
5. **Simple integration** - Single package, minimal setup

**Alternatives Considered:**

| Service | Version | Why Not |
|---------|---------|---------|
| nodemailer | 7.0.13 | Requires SMTP server; more complex setup; overkill for transactional email |
| @sendgrid/mail | 8.1.6 | Works but heavier SDK; more complex configuration |
| postmark | 4.0.5 | Good but smaller ecosystem; Resend has simpler API |
| @aws-sdk/client-ses | 3.978.0 | AWS complexity overkill; requires IAM setup |

**Integration Pattern:**

```typescript
// src/lib/server/email.ts
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${env.PUBLIC_BASE_URL}/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: 'WoodShop Toolbox <noreply@yourdomain.com>',
    to: email,
    subject: 'Verify your email',
    html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'WoodShop Toolbox <noreply@yourdomain.com>',
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`
  });
}
```

---

## NEW: Drag-and-Drop

### Recommendation: svelte-dnd-action

| Technology | Version | Purpose |
|------------|---------|---------|
| svelte-dnd-action | ^0.9.69 | Drag-and-drop for cut assignment |

**Version verified:** `npm view svelte-dnd-action version` = 0.9.69
**Svelte 5 compatibility verified:** `npm info svelte-dnd-action peerDependencies` = `{ svelte: '>=3.23.0 || ^5.0.0-next.0' }`

**Why svelte-dnd-action:**
1. **Svelte 5 support** - Peer dependency explicitly supports Svelte 5
2. **List-based DnD** - Perfect for assigning cuts to stock materials
3. **Accessibility** - Keyboard navigation built-in
4. **Active maintenance** - Regular updates, version 0.9.69 is recent
5. **Proven** - Most widely used Svelte DnD library

**Alternatives Considered:**

| Library | Version | Why Not |
|---------|---------|---------|
| @neodrag/svelte | 2.3.3 | Better for free-form dragging; svelte-dnd-action better for list operations |
| Native HTML5 DnD | - | Poor UX, no touch support, accessibility issues |

**Use Case Fit:**

The Cut List Optimizer needs:
- Drag cuts from a "cuts needed" list to specific stock materials
- Reorder cuts within a material assignment
- Visual feedback during drag operations

`svelte-dnd-action` handles all these with its zone-based approach:

```svelte
<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';

  interface Cut {
    id: string;
    name: string;
    length: number;
  }

  let cuts = $state<Cut[]>([
    { id: '1', name: 'Table leg', length: 28 },
    { id: '2', name: 'Rail', length: 24 }
  ]);

  function handleSort(e: CustomEvent<{ items: Cut[] }>) {
    cuts = e.detail.items;
  }
</script>

<div
  use:dndzone={{ items: cuts }}
  on:consider={handleSort}
  on:finalize={handleSort}
  class="space-y-2"
>
  {#each cuts as cut (cut.id)}
    <div class="p-2 bg-amber-100 rounded">{cut.name} - {cut.length}"</div>
  {/each}
</div>
```

---

## NEW: Cut Optimization Algorithms

### Recommendation: Custom Implementation

**DO NOT add a library.** Implement algorithms directly.

**Why custom implementation:**
1. **Domain specificity** - Woodworking cut optimization has unique constraints (kerf, grain direction) that generic bin-packing libraries don't handle
2. **Simplicity** - 1D bin packing (First Fit Decreasing) is ~50 lines of code
3. **Control** - Need to show intermediate steps for visualization
4. **Educational value** - Users want to understand the optimization
5. **Existing libraries are wrong fit** - They're designed for sprite sheets, not lumber

**Libraries Evaluated (NOT RECOMMENDED):**

| Library | Version | Why Not |
|---------|---------|---------|
| maxrects-packer | 2.7.3 | "A max rectangle 2d bin packer for packing glyphs or images into multiple sprite-sheet/atlas" - wrong domain |
| bin-pack | 1.0.2 | Abandoned (published 2016-02-26); no kerf support |
| bin-packer | 1.7.0 | Generic knapsack solver; doesn't model cut sequences |
| potpack | 2.1.0 | Square packing for textures; wrong domain |
| guillotine-packer | 1.0.2 | Closest fit but still sprite-focused; no woodworking constraints |

**Version sources:** All verified via `npm view [package] version` and `npm search` on 2026-01-29.

### 1D Optimization (Linear/Board Cuts)

**Algorithm:** First Fit Decreasing (FFD)

```typescript
// src/lib/optimizer/linear.ts
interface Cut {
  id: string;
  length: number;
  label: string;
}

interface Stock {
  id: string;
  length: number;
  available: number; // remaining after cuts
  cuts: Cut[];
}

interface OptimizationResult {
  stocks: Stock[];
  waste: number;
  efficiency: number;
}

export function optimizeLinear(
  cuts: Cut[],
  stockLength: number,
  kerf: number = 0.125 // 1/8" blade
): OptimizationResult {
  // Sort cuts by length descending (FFD)
  const sorted = [...cuts].sort((a, b) => b.length - a.length);

  const stocks: Stock[] = [];

  for (const cut of sorted) {
    const cutWithKerf = cut.length + kerf;

    // Find first stock that fits
    let placed = false;
    for (const stock of stocks) {
      if (stock.available >= cutWithKerf) {
        stock.cuts.push(cut);
        stock.available -= cutWithKerf;
        placed = true;
        break;
      }
    }

    // No fit, add new stock
    if (!placed) {
      stocks.push({
        id: crypto.randomUUID(),
        length: stockLength,
        available: stockLength - cutWithKerf,
        cuts: [cut]
      });
    }
  }

  const totalStock = stocks.length * stockLength;
  const totalCuts = cuts.reduce((sum, c) => sum + c.length, 0);
  const waste = totalStock - totalCuts;

  return {
    stocks,
    waste,
    efficiency: (totalCuts / totalStock) * 100
  };
}
```

### 2D Optimization (Sheet Cuts)

**Algorithm:** Guillotine Cutting with Best Fit

```typescript
// src/lib/optimizer/sheet.ts
interface Rectangle {
  id: string;
  width: number;
  height: number;
  label: string;
}

interface Placement {
  rect: Rectangle;
  x: number;
  y: number;
  rotated: boolean;
}

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SheetResult {
  placements: Placement[];
  freeRects: FreeRect[];
  waste: number;
}

export function optimizeSheet(
  rects: Rectangle[],
  sheetWidth: number,
  sheetHeight: number,
  kerf: number = 0.125,
  allowRotation: boolean = true
): SheetResult[] {
  // Sort by area descending
  const sorted = [...rects].sort((a, b) =>
    (b.width * b.height) - (a.width * a.height)
  );

  const sheets: SheetResult[] = [];

  // Guillotine algorithm:
  // 1. Start with full sheet as one free rectangle
  // 2. For each piece, find best-fit free rectangle
  // 3. Place piece, split free rectangle into 2 new free rects
  // 4. Repeat until all pieces placed or no fit

  // Implementation approximately 100-150 lines
  // Not trivial but well-documented algorithm

  return sheets;
}
```

**Why this approach works for woodworking:**
- Kerf is a first-class parameter
- Grain direction can be enforced (allowRotation = false for certain woods)
- Step-by-step results enable diagram visualization
- Can add defect avoidance later

---

## NEW: SVG Diagram Generation

### Recommendation: Native SVG (No Library)

**DO NOT add a library.** Use native SVG in Svelte components.

**Why native SVG:**
1. **Svelte excellence** - Svelte handles SVG natively with reactive bindings
2. **Simple requirements** - Cut diagrams are rectangles with labels; no complex paths
3. **Bundle size** - Zero additional bytes
4. **Flexibility** - Full control over styling, animation, interactivity

**Libraries Evaluated (NOT RECOMMENDED):**

| Library | Version | Why Not |
|---------|---------|---------|
| @svgdotjs/svg.js | 3.2.5 | Imperative API; fights Svelte's reactive model |
| d3 | - | Massive overkill; designed for data visualization, not simple diagrams |
| paper.js | - | Canvas-based; loses SVG benefits (scalability, CSS styling) |

**Implementation Pattern:**

```svelte
<!-- src/lib/components/CutDiagram.svelte -->
<script lang="ts">
  interface Cut {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  }

  interface Props {
    stockWidth: number;
    stockHeight: number;
    cuts: Cut[];
    scale?: number;
  }

  let { stockWidth, stockHeight, cuts, scale = 4 }: Props = $props();

  const svgWidth = $derived(stockWidth * scale);
  const svgHeight = $derived(stockHeight * scale);
</script>

<svg
  viewBox="0 0 {stockWidth} {stockHeight}"
  width={svgWidth}
  height={svgHeight}
  class="border border-amber-700 bg-amber-50"
>
  <!-- Stock outline -->
  <rect
    x="0" y="0"
    width={stockWidth}
    height={stockHeight}
    fill="#fef3c7"
    stroke="#b45309"
    stroke-width="0.5"
  />

  <!-- Cut pieces -->
  {#each cuts as cut}
    <g>
      <rect
        x={cut.x}
        y={cut.y}
        width={cut.width}
        height={cut.height}
        fill="#fcd34d"
        stroke="#92400e"
        stroke-width="0.25"
      />
      <text
        x={cut.x + cut.width / 2}
        y={cut.y + cut.height / 2}
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="2"
        fill="#78350f"
      >
        {cut.label}
      </text>
    </g>
  {/each}
</svg>
```

**Benefits:**
- Reactive updates when cuts change
- CSS styling with Tailwind classes
- Export to PNG/SVG via browser APIs if needed later
- Touch/click handlers for interactive editing

---

## Summary: What to Install

```bash
npm install resend svelte-dnd-action
```

That's it. Two dependencies for v3.0.

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| resend | ^6.9.1 | Transactional email | HIGH (npm verified) |
| svelte-dnd-action | ^0.9.69 | Drag-and-drop UI | HIGH (npm verified, Svelte 5 peer dep confirmed) |

**DO NOT install:**
- Any bin-packing library (custom implementation better for woodworking domain)
- Any SVG library (native SVG with Svelte is cleaner)
- nodemailer (Resend is simpler for transactional email)
- d3 (overkill for rectangles and labels)

---

## Environment Variables to Add

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxx

# Base URL for email links (used in verification and reset emails)
PUBLIC_BASE_URL=https://yourdomain.com
```

---

## Schema Changes Required

For v3.0 features, the database schema needs additions. These integrate with existing Drizzle schema in `src/lib/server/schema.ts`.

### RBAC Fields on Users

```typescript
// Modify existing users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),           // NEW: 'admin' | 'user'
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false), // NEW
  disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false),            // NEW
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

### Email Verification Tokens

```typescript
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

### Password Reset Tokens

```typescript
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});
```

### Lumber Dimensions on BOM Items (Optional)

```typescript
// Modify existing bomItems table - add optional dimension fields
export const bomItems = sqliteTable('bom_items', {
  // ... existing fields ...
  lengthInches: real('length_inches'),   // NEW: nullable for non-lumber
  widthInches: real('width_inches'),     // NEW
  thicknessInches: real('thickness_inches'), // NEW
});
```

### Cut Lists Tables

```typescript
export const cutLists = sqliteTable('cut_lists', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  mode: text('mode').notNull(), // 'linear' | 'sheet'
  kerfWidth: real('kerf_width').notNull().default(0.125), // stored in inches
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const cutListStock = sqliteTable('cut_list_stock', {
  id: text('id').primaryKey(),
  cutListId: text('cut_list_id')
    .notNull()
    .references(() => cutLists.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  length: real('length').notNull(),
  width: real('width'),           // null for 1D (linear) mode
  quantity: integer('quantity').notNull().default(1),
  position: integer('position').notNull()
});

export const cutListCuts = sqliteTable('cut_list_cuts', {
  id: text('id').primaryKey(),
  cutListId: text('cut_list_id')
    .notNull()
    .references(() => cutLists.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  length: real('length').notNull(),
  width: real('width'),           // null for 1D cuts
  quantity: integer('quantity').notNull().default(1),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  position: integer('position').notNull()
});
```

---

## Installation Commands

```bash
# Install v3.0 dependencies
npm install resend svelte-dnd-action

# Push schema changes to database
npm run db:push
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| resend | HIGH | Version 6.9.1 verified via npm registry |
| svelte-dnd-action | HIGH | Version 0.9.69 verified; Svelte 5 peer dep confirmed via npm info |
| Cut optimization (custom) | MEDIUM | Algorithm well-known (FFD); implementation is straightforward |
| SVG diagrams (native) | HIGH | Svelte SVG support is well-documented |
| Schema changes | HIGH | Extension of existing Drizzle patterns already in codebase |

---

## Sources

**All versions verified via npm registry on 2026-01-29:**

```bash
npm view resend version                    # 6.9.1
npm view svelte-dnd-action version         # 0.9.69
npm info svelte-dnd-action peerDependencies # { svelte: '>=3.23.0 || ^5.0.0-next.0' }
npm view nodemailer version                # 7.0.13
npm view @sendgrid/mail version            # 8.1.6
npm view postmark version                  # 4.0.5
npm view @aws-sdk/client-ses version       # 3.978.0
npm view @neodrag/svelte version           # 2.3.3
npm info @neodrag/svelte peerDependencies  # { svelte: '^3.0.0 || ^4.0.0 || ^5.0.0' }
npm view maxrects-packer version           # 2.7.3
npm view bin-pack version                  # 1.0.2
npm view bin-packer version                # 1.7.0
npm view potpack version                   # 2.1.0
npm view guillotine-packer version         # 1.0.2
npm view @svgdotjs/svg.js version          # 3.2.5
```

**Pattern recommendations based on:**
- Existing v2.0 codebase patterns in `src/lib/server/`
- SvelteKit and Svelte 5 documentation patterns from training data
- Standard bin packing algorithm literature (First Fit Decreasing)
