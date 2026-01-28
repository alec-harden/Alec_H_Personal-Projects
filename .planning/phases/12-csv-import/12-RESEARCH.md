# Phase 12: CSV Import - Research

**Researched:** 2026-01-28
**Domain:** CSV parsing, file upload UX, data validation
**Confidence:** HIGH

## Summary

CSV import for BOM creation involves three major concerns: file upload handling, CSV parsing with validation, and round-trip compatibility with the existing export format. The standard approach uses PapaParse for robust client-side parsing with comprehensive error reporting, SvelteKit form actions for file upload, and a validation layer that ensures imported data matches the BOM schema.

The project already has a well-defined CSV export format (RFC 4180 compliant) with columns: Category, Name, Quantity, Unit, Description, Notes. Import must parse this exact format and validate against the BOM schema (name, quantity, unit, category required). Client-side parsing provides immediate feedback while server-side validation ensures security.

**Primary recommendation:** Use PapaParse 5.x for client-side parsing with header detection and dynamic typing, implement both drag-and-drop and button upload options for accessibility, validate on both client and server sides, and reuse the existing BOMDisplay component for editing imported BOMs.

## Standard Stack

The established libraries/tools for CSV import in web applications:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PapaParse | 5.4.1+ | CSV parsing | Industry standard, RFC 4180 compliant, excellent error handling, 2M+ weekly npm downloads |
| @types/papaparse | 5.5.2+ | TypeScript types | Official DefinitelyTyped types, actively maintained (updated Jan 2026) |
| FileReader API | Native | File content reading | Browser-native, universally supported, no dependencies |
| SvelteKit FormData | Native | Server file upload | Built into SvelteKit form actions, handles multipart/form-data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | Existing | ID generation | Generate IDs for imported BOM items (already in project) |
| Drizzle ORM | Existing | BOM persistence | Save imported BOMs (Phase 10 infrastructure) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PapaParse | csv-parse (Node) | Server-side only, no browser support, loses immediate feedback |
| Client-side parsing | Server-only parsing | Better security but worse UX, no real-time validation feedback |
| FileReader API | Fetch API | For remote files only, not applicable to user uploads |

**Installation:**
```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

## Architecture Patterns

### Recommended File Upload Flow
```
┌─────────────────┐
│  User Action    │
│  (Drop/Select)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Client-Side     │
│ - Read file     │ ← FileReader API
│ - Parse CSV     │ ← PapaParse
│ - Validate      │ ← Schema check
│ - Show preview  │ ← BOMDisplay component
└────────┬────────┘
         │
         ▼ (User confirms)
┌─────────────────┐
│ Server Action   │
│ - Re-validate   │ ← Never trust client
│ - Save to DB    │ ← Existing Phase 10 flow
└─────────────────┘
```

### Recommended Project Structure
```
src/routes/bom/new/
├── +page.svelte              # Add CSV upload option
├── +page.server.ts           # Load projects (existing)
└── +server.ts                # NEW: CSV validation endpoint (optional)

src/lib/components/bom/
├── BOMDisplay.svelte         # Reuse for imported BOMs
├── CSVUpload.svelte          # NEW: Upload UI component
└── CSVPreview.svelte         # NEW: Validation feedback component

src/lib/utils/
├── csv.ts                    # Existing: export utilities
└── csv-import.ts             # NEW: import & validation utilities
```

### Pattern 1: Client-Side Parsing with Validation

**What:** Parse CSV in browser, validate immediately, show errors before any server request

**When to use:** All CSV imports (immediate feedback is critical for UX)

**Example:**
```typescript
// Source: PapaParse documentation + project patterns
import Papa from 'papaparse';
import type { BOMItem, BOMCategory } from '$lib/types/bom';

interface CSVRow {
  Category: string;
  Name: string;
  Quantity: string;
  Unit: string;
  Description?: string;
  Notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  code: string;
}

