---
description: This file describes the master plan and guidelines for the project. All information about the project should be included here.
applyTo: **
---

# Reforge Master Specification

## 1. Project Overview & Product Thesis

**Name:** reforge

**Tagline:** Raw LLM output reforged into clean data.

**The Problem:** LLMs are probabilistic and frequently output malformed JSON (markdown wrappers, trailing commas, unquoted keys, truncated outputs). Developers must manually integrate with each provider's SDK, handle retries themselves, and deal with different response formats across OpenAI, Anthropic, Google, OpenRouter, and dozens more.

**The Solution:** A zero-dependency TypeScript library with an optional provider layer. The core `guard()` function natively repairs syntactical errors in microseconds and strictly enforces semantic types via Zod. The `forge()` function provides end-to-end structured output: call any LLM provider → guard → auto-retry — with a single unified API.

---

## 2. The SDK (reforge)

### 2.1 Core Constraints

- **Zero Dependencies (core):** The core `guard()` function has strictly zod as a peer/optional dependency. No lodash, no heavy AST parsers.
- **Provider SDKs are Peer Dependencies:** Provider adapters (openai, anthropic, google) import the user's installed SDK. They are never bundled.
- **Environment Agnostic:** Must run in Node.js, Cloudflare Workers, Vercel Edge, Bun, Deno, and the Browser. Do not use Node-specific APIs (fs, path, Buffer).
- **Performance Bound:** The `guard()` function must execute in under 5ms for a 2KB string. The `forge()` function is async (network-bound) but adds negligible overhead beyond the LLM call itself.
- **No Global State:** All functions are pure or accept explicit configuration. No singletons, no module-level mutation.

### 2.2 Architecture: Two Layers

```
┌─────────────────────────────────────────────────┐
│  forge() — End-to-end structured LLM output     │  ← NEW (async, optional)
│  Provider Adapters (OpenAI, Anthropic, Google)   │
├─────────────────────────────────────────────────┤
│  guard() — Core repair + validation engine       │  ← EXISTING (sync, zero-dep)
│  Dirty Parser → Zod Validation → Telemetry       │
└─────────────────────────────────────────────────┘
```

**Layer 1 (Core):** `guard()` — synchronous, zero-dependency, pure string → validated data. Already built and shipped as v0.1.0.

**Layer 2 (Providers):** `forge()` — async, wraps provider SDK calls with `guard()` and automatic retry loops. Requires the user's provider SDK as a peer dependency.

### 2.3 Existing Core Features (guard)

These are built and stable. Do not break them.

- **Dirty Parser:** Markdown extraction, stack-based bracket balancing, heuristic fixes (trailing commas, unquoted keys, escaped quotes, single quotes).
- **Semantic Enforcement:** Zod `.safeParse()` with automatic type coercion (string→boolean, string→number, string→null).
- **Retry Prompt Generator:** Token-efficient retry prompt with mapped Zod issues.
- **Telemetry:** `{ durationMs, status: 'clean' | 'repaired_natively' | 'failed' }`.

### 2.4 New Feature: Provider Adapters & forge()

**Provider Adapter Interface:**

```typescript
interface ReforgeProvider {
  call(messages: Message[], options?: ProviderCallOptions): Promise<string>;
}
```

Each adapter implements this interface by wrapping the respective SDK's chat completion call and extracting the text content from the response.

**Built-in Adapters:**

| Adapter | Covers | Peer Dependency |
|---------|--------|-----------------|
| `openai()` | OpenAI, OpenRouter, Together, Groq, Fireworks, Perplexity, Ollama, LM Studio, vLLM, any OpenAI-compatible API | `openai` |
| `anthropic()` | Direct Anthropic API | `@anthropic-ai/sdk` |
| `google()` | Google Gemini / Vertex AI | `@google/generative-ai` |

The OpenAI adapter works with ANY OpenAI-compatible provider because the user passes their own pre-configured client (with custom `baseURL` and API key already set). Reforge never manages credentials.

**The `forge()` Function:**

```typescript
async function forge<T extends z.ZodTypeAny>(
  provider: ReforgeProvider,
  messages: Message[],
  schema: T,
  options?: ForgeOptions
): Promise<ForgeResult<z.infer<T>>>
```

**Behavior:**
1. Calls the provider with the user's messages
2. Pipes the raw response string through `guard()`
3. If `guard()` succeeds → return the validated data
4. If `guard()` fails → append the `retryPrompt` to messages, call the provider again
5. Repeat up to `maxRetries` (default: 3)
6. If all retries exhausted → return failure with accumulated errors

**Custom Providers:** Users can implement `ReforgeProvider` directly for any provider not covered by built-ins. This is a single method interface — trivial to implement.

