# Phase 7: Tech Debt Cleanup - Research

**Researched:** 2026-01-23
**Domain:** File deletion and dependency cleanup
**Confidence:** HIGH

## Summary

Phase 7 is a straightforward tech debt cleanup phase targeting orphaned chat interface files from the Phase 2→3 architecture pivot. During Phase 3 implementation, the BOM generation approach shifted from a free-form chat interface to a structured 4-step wizard for better UX and more complete BOMs. The original chat implementation (`/bom` page, `/api/chat` endpoint, and supporting components) was never removed.

The v1 Milestone Audit (2026-01-22) formally identified this tech debt. All target files still exist in the codebase, are buildable, but completely unreachable from the user flow. The dashboard links to `/bom/new` (wizard entry) exclusively, making the `/bom` chat page inaccessible.

**Primary recommendation:** Remove all four identified files and optionally remove the `@ai-sdk/svelte` package dependency, which is only used by the orphaned chat page.

## Standard Stack

No new libraries or tools needed for this phase. This is pure file deletion and import cleanup.

### Tools Already Available

| Tool | Purpose | Already Installed |
|------|---------|-------------------|
| git | Version control for tracking deletions | ✓ Yes |
| npm | Package management (optional dep removal) | ✓ Yes |
| TypeScript/svelte-check | Verify no broken imports remain | ✓ Yes (via `npm run check`) |
| Vite | Build verification | ✓ Yes (via `npm run build`) |

### Optional Dependency Cleanup

| Package | Current Usage | Removal Candidate |
|---------|---------------|-------------------|
| `@ai-sdk/svelte` | Only imported in orphaned `/bom` page | YES - safe to remove |
| `ai` | Used by `/api/bom/generate` endpoint | NO - keep (active) |
| `@ai-sdk/anthropic` | Used by AI provider factory | NO - keep (active) |
| `@ai-sdk/openai` | Used by AI provider factory | NO - keep (active) |

**Note:** The `@ai-sdk/svelte` package (v4.0.42) provides the `Chat` class used exclusively by the orphaned chat page. The current wizard-based BOM flow uses the `ai` package's `generateObject()` function instead, which doesn't require `@ai-sdk/svelte`.

## Architecture Patterns

### File Deletion Safety Pattern

For SvelteKit applications, safe file deletion follows this sequence:

1. **Identify all imports** - Search codebase for references to files being deleted
2. **Delete route files** - Remove SvelteKit route pages and endpoints
3. **Delete component files** - Remove orphaned Svelte components
4. **Verify build** - Run `npm run build` to catch broken imports
5. **Verify type checking** - Run `npm run check` to catch TypeScript errors
6. **Clean dependencies** - Remove npm packages if no longer used

### Current Routing Structure

The BOM tool routing architecture after Phase 3 pivot:

```
src/routes/
├── +page.svelte              # Dashboard (links to /bom/new)
├── bom/
│   ├── +page.svelte         # ORPHANED - chat UI (unreachable)
│   └── new/
│       └── +page.svelte     # Active wizard entry point
└── api/
    ├── chat/
    │   └── +server.ts       # ORPHANED - chat endpoint (unused)
    └── bom/
        └── generate/
            └── +server.ts   # Active BOM generation endpoint
```

**Dashboard navigation:**
- Line 85: `<a href="/bom/new">` - "New Project" action
- Line 105: `<a href="/bom/new">` - "Start New Build" card
- Line 126: `<ToolCard href="/bom/new">` - BOM Generator tool card

All three entry points direct to `/bom/new` (wizard), not `/bom` (chat).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Import detection | Manual grep/search | TypeScript compiler (`npm run check`) | Catches all broken imports, not just grep matches |
| Dependency usage detection | Manual package.json audit | `npm ls <package>` + codebase search | Shows full dependency tree, prevents breaking transitive deps |
| Build verification | Manual testing | CI/CD build step | Automated verification prevents regression |

**Key insight:** TypeScript's type checker is the authoritative source for detecting broken imports. If `npm run check` passes after deletion, no broken references remain.

## Common Pitfalls

### Pitfall 1: Deleting Files Before Checking Imports

**What goes wrong:** Delete files first, then discover dozens of broken imports scattered across the codebase.

**Why it happens:** Assumption that "unreachable" means "unreferenced." A route might be unreachable from the UI but still imported by other code.

**How to avoid:**
1. Search for imports BEFORE deletion: `grep -r "ChatMessage\|ChatInput" src/`
2. Search for route references: `grep -r "/api/chat\|/bom['\"]" src/`
3. Verify findings match expectations

**Warning signs:** If grep shows more than expected matches, investigate before proceeding.

### Pitfall 2: Removing Used Dependencies

**What goes wrong:** Remove `@ai-sdk/svelte` from package.json, then discover another file uses it after Phase 7.

**Why it happens:** Package might be used by code outside the obvious scope.

**How to avoid:**
1. Search codebase for ALL imports: `grep -r "@ai-sdk/svelte" src/`
2. Check if package appears in other package.json scripts
3. Verify `npm ls @ai-sdk/svelte` shows only the orphaned usage

**Warning signs:** If grep returns matches outside the four target files, investigate further.

### Pitfall 3: Not Verifying Build After Deletion

**What goes wrong:** Files deleted, git committed, then build breaks in CI/CD.

**Why it happens:** Skipping verification steps to save time.

**How to avoid:**
1. ALWAYS run `npm run build` after file deletion
2. ALWAYS run `npm run check` after file deletion
3. Fix any errors before committing

**Warning signs:** If you're about to skip verification "because it's simple," STOP and verify anyway.