export function parseCSV(file: File): Promise<{
  items: BOMItem[];
  errors: ValidationError[];
}> {
  return new Promise((resolve) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const errors: ValidationError[] = [];
        const items: BOMItem[] = [];

        // Collect Papa Parse errors
        results.errors.forEach(err => {
          errors.push({
            row: err.row + 2, // +2 for header and 0-index
            field: 'structure',
            message: err.message,
            code: err.code
          });
        });

        // Validate each row
        results.data.forEach((row, index) => {
          const rowErrors = validateRow(row, index + 2);
          errors.push(...rowErrors);

          if (rowErrors.length === 0) {
            items.push(rowToBOMItem(row, index));
          }
        });

        resolve({ items, errors });
      },
      error: (error) => {
        resolve({
          items: [],
          errors: [{
            row: 0,
            field: 'file',
            message: error.message,
            code: 'FILE_ERROR'
          }]
        });
      }
    });
  });
}
```

### Pattern 2: Two-Phase Validation

**What:** Client validates for UX, server re-validates for security

**When to use:** Always (never trust client-side validation alone)

**Example:**
```typescript
// Client side: Immediate feedback
const { items, errors } = await parseCSV(file);
if (errors.length > 0) {
  showErrors(errors); // Show inline
  return;
}

// Show preview with BOMDisplay component
showPreview(items);

// Server side: Form action or API endpoint
export const actions = {
  import: async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('csv') as File;

    // Re-validate on server
    const { items, errors } = await parseCSVServer(file);

    if (errors.length > 0) {
      return fail(400, { errors });
    }

    // Save using Phase 10 infrastructure
    const bomId = await saveBOM({ items, ... });
    return { success: true, bomId };
  }
};
```

### Pattern 3: Drag-and-Drop with Fallback Button

**What:** Primary drag-and-drop interface with visible button for accessibility

**When to use:** All file uploads (both methods required for inclusive UX)

**Example:**
```svelte
<script lang="ts">
  let dragging = $state(false);
  let fileInput: HTMLInputElement;

  function handleDrop(e: DragEvent) {
    dragging = false;
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) processFile(file);
  }
</script>

<div
  class="upload-zone"
  class:dragging
  ondragover={(e) => { e.preventDefault(); dragging = true; }}
  ondragleave={() => dragging = false}
  ondrop={handleDrop}
>
  <input
    bind:this={fileInput}
    type="file"
    accept=".csv,text/csv"
    onchange={handleFileSelect}
    hidden
  />

  <p>Drag and drop CSV file here</p>
  <button onclick={() => fileInput.click()}>
    Or click to browse
  </button>
