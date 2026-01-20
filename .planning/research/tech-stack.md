# Tech Stack Research: WoodShop Toolbox

*Research Date: 2026-01-20*

## Summary

For a modular dashboard application with AI integration and serverless deployment, **SvelteKit + Drizzle ORM** emerges as the recommended stack based on 2026 ecosystem research.

---

## Framework Comparison

| Framework | Bundle Size | Best For | Deployment Flexibility |
|-----------|-------------|----------|------------------------|
| **SvelteKit** | 20-40 KB | Dashboards, SaaS tools, performance-critical apps | 10+ platform adapters |
| Next.js | ~70 KB | Enterprise, large teams, content-heavy sites | Optimized for Vercel |
| Remix | ~50 KB | Form-heavy SaaS, data-intensive apps | Excellent adapter system |

### Why SvelteKit for WoodShop Toolbox

1. **Performance**: Compiles to vanilla JS, no runtime overhead — ideal for responsive dashboard UX
2. **Bundle size**: 50% smaller than React-based alternatives
3. **Modular architecture**: Clean file-based routing supports plug-and-play tool addition
4. **Serverless-ready**: Native adapters for Vercel, Cloudflare Workers, Netlify
5. **Developer experience**: Less boilerplate, faster iteration for solo/small team projects
6. **Growing ecosystem**: 300% YoY job growth; increasingly mainstream choice

### Trade-offs

- Smaller ecosystem than React/Next.js (but sufficient for this project's needs)
- Fewer third-party component libraries
- Learning curve if coming from React

---

## Database: Drizzle ORM

**Recommendation**: Drizzle ORM over Prisma

| Aspect | Drizzle | Prisma |
|--------|---------|--------|
| Schema definition | TypeScript native | Custom DSL |
| Bundle size | Zero dependencies | Larger runtime |
| Edge/serverless | Native support | Requires adapters |
| Type safety | Full end-to-end | Full end-to-end |
| SQL familiarity | SQL-like syntax | Abstracted queries |

### Why Drizzle

1. **Serverless-first**: No dependencies, runs on edge runtimes
2. **TypeScript native**: Schema in TS, no separate schema language
3. **Lightweight**: Perfect for cost-conscious serverless deployment
4. **SQL-like**: Familiar syntax, easy to reason about
5. **SvelteKit integration**: First-class support via `npx sv add drizzle`

---

## Database Options

| Option | Best For | Cost | Notes |
|--------|----------|------|-------|
| **Turso (SQLite)** | Low-cost, edge-distributed | Free tier generous | LibSQL, works great with Drizzle |
| Cloudflare D1 | Cloudflare Workers deployment | Included with Workers | SQLite-compatible |
| Vercel Postgres | Vercel deployment | Free tier limited | PostgreSQL |
| PlanetScale | Scalability needs | Free tier available | MySQL-compatible |
| Supabase | Need auth + storage bundle | Free tier generous | PostgreSQL + extras |

**Recommendation**: **Turso** — generous free tier, edge-distributed, excellent Drizzle support, SQLite simplicity.

---

## Authentication

For single-user (design for multi-user later):

| Option | Complexity | Notes |
|--------|------------|-------|
| **Lucia Auth** | Low | SvelteKit-native, works with any database |
| Auth.js (NextAuth) | Medium | SvelteKit adapter available |
| Clerk | Low | Managed service, cost at scale |
| Supabase Auth | Low | If using Supabase for database |

**Recommendation**: **Lucia Auth** — lightweight, SvelteKit-native, database-agnostic, designed for exactly this use case.

---

## AI Integration

For multi-provider LLM support:

| Option | Notes |
|--------|-------|
| **Vercel AI SDK** | Provider-agnostic, streaming support, works with SvelteKit |
| LangChain.js | More complex, good for chains/agents |
| Direct API calls | Simple but more boilerplate |

**Recommendation**: **Vercel AI SDK** — provider-agnostic (Claude, GPT, etc.), streaming UI support, lightweight.

---

## Proposed Stack

```
┌─────────────────────────────────────────────┐
│  Frontend: SvelteKit                        │
│  ├── UI: Tailwind CSS + shadcn-svelte       │
│  └── State: Svelte stores (built-in)        │
├─────────────────────────────────────────────┤
│  Backend: SvelteKit server routes           │
│  ├── ORM: Drizzle                           │
│  ├── Auth: Lucia                            │
│  └── AI: Vercel AI SDK                      │
├─────────────────────────────────────────────┤
│  Database: Turso (SQLite)                   │
├─────────────────────────────────────────────┤
│  Deployment: Vercel (or Cloudflare)         │
└─────────────────────────────────────────────┘
```

---

## Cost Projection (Monthly)

| Service | Free Tier | Paid Estimate |
|---------|-----------|---------------|
| Vercel | 100GB bandwidth | ~$0 for personal use |
| Turso | 9GB storage, 500M reads | ~$0 for personal use |
| AI API | Pay per token | ~$5-20 depending on usage |

**Estimated monthly cost**: $5-20 (AI tokens only)

---

## Sources

- [Next.js vs Remix vs SvelteKit - 2026 Comparison](https://www.nxcode.io/resources/news/nextjs-vs-remix-vs-sveltekit-2025-comparison)
- [SvelteKit vs Next.js 2026 Deep Dive](https://dev.to/paulthedev/sveltekit-vs-nextjs-in-2026-why-the-underdog-is-winning-a-developers-deep-dive-155b)
- [Drizzle and SvelteKit Integration](https://sveltekit.io/blog/drizzle-sveltekit-integration)
- [SvelteKit with Drizzle and Cloudflare D1](https://www.geekytidbits.com/sveltekit-with-drizzle-and-cloudflare-d1/)
- [Prisma with SvelteKit Guide](https://www.prisma.io/docs/guides/sveltekit)
- [Cloudflare Workers + SvelteKit + Drizzle + D1](https://jilles.me/cloudflare-workers-sveltekit-drizzle-and-d1-up-and-running/)

---

## Decision: CONFIRMED

Tech stack locked in on 2026-01-20:

- [x] **Framework**: SvelteKit
- [x] **Database**: Drizzle + Turso (SQLite)
- [x] **Auth**: Lucia
- [x] **AI SDK**: Vercel AI SDK