### Pitfall 4: Orphaned Route Confusion

**What goes wrong:** Delete `/bom/+page.svelte` but forget that SvelteKit auto-generates types for routes. TypeScript errors appear in seemingly unrelated files.

**Why it happens:** SvelteKit's generated `.svelte-kit/types/` directory includes types for all routes.

**How to avoid:**
1. Run `npm run dev` briefly after deletion (regenerates types)
2. Then run `npm run check` to verify types are correct
3. Understand that route deletions trigger type regeneration

**Warning signs:** Type errors mentioning `.svelte-kit/types/` after route deletion.

## Code Examples

Verified patterns from the cleanup workflow:

### Search for Component Imports

```bash
# Source: Git grep pattern for Svelte component imports
# Find all imports of ChatMessage or ChatInput components
grep -r "import.*ChatMessage\|import.*ChatInput" src/

# Expected result for Phase 7: Only src/routes/bom/+page.svelte
```

### Search for Route References

```bash
# Source: Git grep pattern for route paths
# Find all references to /api/chat endpoint or /bom route
grep -r "/api/chat\|href=['\"]*/bom['\"]" src/

# Expected result: No direct /bom route references (all link to /bom/new)
```

### Verify Dependency Usage

```bash
# Source: npm ls command for dependency trees
# Check if package is used elsewhere in the project
npm ls @ai-sdk/svelte

# Expected output:
# alec-h-personal-projects@0.0.1
# └── @ai-sdk/svelte@4.0.42

# If only one instance appears, package can be safely removed
```

### Build and Type Check Verification

```bash
# Source: SvelteKit standard verification commands
# Run after file deletion to verify no broken imports
npm run build && npm run check

# Both must succeed with no errors before committing
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chat-based BOM generation | Guided 4-step wizard | Phase 3 (2026-01-20) | Better UX, more complete BOMs |
| `@ai-sdk/svelte` Chat class | `ai` package generateObject() | Phase 3 (2026-01-20) | Structured output vs streaming chat |
| Free-form prompting | Template-driven prompts | Phase 3 (2026-01-20) | Consistent material categories |
| `/bom` route | `/bom/new` route | Phase 3 (2026-01-20) | Clear "new project" intent |

**Deprecated/outdated:**
- `/bom` route - Replaced by `/bom/new` wizard entry point
- `/api/chat` endpoint - Replaced by `/api/bom/generate` structured generation
- `ChatMessage.svelte` and `ChatInput.svelte` - Replaced by BOMWizard component and step-based UI
- `@ai-sdk/svelte` Chat class - Functionality replaced by AI SDK's generateObject() for structured output

## Open Questions

No open questions for this phase. All files are clearly identified and verified as orphaned.

## Sources

### Primary (HIGH confidence)

- **v1 Milestone Audit** (.planning/v1-MILESTONE-AUDIT.md) - Official identification of tech debt
- **Codebase verification** (2026-01-23) - Direct inspection confirmed all four files exist
- **Build output verification** (2026-01-23) - `npm run build` succeeds, confirming files are buildable but unreferenced
- **Import search** (2026-01-23) - grep confirmed ChatMessage/ChatInput only imported by orphaned /bom page
- **Route search** (2026-01-23) - grep confirmed no direct /bom route references in codebase

### Secondary (MEDIUM confidence)

- **Dashboard navigation** (src/routes/+page.svelte) - All links verified to point to /bom/new
- **Phase 2 summary** (.planning/phases/02-ai-integration/02-01-SUMMARY.md) - Documents original chat endpoint creation
- **Phase 3 plan** (.planning/phases/03-bom-core-flow/03-02-PLAN.md) - Documents pivot to structured generation

### Tertiary (LOW confidence)

- None required for this phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - File deletion requires no new tools
- Architecture: HIGH - Direct codebase inspection, verified routing structure
- Pitfalls: HIGH - Standard TypeScript/SvelteKit deletion patterns, well-documented

**Research date:** 2026-01-23
**Valid until:** Indefinite (file deletion patterns don't change frequently)

## Files to Remove

Based on v1 Milestone Audit and verified through codebase inspection:

1. **src/routes/bom/+page.svelte** (7,180 bytes)
   - Orphaned chat UI page
   - Imports ChatMessage and ChatInput components
   - Imports `@ai-sdk/svelte` Chat class
   - Unreachable (dashboard links to /bom/new instead)

2. **src/routes/api/chat/+server.ts** (570 bytes)
   - Orphaned chat endpoint
   - Uses `streamText()` from `ai` package
   - Unused (wizard uses /api/bom/generate instead)

3. **src/lib/components/ChatMessage.svelte** (2,465 bytes)
   - Orphaned chat message bubble component
   - Only imported by src/routes/bom/+page.svelte
   - No other references in codebase

4. **src/lib/components/ChatInput.svelte** (4,300 bytes)
   - Orphaned chat input component
   - Only imported by src/routes/bom/+page.svelte
   - No other references in codebase

**Total to remove:** 4 files, ~14.5 KB of orphaned code

## Verification Checklist

Before deletion:
- [x] All four files exist and are accessible
- [x] No imports of ChatMessage outside /bom page
- [x] No imports of ChatInput outside /bom page
- [x] No references to /api/chat endpoint in codebase
- [x] No direct /bom route links (all point to /bom/new)
- [x] Build succeeds with orphaned files present

After deletion (for planner to verify):
- [ ] `npm run build` succeeds without errors
- [ ] `npm run check` passes with 0 errors, 0 warnings
- [ ] Application starts and runs without errors
- [ ] Dashboard navigation to /bom/new still works
- [ ] Git history preserved (files deleted, not lost)