</div>
```

### Anti-Patterns to Avoid

- **Server-only parsing with no preview:** Users need to see what will be imported before confirmation
- **No error row numbers:** Generic "invalid CSV" is useless; always show row + column + reason
- **Accepting all file types:** Validate file extension and MIME type (text/csv)
- **Loading entire large CSV into memory:** Use streaming for files >10MB (PapaParse supports this)
- **No encoding declaration:** Always specify UTF-8, handle BOM if present

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Regex split on commas | PapaParse | Quoted fields, escaped quotes, multiline values, encoding issues |
| Header normalization | Manual trim/lowercase | PapaParse transformHeader | Handles edge cases, whitespace variants, case sensitivity |
| File reading | Fetch API for local files | FileReader API | Fetch is for remote files; FileReader is for user uploads |
| Duplicate detection | Simple array comparison | Map with composite keys | O(n²) vs O(n), handles large datasets |
| Date parsing | new Date(string) | Explicit format validation | User dates are unreliable; validate format first |
| Error messages | Generic "invalid" | Row+column+reason | Users can't fix problems without specifics |

**Key insight:** CSV parsing has 40+ years of edge cases (Excel quirks, encoding issues, malformed quotes). PapaParse handles all of them. Custom parsers break on real-world data.

## Common Pitfalls

### Pitfall 1: Missing or Mismatched Headers

**What goes wrong:** CSV has wrong column names or missing required columns, parser fails silently or maps data incorrectly

**Why it happens:** Users export from different tools, rename columns, or manually create CSVs

**How to avoid:**
- Validate headers immediately after parsing
- Check for required columns: Category, Name, Quantity, Unit
- Case-insensitive matching with trim (PapaParse transformHeader)
- Show clear error: "Missing required column 'Category'. Found: Category1, Name, Qty"

**Warning signs:**
- Items have undefined or null values for required fields
- Parser succeeds but item count is zero
- Column order differs from export format

### Pitfall 2: UTF-8 BOM and Encoding Issues

**What goes wrong:** Excel on Windows saves CSV with UTF-8 BOM (0xEF 0xBB 0xBF), causing first header to be "\uFEFFCategory" instead of "Category"

**Why it happens:** Excel adds BOM to UTF-8 files for proper character display, but JavaScript FileReader includes BOM in text

**How to avoid:**
- Strip BOM from file content before parsing
- Use `transformHeader: (h) => h.replace(/^\uFEFF/, '').trim()`
- Test with Excel-exported CSV (download from BOM export, open in Excel, save, re-import)

**Warning signs:**
- First column header validation fails despite looking correct
- Header name shows strange characters when logged
- Import works from text editor but fails from Excel

### Pitfall 3: Column Count Mismatches

**What goes wrong:** CSV has more/fewer columns than headers, PapaParse reports "TooManyFields" or "TooFewFields" errors

**Why it happens:** Unescaped commas in data, missing quotes around fields, trailing commas

**How to avoid:**
- Enable PapaParse error callback: captures all field mismatches
- Show specific row numbers and expected vs actual column counts
- Validate that quoted fields are properly closed
- Check for trailing commas in rows

**Warning signs:**
- Error code "TooManyFields" or "TooFewFields" in Papa Parse errors array
- Data appears shifted (name in quantity column, etc.)
- Last column always empty

### Pitfall 4: Client-Side Only Validation

**What goes wrong:** Malicious user bypasses client validation, sends invalid data to server

**Why it happens:** Developer assumes client validation is sufficient, forgets server is public API

**How to avoid:**
- Always re-validate on server (form action or API endpoint)
- Use same validation logic on client and server (shared utility function)
- Server returns 400 Bad Request with detailed errors if validation fails
- Never trust file type from client (validate content structure, not just extension)

**Warning signs:**
- No validation in server-side form action
- Database errors on malformed data (should be caught before DB)
- Server accepts any POST payload without checking structure

### Pitfall 5: No Preview Before Import

**What goes wrong:** User imports CSV, realizes it's wrong after data is saved, wants to undo

**Why it happens:** Import flow goes directly from upload to save without confirmation

**How to avoid:**
- Show parsed items in BOMDisplay component BEFORE saving
- Add explicit "Confirm Import" button after preview
- Allow editing imported items before save (reuse existing editing features)
- Provide "Cancel" option to discard import without saving

**Warning signs:**
- No intermediate state between upload and save
- User complaints about "wrong data imported"
- No way to review parsed data

### Pitfall 6: Large File Memory Issues

**What goes wrong:** 50MB CSV crashes browser, UI freezes during parse

**Why it happens:** Loading entire file into memory, blocking main thread

**How to avoid:**
- Set file size limit (e.g., 10MB) with clear error message
- For large files, use PapaParse streaming mode with `step` callback
- Show progress indicator during parse (PapaParse progress events)
- Consider server-side parsing for files >10MB

**Warning signs:**
- Browser "Page Unresponsive" warning
- UI freezes during upload
- Out of memory errors in console

## Code Examples

Verified patterns for common operations:

### CSV Validation Function
```typescript
// Source: Research synthesis + PapaParse docs
import type { BOMCategory } from '$lib/types/bom';

