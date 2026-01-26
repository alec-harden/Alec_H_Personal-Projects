# Feature Landscape: v2.0

**Domain:** Document persistence, user authentication, and content management for BOM generator
**Researched:** 2026-01-26
**Confidence:** MEDIUM (based on established UX patterns, not v2.0-specific research)

## Context

This research covers NEW features being added to an existing BOM generator application. The app already has:
- Dashboard with tool cards
- AI-powered 4-step wizard for BOM creation
- 6 project templates (table, cabinet, shelf, workbench, box, chair)
- Inline editing, visibility toggles, CSV export

**Single-user context:** This is a personal tool with only one user. Authentication is about session persistence and protecting data, not multi-user collaboration.

**Dependency note:** All persistence features require authentication to be in place first.

---

## Authentication

### Table Stakes

Features users expect in any authentication system. Missing these = product feels incomplete or insecure.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email + password signup | Standard auth method for personal apps | Low | Single-user, so no email verification needed initially |
| Login with session persistence | Users expect to stay logged in | Low | Cookie-based session, 30-day default |
| Logout | Clear way to end session | Low | Single button, clears session |
| Password requirements display | Security guidance during signup | Low | Show min length, character requirements inline |
| "Remember me" checkbox | Convenience for personal device | Low | Extends session to 30 days vs 1 day |
| Password visibility toggle | Reduce typos during input | Low | Eye icon to show/hide password field |
| Invalid credentials error | Clear feedback on login failure | Low | Generic message (don't reveal if email exists) |
| Redirect to intended page | After login, go where user wanted | Medium | Store original destination, redirect post-auth |

### Differentiators

Features that enhance UX but aren't expected. Nice to have.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Password reset flow | Users forget passwords | Medium | Email magic link or temp password |
| Password strength indicator | Visual feedback during signup | Low | Color-coded bar (weak/medium/strong) |
| Automatic logout warning | Warn before session expires | Medium | Toast notification 5min before expiry |
| Login activity log | See recent sessions for security | Medium | Store login timestamps, IP, device |
| Change password (while logged in) | Update credentials without reset flow | Low | Requires current password confirmation |

### Anti-Features

Features to explicitly NOT build for single-user personal app.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Email verification on signup | Unnecessary for single user | Skip verification, allow immediate login |
| Multi-factor authentication | Overkill for personal tool | Single password sufficient |
| Social OAuth (Google, GitHub) | Adds complexity, single user doesn't need it | Email/password only |
| Account recovery questions | Poor security practice | Password reset via email only |
| Password complexity enforcement | Annoying for personal use | Suggest strength, don't enforce |
| CAPTCHA on login/signup | No bot problem for single user | Skip entirely |

---

## Project Management

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| List all saved projects | Users need to find their work | Low | Sorted by last modified (most recent first) |
| Create new project | Entry point to workflow | Low | Launches existing 4-step wizard |
| Open/load saved project | Access past work for viewing/editing | Low | Click to load BOM into editor |
| Delete project | Remove unwanted projects | Low | Confirm dialog before deletion |
| Project name display | Identify projects at a glance | Low | Show name + timestamp in list |
| Empty state message | First-time users see helpful prompt | Low | "No projects yet. Create your first BOM!" |
| Last modified timestamp | Know which projects are recent | Low | "Last edited 2 hours ago" style |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Search/filter projects | Find specific project quickly | Medium | Search by name, filter by template type |
| Duplicate project | Start new project from existing BOM | Low | "Save as copy" function |
| Archive vs delete | Non-destructive organization | Medium | Archived projects hidden from main list |
| Sort options | View by date, name, or template type | Low | Dropdown or column headers |
| Project count display | See total projects at a glance | Low | "15 saved projects" header |
| Bulk operations | Select multiple for delete/archive | Medium | Checkboxes + action bar |
| Grid vs list view toggle | User preference for density | Low | Icons to switch layout |
| Project thumbnail/preview | Visual identification | High | Generated from BOM summary (defer to later) |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Folders/nested organization | Overkill for single user, adds complexity | Tags or filters instead (if needed) |
| Project sharing | No multi-user support | N/A |
| Project templates (UX) | Already have BOM templates, not project templates | Use existing BOM templates |
| Commenting on projects | Single user doesn't need comments | Personal notes field instead (optional) |
| Project permissions | Single user, no access control needed | Skip entirely |

---

## BOM Persistence

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Save BOM during creation | Don't lose work in wizard | Medium | Auto-save after each step |
| Save edited BOM | Persist manual changes | Low | Save button after editing |
| Load BOM with full state | Restore all materials, quantities, visibility | Medium | Deserialize from database |
| Update existing BOM | Overwrite previously saved BOM | Low | UPDATE query with new data |
| Associate BOM with project | 1 project = 1 BOM (for now) | Low | Foreign key relationship |
| Preserve material categories | Lumber, Hardware, Finishes, Consumables | Low | Store category with each item |
| Preserve visibility state | Remember which items user hid | Low | Store 'hidden' boolean per item |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-save indicator | Visual feedback that work is saved | Low | "Saving..." → "Saved 2 seconds ago" |
| Unsaved changes warning | Prevent accidental data loss | Medium | Prompt before navigating away |
| Version history | See past revisions of BOM | High | Store snapshots on each save |
| Restore previous version | Undo major changes | High | Requires version history |
| Save-as-new from existing | Fork a BOM into new project | Low | Duplicate with new project ID |
| Export history | Track which BOMs were exported when | Medium | Log export events with timestamp |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time sync across devices | Single user, unnecessary complexity | Standard save/load on page refresh |
| Offline support | Web-first, requires complex sync logic | Online-only acceptable |
| Collaborative editing | Single user app | N/A |
| Manual version creation | Too much overhead for personal use | Auto-snapshot on major edits only (if versioning) |
| Conflict resolution | No multi-device concurrent editing | Last-write-wins acceptable |

---

## Template Admin

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| List all templates | See what templates exist | Low | Display 6 current templates |
| Create new template | Add more project types | Medium | Form for name, category, system prompt |
| Edit template | Fix mistakes, improve prompts | Medium | Load into form, save changes |
| Delete template | Remove unwanted templates | Low | Confirm dialog (check if projects use it) |
| Template name + description | Identify template purpose | Low | Display in list view |
| System prompt editing | Core template behavior | Medium | Textarea for prompt text |
| Active/inactive toggle | Disable without deleting | Low | Boolean flag, hide from user-facing picker |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Duplicate template | Start new template from existing | Low | Copy all fields to new template |
| Preview template | Test before activating | Medium | Run sample BOM generation |
| Template usage count | See which templates are popular | Low | Count projects using each template |
| Template categories | Organize templates (furniture, storage, etc.) | Medium | Tag-based categorization |
| Rich text prompt editor | Formatted prompts easier to read | Medium | Markdown editor for system prompts |
| Template reordering | Control display order in picker | Medium | Drag-and-drop or numeric sort order |
| Import/export templates | Share templates across instances | Medium | JSON export/import (for backup) |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Template marketplace | Single user, no sharing | N/A |
| Template versioning | Templates change infrequently | Simple edit overwrites |
| Template permissions | Single admin user | All templates editable |
| Template preview thumbnails | Unnecessary complexity | Text name + description sufficient |
| Template analytics | Overkill for personal use | Basic usage count sufficient |

---

## CSV Import

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| File upload interface | Standard way to import | Low | File input or drag-and-drop |
| CSV parsing | Handle RFC 4180 format | Medium | Use library (Papa Parse or csv-parse) |
| Column mapping | Map CSV columns to BOM fields | Medium | Dropdown to match "Item" → Material, "Qty" → Quantity |
| Validation errors display | Show what's wrong with data | Medium | List errors by row number |
| Import preview | See data before committing | Medium | Table showing parsed rows |
| Required field validation | Ensure material name, quantity exist | Low | Flag missing required fields |
| Data type validation | Quantity must be numeric | Low | Check types, flag invalid rows |
| Success confirmation | Feedback after import | Low | "15 items imported successfully" |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-detect columns | Smart mapping based on headers | Medium | Match common names (Item/Material, Qty/Quantity) |
| Duplicate detection | Warn if material already exists | Medium | Compare material names, offer merge/skip |
| Category auto-assignment | Infer category from material type | Medium | Pattern matching ("Oak board" → Lumber) |
| Invalid row handling | Choose to skip or fix | Medium | Allow import with errors skipped |
| Import to existing BOM | Add items vs replace all | Medium | Radio button: "Replace" or "Append" |
| Sample CSV download | Help users format correctly | Low | Provide template CSV file |
| Bulk edit after import | Fix multiple rows at once | Medium | Table editor before finalizing |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Excel/XLSX import | CSV is standard, Excel adds complexity | Export Excel to CSV first |
| Import from URL | Unnecessary for personal use | Local file upload only |
| Scheduled imports | No automation needed | Manual import sufficient |
| Import history | Overkill for infrequent use | Skip tracking import events |
| Advanced mapping rules | Too complex for simple BOMs | Basic column mapping sufficient |
| Import validation rules editor | User doesn't need to customize | Hardcode sensible validations |

---

## Feature Dependencies

```
Authentication (FOUNDATION)
    ↓
Project Management (requires user context)
    ↓
BOM Persistence (requires project container)
    ↓
Template Admin (independent, but requires auth)
    ↓
CSV Import (enhances BOM editing, requires persistence)
```

**Critical path:** Auth → Projects → Persistence
**Parallel tracks:** Template Admin can be built alongside Projects
**Enhancement:** CSV Import builds on existing BOM editing

---

## MVP Recommendation

For v2.0 MVP, prioritize table stakes features only:

### Phase 1: Authentication Foundation
1. Email/password signup
2. Login with session persistence
3. Logout
4. Password visibility toggle
5. Redirect to intended page

**Defer:** Password reset (add in v2.1), password strength indicator

### Phase 2: Project Management
1. List all saved projects
2. Create new project (existing wizard)
3. Open/load saved project
4. Delete project with confirmation
5. Project name + timestamp display
6. Empty state message

**Defer:** Search/filter, duplicate, archive, sorting

### Phase 3: BOM Persistence
1. Save BOM during creation (auto-save each step)
2. Save edited BOM (explicit save button)
3. Load BOM with full state
4. Associate BOM with project (1:1)
5. Preserve categories + visibility state

**Defer:** Version history, auto-save indicator, unsaved changes warning

### Phase 4: Template Admin
1. List all templates
2. Create new template
3. Edit template (name, description, system prompt)
4. Delete template (with usage check)
5. Active/inactive toggle

**Defer:** Duplicate, preview, usage stats, categories

### Phase 5: CSV Import (Enhancement)
1. File upload interface
2. CSV parsing (RFC 4180)
3. Column mapping UI
4. Validation + error display
5. Import preview table
6. Import to new BOM

**Defer:** Auto-detect columns, duplicate detection, category inference, import to existing

---

## Complexity Assessment

| Feature Area | Overall Complexity | Riskiest Part | Mitigation |
|--------------|-------------------|---------------|------------|
| Authentication | Low-Medium | Session management, security | Use proven library (Lucia, Auth.js) |
| Project Management | Low | Mostly CRUD operations | Straightforward database queries |
| BOM Persistence | Medium | Serializing/deserializing complex BOM state | Schema design for materials table |
| Template Admin | Low-Medium | System prompt editing, validation | JSON schema for template structure |
| CSV Import | Medium | Parsing edge cases, validation UX | Use battle-tested CSV library |

**Highest complexity:** BOM Persistence (data model for materials, categories, relationships)
**Lowest complexity:** Project Management (standard CRUD)
**Most unknown:** Authentication library integration with SvelteKit

---

## Implementation Notes

### Authentication
- **Library recommendation:** Lucia (SvelteKit-native) or Auth.js/SvelteKit
- **Session storage:** Database table (sessions) vs cookie-only
- **Password hashing:** bcrypt or argon2

### Project Management
- **Data model:** `projects` table already exists in schema.ts
- **UI pattern:** Card grid (dashboard) + table view (list)
- **Sorting:** Default to `updatedAt DESC`

### BOM Persistence
- **Data model:**
  - `projects` (existing) → `boms` (1:1 for now) → `bom_items` (many)
  - Store wizard state (template, dimensions, joinery, materials) separately
- **Serialization:** JSON column for wizard state vs normalized tables
- **Categories:** Enum or string field on bom_items

### Template Admin
- **Data model:** `templates` table (id, name, description, systemPrompt, active, createdAt)
- **Seeding:** Migrate existing 6 hardcoded templates to database
- **Validation:** Ensure systemPrompt is valid text, name is unique

### CSV Import
- **Library:** Papa Parse (client-side) or csv-parse (server-side)
- **Validation:** Required fields (material name, quantity), optional (category, unit, notes)
- **Error handling:** Collect all errors, display with row numbers, allow partial import
- **Column mapping:** Persist user's mapping preferences (localStorage) for convenience

---

## Sources

**Confidence: MEDIUM**

This research is based on established UX patterns and industry-standard practices for authentication, CRUD interfaces, and data import workflows. No external sources were consulted due to tool restrictions. Recommendations are informed by:

- Common patterns in SaaS applications (project management tools, document editors)
- Authentication best practices (OWASP guidelines, accessibility standards)
- CSV import patterns (Google Sheets, Airtable, Notion)
- Admin panel conventions (WordPress, Strapi, Payload CMS)

**Verification needed:**
- SvelteKit-specific authentication library comparison (Lucia vs Auth.js vs custom)
- CSV parsing library performance with large files (10K+ rows)
- Database schema design for BOM relationships (1:1 vs 1:many for future expansion)

**Next steps:**
- Research authentication libraries specifically for SvelteKit (Context7 or official docs)
- Validate CSV import UX with user testing
- Confirm database schema supports future multi-BOM-per-project expansion
