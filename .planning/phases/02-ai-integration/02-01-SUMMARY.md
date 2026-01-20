---
phase: 02-ai-integration
plan: 01
subsystem: ai-infrastructure
tags: [vercel-ai-sdk, anthropic, openai, streaming, sveltekit]

dependency-graph:
  requires: [01-01, 01-02]
  provides: [ai-provider-factory, chat-endpoint, streaming-infrastructure]
  affects: [02-02, 03-01]

tech-stack:
  added:
    - ai@latest
    - "@ai-sdk/svelte@latest"
    - "@ai-sdk/anthropic@latest"
    - "@ai-sdk/openai@latest"
    - zod@latest
  patterns:
    - Provider factory pattern for AI model selection
    - Dynamic environment configuration
    - Streaming text responses with UI message stream

key-files:
  created:
    - src/lib/server/ai.ts
    - src/routes/api/chat/+server.ts
  modified:
    - package.json
    - .env.example

decisions:
  - id: DYNAMIC_ENV
    summary: Used $env/dynamic/private for AI_PROVIDER to allow optional env vars
  - id: WOODWORKING_SYSTEM_PROMPT
    summary: Chat endpoint includes domain-specific system prompt for BOM assistance

metrics:
  duration: 5m
  completed: 2026-01-20
---

# Phase 2 Plan 1: AI SDK Setup Summary

**One-liner:** Vercel AI SDK with provider factory pattern and streaming /api/chat endpoint for woodworking BOM assistance

## What Was Built

### AI Provider Factory
- Installed Vercel AI SDK packages (ai, @ai-sdk/svelte, @ai-sdk/anthropic, @ai-sdk/openai, zod)
- Created `src/lib/server/ai.ts` with `getModel()` factory function
- Supports Anthropic Claude and OpenAI GPT-4o via `AI_PROVIDER` environment variable
- Uses `$env/dynamic/private` for optional environment configuration (defaults to anthropic)

### Streaming Chat Endpoint
- Created `POST /api/chat` endpoint at `src/routes/api/chat/+server.ts`
- Accepts `{ messages: [...] }` body format
- Returns streaming response using `result.toUIMessageStreamResponse()`
- Includes woodworking-focused system prompt for BOM generation assistance

### Environment Configuration
- Updated `.env.example` with AI configuration documentation:
  - `AI_PROVIDER` (anthropic | openai)
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/server/ai.ts` | AI provider factory with getModel() function |
| `src/routes/api/chat/+server.ts` | Streaming chat endpoint |
| `.env.example` | AI configuration documentation |

## Decisions Made

### Dynamic Environment Import
- **Decision:** Use `$env/dynamic/private` instead of `$env/static/private`
- **Rationale:** Static imports fail when variable is not defined; dynamic allows optional vars with defaults
- **Trade-off:** Slightly less type-safe, but more flexible for development

### Woodworking System Prompt
- **Decision:** Embedded domain-specific system prompt in chat endpoint
- **Rationale:** Consistent context for BOM-related conversations
- **Content:** "You are a helpful woodworking assistant that helps users create bills of materials..."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Static environment import failure**
- **Found during:** Task 1 verification
- **Issue:** `$env/static/private` import of AI_PROVIDER fails when variable not defined in .env
- **Fix:** Changed to `$env/dynamic/private` which allows optional variables with fallback defaults
- **Files modified:** src/lib/server/ai.ts
- **Commit:** 472862b

## Verification Results

All verification criteria passed:
- [x] `npm run build` succeeds without errors
- [x] `npm run check` passes TypeScript validation (0 errors, 0 warnings)
- [x] `src/lib/server/ai.ts` exports `getModel` function
- [x] `src/routes/api/chat/+server.ts` exports POST handler
- [x] `.env.example` documents AI_PROVIDER and API key variables

## Next Phase Readiness

**Ready for 02-02:** Chat UI Component
- Streaming endpoint ready for UI integration
- @ai-sdk/svelte installed for client-side chat hooks
- API contract established (POST /api/chat with messages array)

**Ready for 03-01:** BOM Core Flow
- AI infrastructure in place
- System prompt establishes woodworking domain context
- Provider switchable via environment for testing

## Commits

| Hash | Message |
|------|---------|
| 40c6d2f | feat(02-01): add Vercel AI SDK with provider factory |
| 472862b | feat(02-01): add streaming chat endpoint with woodworking assistant |