const VALID_CATEGORIES: BOMCategory[] = ['lumber', 'hardware', 'finishes', 'consumables'];

function validateRow(row: CSVRow, rowNumber: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!row.Name?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'Name',
      message: 'Name is required',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!row.Category?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'Category',
      message: 'Category is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    // Validate category value
    const category = row.Category.toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(category as BOMCategory)) {
      errors.push({
        row: rowNumber,
        field: 'Category',
        message: `Invalid category '${row.Category}'. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
        code: 'INVALID_CATEGORY'
      });
    }
  }

  if (!row.Quantity?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'Quantity',
      message: 'Quantity is required',
      code: 'REQUIRED_FIELD'
    });
  } else {
    // Validate quantity is a number
    const qty = parseFloat(row.Quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push({
        row: rowNumber,
        field: 'Quantity',
        message: `Invalid quantity '${row.Quantity}'. Must be a positive number`,
        code: 'INVALID_NUMBER'
      });
    }
  }

  if (!row.Unit?.trim()) {
    errors.push({
      row: rowNumber,
      field: 'Unit',
      message: 'Unit is required',
      code: 'REQUIRED_FIELD'
    });
  }

  return errors;
}
```

### Converting CSV Row to BOMItem
```typescript
// Source: Project schema + existing BOM types
import { nanoid } from 'nanoid';

function rowToBOMItem(row: CSVRow, position: number): BOMItem {
  return {
    id: nanoid(),
    name: row.Name.trim(),
    description: row.Description?.trim() || undefined,
    quantity: parseFloat(row.Quantity),
    unit: row.Unit.trim(),
    category: row.Category.toLowerCase().trim() as BOMCategory,
    notes: row.Notes?.trim() || undefined,
    hidden: false,
    // Position is used by database schema for ordering
    position
  };
}
```

### Round-Trip CSV Format Verification
```typescript
// Source: Existing csv.ts export format
// Headers must exactly match export format for round-trip compatibility
const EXPECTED_HEADERS = ['Category', 'Name', 'Quantity', 'Unit', 'Description', 'Notes'];

function validateHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const normalizedHeaders = headers.map(h => h.trim());

  // Check for required columns (first 4 are required)
  const requiredHeaders = EXPECTED_HEADERS.slice(0, 4);

  for (const required of requiredHeaders) {
    if (!normalizedHeaders.some(h => h.toLowerCase() === required.toLowerCase())) {
      errors.push({
        row: 1,
        field: required,
        message: `Missing required column '${required}'`,
        code: 'MISSING_HEADER'
      });
    }
  }

  return errors;
}
```

### File Type Validation
```typescript
// Source: Web security best practices
function validateFile(file: File): string | null {
  // Check file extension
  const validExtensions = ['.csv'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

  if (!hasValidExtension) {
    return 'File must be a CSV (.csv extension)';
  }

  // Check MIME type (note: can be spoofed, but good first check)
  const validTypes = ['text/csv', 'text/plain', 'application/csv'];
  if (!validTypes.includes(file.type) && file.type !== '') {
    return `Invalid file type '${file.type}'. Must be text/csv`;
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB`;
  }

  // Empty file check
  if (file.size === 0) {
    return 'File is empty';
  }

  return null; // Valid
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-only CSV parsing | Client-side parsing with server validation | ~2015 | Immediate feedback, better UX |
| Manual CSV split regex | RFC 4180 compliant parsers | ~2014 | Handles quoted fields, edge cases |
| Button-only upload | Drag-and-drop + button | ~2018 | Faster workflow, accessibility |
| Generic error messages | Row+column+reason errors | ~2020 | Users can fix issues |
| UTF-8 only | UTF-8 with BOM handling | ~2016 | Excel compatibility |
| Synchronous parsing | Async with progress | ~2019 | Large file support, responsive UI |

**Deprecated/outdated:**
- **jQuery CSV plugins**: Modern libraries don't need jQuery dependency
- **Server-side only validation**: Client validation is now expected for UX
- **XHR file uploads**: Use native FormData with fetch or SvelteKit form actions
- **File size in browser LocalStorage**: Use File API directly, never serialize files to storage

## Open Questions

Things that couldn't be fully resolved:

1. **Duplicate Row Detection**
   - What we know: Duplicate detection is a common CSV import feature
   - What's unclear: Whether to detect duplicates within uploaded CSV or against existing BOMs
   - Recommendation: Phase 12 v1 - no duplicate detection (YAGNI). User can review preview before import. Consider for future enhancement if requested.

2. **CSV Column Flexibility**
   - What we know: Export format uses "Description" and "Notes" (optional columns)
   - What's unclear: Should import accept CSVs without these columns? Alternate column names?
   - Recommendation: Require exact header match for round-trip compatibility. Show helpful error if headers don't match with suggestion to use export format.

3. **Import from Non-Export Sources**
   - What we know: Users might want to import from other tools (Excel inventory, lumber calculators)
   - What's unclear: Support arbitrary CSV formats or only exported BOMs?
   - Recommendation: Phase 12 v1 - only support exported BOM format. Document format in help text. Consider flexible mapping for Phase 13+.

4. **Quantity Decimal Precision**
   - What we know: Database stores quantity as integer, but lumber often uses fractional board feet
   - What's unclear: How to handle "2.5 bf" in CSV import when DB expects integer
   - Recommendation: Review database schema. If quantity is integer, validate CSV quantities are whole numbers or update schema to use real numbers (better for lumber).

## Sources

### Primary (HIGH confidence)
- [PapaParse Official Documentation](https://www.papaparse.com/docs) - Parser configuration, error handling, type conversion
- [@types/papaparse npm](https://www.npmjs.com/package/@types/papaparse) - TypeScript definitions v5.5.2, updated Jan 2026
- [SvelteKit Form Actions](https://svelte.dev/docs/kit/form-actions) - Official SvelteKit file upload patterns
- Existing project code: src/lib/utils/csv.ts (export format), src/lib/types/bom.ts (schema)

### Secondary (MEDIUM confidence)
- [PapaParse Browser File Upload Error Handling](https://github.com/mholt/PapaParse/issues/644) - Community discussion on error handling patterns
- [CSV Import Best Practices - Flatfile](https://flatfile.com/blog/top-6-csv-import-errors-and-how-to-fix-them/) - Common errors and solutions
- [CSV Validation Best Practices - OneSchema](https://www.oneschema.co/blog/building-a-csv-uploader) - 5 best practices for CSV uploaders
- [File Upload UX Best Practices - Uploadcare](https://uploadcare.com/blog/file-uploader-ux-best-practices/) - Drag-drop vs button UX patterns
- [CSV Encoding Issues - Microsoft Support](https://support.microsoft.com/en-us/office/opening-csv-utf-8-files-correctly-in-excel-8a935af5-3416-4edd-ba7e-3dfd2bc4a032) - UTF-8 BOM handling in Excel

### Tertiary (LOW confidence)
- [Client-Side vs Server-Side Validation](https://www.packetlabs.net/posts/input-validation/) - Security considerations (general, not CSV-specific)
- [CSV File Size Limits](https://rowzero.com/blog/common-csv-errors) - Various platform limits (contextual reference)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PapaParse is industry standard, 2M+ weekly downloads, TypeScript types official
- Architecture: HIGH - Patterns verified against PapaParse docs, SvelteKit docs, existing project structure
- Pitfalls: HIGH - Common errors from Flatfile research, verified with PapaParse GitHub issues
- Round-trip compatibility: HIGH - Existing export format is well-defined in csv.ts

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (60 days - stable domain, PapaParse mature library)
**Library versions verified:** PapaParse 5.4.1, @types/papaparse 5.5.2 (current as of Jan 2026)
