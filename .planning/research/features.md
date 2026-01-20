# Feature Research: WoodShop Toolbox

*Research Date: 2026-01-20*

## Summary

Research into existing woodworking software, BOM generators, and AI assistants reveals clear feature patterns. The WoodShop Toolbox should differentiate through **guided AI conversation** rather than form-filling, while supporting standard BOM/material list capabilities.

---

## Existing Solutions Landscape

### Professional CAD Tools
- [SOLIDWORKS for Makers](https://www.solidworks.com/solution/solidworks-makers/cad-woodworking-software) — Full 3D CAD with cut lists, BOMs, joinery visualization ($48/year)
- [Autodesk Fusion](https://www.autodesk.com/solutions/design-manufacturing/consumer-products/woodworking-furniture-design-software) — Auto-generates cutlists and BOMs from 3D designs, CNC integration
- [SketchList 3D](https://sketchlist.com/woodworking/) — Woodworking-specific design with purchase reports and cost estimates

### Cut List Optimizers
- [CutList Plus](https://cutlistplus.com/) — Sheet layout optimizer for panels and lumber
- [optiCutter](https://www.opticutter.com/linear-cut-list-calculator) — Linear cut optimization with minimal waste
- [Offcuts](https://hoopsoup.com/) — Multi-material cut calculator with pricing reports

### AI Woodworking Assistants
- [Woodworking Plans AI](https://www.toolify.ai/tool/woodworking-plans-ai) — Chat assistant + measurement converter + cutting list generator
- [Woodworking Pro GPT](https://www.yeschat.ai/gpts-9t557p0dqNj-Woodworking-Pro) — Material selection guidance, project calculators

### Business/Manufacturing
- [projetc.ai](https://projetc.ai/) — CRM/ERP with automatic procurement and BOM management ($250/mo)
- [OpenBOM](https://www.openbom.com/) — PLM/inventory/purchasing for manufacturing teams

---

## Gap Analysis: Where WoodShop Toolbox Fits

| Existing Solutions | Gap |
|-------------------|-----|
| CAD tools (SOLIDWORKS, Fusion) | Require 3D modeling skills; overkill for simple projects |
| Cut optimizers (CutList Plus) | Assume you already know what you need |
| AI assistants (GPTs) | Chat-only, no persistence, hallucination risk on calculations |
| Business tools (projetc.ai) | Enterprise pricing, complexity overkill |

**WoodShop Toolbox opportunity**: Guided AI that *asks the right questions* to generate complete BOMs without requiring CAD skills or prior knowledge of exact materials needed.

---

## BOM Generator: Core Features

### Standard BOM Components
Based on [WoodBin's BOM guide](https://woodbin.com/ref/project-design-and-planning/bill-of-materials/), a complete BOM includes:

| Category | Items |
|----------|-------|
| **Lumber** | Species, dimensions (T×W×L), quantity, board feet |
| **Sheet Goods** | Plywood type, thickness, sheet count |
| **Hardware** | Screws, nails, hinges, brackets, knobs, slides |
| **Finishes** | Stain, paint, polyurethane, oil |
| **Consumables** | Glue, sandpaper, tape, brushes |
| **Specialty** | Joinery hardware, edge banding, veneer |

### Material Categories to Support

**Lumber** (from [Home Depot lumber guide](https://www.homedepot.com/c/ab/types-of-lumber/9ba683603be9fa5395fab90567851db)):
- Dimensional lumber: 2×4, 2×6, 2×8, 2×10, 4×4
- Hardwoods: Oak, maple, walnut, cherry, hickory, birch
- Softwoods: Pine, cedar, fir, spruce

**Sheet Goods**:
- Plywood: 1/4", 1/2", 3/4" in 4×8 sheets
- MDF, particle board, melamine
- Hardwood plywood (cabinet grade)

**Hardware** (from [McFeely's guide](https://www.mcfeelys.com/guide-to-woodworking-screws) and [Quickscrews](https://quickscrews.com/selecting-proper-woodworking-screws-any-project)):
- Screws: Wood screws, pocket hole screws, cabinet screws, deck screws
- Nails: Finish nails, brad nails, construction nails
- Hinges: Butt hinges, European hinges, piano hinges, concealed hinges
- Brackets: Corner brackets, angle brackets, shelf brackets, joist hangers
- Other: Drawer slides, knobs/pulls, catches, levelers

---

## Guided Prompt Workflow

### Question Flow for BOM Generation

```
1. PROJECT TYPE
   "What are you building?"
   → Table, cabinet, shelf, bench, box, frame, outdoor furniture, other

2. DIMENSIONS
   "What size?" (context-aware based on project type)
   → For table: top dimensions, height
   → For cabinet: width, height, depth
   → For shelf: length, depth, number of shelves

3. JOINERY METHOD
   "How will you join the pieces?"
   → Pocket holes, dowels, mortise & tenon, biscuits, screws only, nails

4. MATERIAL PREFERENCES
   "What materials do you want to use?"
   → Wood species preferences
   → Sheet goods vs solid wood
   → Budget constraints

5. FINISH
   "How will you finish it?"
   → Stain + poly, paint, oil, leave natural, outdoor finish

6. HARDWARE NEEDS
   "What hardware features?"
   → Doors/drawers → hinges, slides, pulls
   → Adjustable → shelf pins
   → Structural → brackets, connectors
```

### AI Suggestion Opportunities

At each step, AI can suggest:
- Standard dimensions based on [furniture design standards](https://woodbin.com/ref/furniture-design/)
- Appropriate wood species for the application
- Hardware requirements based on project type
- Finish compatibility with wood species
- Common "don't forget" items (wood filler, sandpaper grits, etc.)

---

## Project Templates

### Template Structure
Each template provides:
1. Default dimensions (customizable)
2. Required components list
3. Common joinery options
4. Typical hardware needs
5. Suggested materials by skill/budget level

### Priority Templates (v1)

| Template | Complexity | Components |
|----------|------------|------------|
| **Simple Shelf** | Beginner | Boards, brackets, screws |
| **Basic Table** | Beginner | Top, aprons, legs, fasteners |
| **Storage Cabinet** | Intermediate | Case, doors, shelves, hinges, pulls |
| **Bookshelf** | Intermediate | Sides, shelves, back panel, shelf pins |
| **Workbench** | Intermediate | Top, legs, stretchers, vise hardware |
| **Drawer Cabinet** | Advanced | Case, drawers, slides, face frame |

### Template Data Model

```typescript
interface ProjectTemplate {
  id: string;
  name: string;
  category: 'storage' | 'seating' | 'table' | 'outdoor' | 'shop';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  defaultDimensions: Dimensions;
  components: ComponentTemplate[];
  joineryOptions: JoineryOption[];
  hardwareCategories: HardwareCategory[];
  finishSuggestions: string[];
  aiPromptHints: string[]; // Context for AI suggestions
}
```

---

## Export & Persistence Features

### Export Formats
- **CSV**: Compatible with spreadsheets, easy to print
- **PDF**: Formatted shopping list (future enhancement)
- **JSON**: For data portability

### Data to Persist
- Project metadata (name, date, notes)
- All BOM line items with quantities
- User modifications (added items, adjusted quantities)
- Hidden/excluded items (non-destructive toggle)
- AI conversation history (for context if user returns)

---

## Differentiation: AI-Guided vs Form-Based

### Traditional Form Approach (competitors)
```
[Dropdown: Project Type]
[Input: Width] [Input: Height] [Input: Depth]
[Dropdown: Wood Species]
[Button: Generate]
```

### WoodShop Toolbox Approach
```
AI: "What are you building today?"
User: "A simple bookshelf for my office"
AI: "Great! How tall are you thinking? Standard bookcases are
     usually 30-84 inches. Any specific height in mind?"
User: "Maybe 4 feet tall"
AI: "Perfect. How about width and depth? For reference, most
     books are 8-10 inches deep, so 10-12 inch shelves work well."
...continues conversationally...
```

**Benefits**:
- Feels natural, not like filling out a form
- AI can educate users on standards as they go
- Handles ambiguity ("around 4 feet" vs exact 48")
- Can ask follow-up questions based on answers
- More engaging for beginners

**Caution** (from [LumberJocks discussion](https://www.lumberjocks.com/threads/anyone-else-using-ai-for-woodworking-plans-or-cutlists.358722/)):
- LLMs can hallucinate calculations — always verify math
- Use AI for suggestions/guidance, not raw calculations
- Templates provide guardrails for AI suggestions

---

## Future Tool Ideas (Architecture Consideration)

These inform modular architecture but are OUT OF SCOPE for v1:

| Tool | Description |
|------|-------------|
| **Cut List Optimizer** | Minimize waste from sheet goods |
| **Cost Estimator** | Price lookup + total project cost |
| **Wood Movement Calculator** | Seasonal expansion/contraction |
| **Finish Compatibility Checker** | Which finishes work together |
| **Hardware Finder** | "I need a hinge that..." |

---

## Sources

- [WoodBin: Bill of Materials Guide](https://woodbin.com/ref/project-design-and-planning/bill-of-materials/)
- [WoodBin: Furniture Design Standards](https://woodbin.com/ref/furniture-design/)
- [Highland Woodworking: Standard Furniture Dimensions](https://www.highlandwoodworking.com/furnituredimesions.aspx)
- [McFeely's: Guide to Woodworking Screws](https://www.mcfeelys.com/guide-to-woodworking-screws)
- [Quickscrews: Selecting Proper Woodworking Screws](https://quickscrews.com/selecting-proper-woodworking-screws-any-project)
- [Home Depot: Types of Lumber](https://www.homedepot.com/c/ab/types-of-lumber/9ba683603be9fa5395fab90567851db)
- [Woodworking Plans AI](https://www.toolify.ai/tool/woodworking-plans-ai)
- [LumberJocks: AI for Woodworking Discussion](https://www.lumberjocks.com/threads/anyone-else-using-ai-for-woodworking-plans-or-cutlists.358722/)

---

## Recommendations for WoodShop Toolbox

1. **Conversational AI flow** — Differentiate from form-based competitors
2. **Template-backed suggestions** — AI guided by domain knowledge, not hallucinating
3. **Complete BOM categories** — Lumber, hardware, finishes, consumables
4. **Non-destructive editing** — Toggle visibility, don't delete
5. **CSV export first** — Most useful, lowest complexity
6. **Project persistence** — Save and return to projects
7. **Mobile-responsive** — Access shopping list at the store