### 2.5 Export Structure

```
reforge-ai                    # Core (guard, types) — zero deps
reforge-ai/openai             # OpenAI adapter — peer: openai
reforge-ai/anthropic          # Anthropic adapter — peer: @anthropic-ai/sdk
reforge-ai/google             # Google adapter — peer: @google/generative-ai
```

Each sub-path export is tree-shakeable. Users who only use `guard()` import nothing extra.

### 2.6 API Signatures (Complete)

```typescript
// ── Core (existing) ──
export function guard<T extends z.ZodTypeAny>(
  llmOutput: string,
  schema: T
): GuardResult<z.infer<T>>

export type GuardResult<T> =
  | { success: true; data: T; telemetry: TelemetryData; isRepaired: boolean }
  | { success: false; retryPrompt: string; errors: z.ZodIssue[]; telemetry: TelemetryData };

export type TelemetryData = { durationMs: number; status: 'clean' | 'repaired_natively' | 'failed' };

// ── Provider Layer (new) ──
export interface ReforgeProvider {
  call(messages: Message[], options?: ProviderCallOptions): Promise<string>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ForgeOptions {
  maxRetries?: number;         // Default: 3
  providerOptions?: ProviderCallOptions;
}

export interface ProviderCallOptions {
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;      // Pass-through for provider-specific options
}

export type ForgeResult<T> =
  | { success: true; data: T; telemetry: ForgeTelemetry; isRepaired: boolean }
  | { success: false; errors: z.ZodIssue[]; telemetry: ForgeTelemetry };

export interface ForgeTelemetry extends TelemetryData {
  attempts: number;
  totalDurationMs: number;
}

// ── Adapter factories (new) ──
export function openai(client: OpenAIClient, model: string): ReforgeProvider;
export function anthropic(client: AnthropicClient, model: string): ReforgeProvider;
export function google(client: GoogleClient, model: string): ReforgeProvider;
```

---

## 3. The Web Platform (Marketing, Demo, Docs, Blog)

### 3.1 Tech Stack

- **Framework:** Vite + React (SPA).
- **Styling:** Tailwind CSS v4.
- **Routing:** react-router-dom.
- **Hosting:** Firebase Hosting.
- **Demo:** Client-side — imports the actual library, runs `guard()` in the browser.

### 3.2 Landing Page

- **Hero Section:** "Stop paying for LLM retries." with code snippet showing `guard()` and `forge()`.
- **Value Prop Grid:** Zero dependencies, Edge-ready, Zod native, Microsecond latency, Any LLM Provider.
- **Interactive Demo:** Split-screen with dirty input → repaired output + telemetry.
- **Provider Showcase:** Visual grid showing all supported providers (OpenAI, Anthropic, Google, OpenRouter, Groq, Together, etc.) with a single unified API.

### 3.3 Documentation Hub

- **Setup Guide:** NPM/Yarn/PNPM install instructions.
- **Concepts:** Dirty Parser, Semantic Validation, Provider Adapters.
- **API Reference:** `guard()`, `forge()`, adapter factories, types.
- **Cookbooks/Examples:**
  - OpenAI direct integration.
  - Anthropic direct integration.
  - Google Gemini integration.
  - OpenRouter (using OpenAI adapter with custom baseURL).
  - Custom provider implementation.
  - Next.js Edge API Route.
  - Retry strategy patterns.

### 3.4 SEO Blog

- "How to enforce JSON schemas with OpenAI in 2026."
- "Why JSON Schema prompts fail: The case for native repair."
- "Zod vs. LLMs: Building resilient agentic pipelines."

---

## 4. Current State & What's Next

### Completed (v0.1.0)

- Core `guard()` function with full dirty parser pipeline
- Zod validation with type coercion
- Retry prompt generator
- Telemetry
- 100% test coverage (Vitest)
- Published to NPM as `reforge-ai`
- Website live: landing page, interactive demo, docs, blog

### Next: Provider Layer (v0.2.0)

Detailed task breakdown is in `.internal/plans.md` (not tracked in git). High-level:

1. Define provider interfaces and types (`src/providers/types.ts`)
2. Implement `forge()` orchestrator with retry loop (`src/providers/forge.ts`)
3. Build OpenAI adapter (`src/providers/openai.ts`)
4. Build Anthropic adapter (`src/providers/anthropic.ts`)
5. Build Google Gemini adapter (`src/providers/google.ts`)
6. Configure sub-path exports in package.json and tsup
7. Full test coverage for all adapters and forge()
8. Update website: docs, demo examples, provider showcase
9. Publish v0.2.0 to NPM