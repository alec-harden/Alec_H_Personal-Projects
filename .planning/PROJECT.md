# WoodShop Toolbox

## What This Is

A modular web application hosting personal woodworking tools. The first tool is a Bill of Materials (BOM) generator that uses AI-powered guided prompts to help plan woodworking projects and generate comprehensive material lists. Designed as a plug-and-play platform where new tools can be easily added via a dashboard interface.

## Core Value

Generate accurate, complete bills of materials for woodworking projects through intelligent guided questioning — reducing planning time and ensuring nothing is forgotten.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Platform Architecture**
- [ ] Dashboard home page with tool cards for navigation
- [ ] Modular tool architecture allowing plug-and-play addition of new tools
- [ ] Responsive design for desktop and tablet use
- [ ] Cloud deployment with persistent data storage
- [ ] Single-user authentication with design for future multi-user support

**BOM Generator - Core Flow**
- [ ] Guided prompt workflow: project type → dimensions → joinery → materials → etc.
- [ ] AI-powered material suggestions using configurable LLM provider
- [ ] Project templates that guide AI suggestions (table, cabinet, shelf, etc.)
- [ ] Generate comprehensive BOM covering lumber, hardware, finishes, consumables

**BOM Generator - Editing**
- [ ] Edit quantities for any material
- [ ] Add custom materials not suggested by AI
- [ ] Toggle visibility on items (greyed out, excluded from export and totals)
- [ ] Group materials by category (Lumber, Hardware, Finishes, Consumables)

**BOM Generator - Persistence & Export**
- [ ] Save BOMs for later access and editing
- [ ] Export BOM to CSV
- [ ] View saved project history

### Out of Scope

- Real-time collaboration — single user focus for v1
- Mobile app — web-first, responsive design sufficient
- Pricing/cost estimation — may add later, not v1
- Inventory tracking — separate tool if needed
- Cut list optimization — separate tool if needed
- 3D visualization — complexity not justified for v1

## Context

**Domain:** Personal woodworking project planning. User is a hobbyist woodworker who wants to streamline the planning phase of projects.

**First tool priority:** BOM generator is the flagship tool. Platform architecture should support it well but remain generic enough for future tools.

**AI integration:** The BOM generator needs to understand woodworking terminology, common project types, standard material dimensions, and typical hardware requirements. Templates provide domain knowledge, AI provides reasoning and flexibility.

**Future tools (not in scope but informs architecture):**
- Cut list optimizer
- Project cost estimator
- Wood movement calculator
- Finish compatibility checker

## Constraints

- **Deployment:** Cloud hosted (Vercel, Railway, or similar) — must be accessible from any device
- **AI Provider:** Must support multiple LLM providers (Claude, GPT, etc.) — avoid vendor lock-in
- **Budget:** Personal project, minimize ongoing costs (serverless preferred)
- **Tech Stack:** Recommend modern full-stack framework suitable for modular architecture

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Guided prompts over free-form input | More structured = more complete BOMs, easier for AI to process | — Pending |
| AI + templates hybrid | Pure AI might miss domain specifics; pure templates too rigid | — Pending |
| Dashboard with tool cards | Clear visual organization, easy to add new tools | — Pending |
| Category-based material grouping | Matches how woodworkers think about and purchase materials | — Pending |
| Toggle visibility vs delete | Non-destructive editing, user can reconsider hidden items | — Pending |
| Design for multi-user | Small upfront cost, avoids painful refactor later | — Pending |
| Configurable LLM provider | Flexibility as AI landscape evolves, cost optimization | — Pending |

---
*Last updated: 2026-01-16 after initialization*
