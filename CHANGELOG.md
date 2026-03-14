# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-03-13

### Breaking Changes (Explicit Warning)

- This release contains API-shape changes that may require updates for users migrating from `v0.1.x`.
- We are shipping under `v0.3.0` (still pre-1.0), but these changes are semantically breaking and are documented in the migration guide below.

### Core (Guard Layer)

#### Added

- **Line-aware retry prompts** - `guard()` now supports `retryPrompt.mode = "line-aware"` to include only relevant line windows for parse/validation failures, with multi-issue block grouping and configurable context radius.
- **Retry prompt customization hooks** - Added `retryPromptStrategy` for full custom retry prompt generation while preserving typed context inputs.
- **Guard profiles and heuristic controls** - Added `profile` (`safe` | `standard` | `aggressive`) and per-heuristic toggles in `GuardOptions`.
- **Retry-context redaction controls** - Added `retryPrompt.redactPaths` and `retryPrompt.redactRegex` to prevent sensitive values from leaking into retry prompts.
- **Optional debug artifacts** - Added `debug: true` support on `guard()` to expose extracted/repaired text, applied repair passes, likely parse line, and retry context blocks.
- **Expanded semantic telemetry** - Added `status: "coerced_locally"` and `coercedPaths` reporting when semantic clamp resolves issues without network retries.

#### Fixed

- **Retry prompt context quality** - Parse and validation retries can now target specific lines instead of broad snippets when line-aware mode is enabled.

### Providers Layer

#### Added

- **Adapter surface expansion** - Dedicated adapter exports now include `openrouter`, `groq`, and `together` in addition to existing provider factories.
- **Native options pass-through model** - Provider adapters preserve native SDK option typing for direct pass-through into provider calls.

#### Fixed

- **OpenAI-compatible adapter response extraction** - `openaiCompatible()` now handles additional OpenAI-compatible response shapes and no longer throws a `TypeError` when `choices` is missing; it returns a controlled empty-response error instead.

### Orchestration Layer

#### Added

- **Forge retry policy controls** - Added `retryPolicy` with `shouldRetry`, per-attempt `mutateProviderOptions`, and overrideable retry count.
- **Structured forge events** - Added `onEvent` stream with attempt lifecycle events for observability.
- **Provider fallback orchestration** - Added `forgeWithFallback()` for ordered provider failover with per-provider attempt budgets.
- **Deterministic tool loop controls** - Added explicit tool-loop options (`tools`, `toolTimeoutMs`, `maxAgentIterations`) to harden agentic execution.
- **Stream callback for UI-safe output** - Added `onChunk` callback for incremental user-facing streaming.

#### Changed

- **`forge()` now forwards guard options** - Added `guardOptions` pass-through for consistent retry prompt behavior in provider orchestration flows.

### Migration Guide (v0.1.x -> v0.3.0+)

#### 1. Message Format: from plain string-only to universal multi-modal content

Old pattern (`v0.1.x` style):

```ts
const messages = [
  { role: 'user', content: 'Return JSON for this order.' },
];
```

New pattern (`v0.3.0+`):

```ts
import type { Message } from 'reforge-ai';

const messages: Message[] = [
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Return JSON for this order.' },
      { type: 'image_url', image_url: { url: 'https://cdn.example.com/order.png', detail: 'high' } },
    ],
  },
];
```

Also supported in `v0.3.0+`:
- `assistant` messages with `toolCalls`
- `tool` messages with `toolResponse`
- provider-normalized tool histories across OpenAI-compatible, Anthropic, and Gemini adapters

#### 2. Provider Options: from generic call options to typed native pass-through (`TNativeOptions`)

Old pattern (`v0.1.x` / early `forge` usage):

```ts
await forge(provider, messages, schema, {
  providerOptions: {
    // loosely typed generic options
    temperature: 0.2,
  },
});
```

New pattern (`v0.3.0+`):

```ts
import OpenAI from 'openai';
import { openaiCompatible } from 'reforge-ai/openai-compatible';

const provider = openaiCompatible(new OpenAI(), 'gpt-4o');

await forge(provider, messages, schema, {
  providerOptions: {
    // strongly typed native OpenAI-compatible options
    temperature: 0.2,
    top_p: 0.95,
    response_format: { type: 'json_object' },
  },
  retryPolicy: {
    mutateProviderOptions: (attempt, base) => ({
      ...(base ?? {}),
      temperature: attempt > 1 ? 0 : 0.2,
    }),
  },
});
```

#### 3. Guard Option Surface: new controls to opt in explicitly

If you migrated from early `guard()` usage, consider these new options:

- `profile` and `heuristics` for repair aggressiveness control
- `retryPrompt.mode = 'line-aware'` for targeted retry context
- `retryPrompt.redactPaths` / `retryPrompt.redactRegex` for sensitive data controls
- `semanticResolution.mode = 'clamp'` for local semantic coercion before retrying
- `debug: true` for extracted/repaired text and retry-context artifacts

## [0.2.1] - 2026-03-13

### Added

- **Dirty parser heuristics expanded** — Added JavaScript comment stripping (`//`, `/* ... */`) and Python literal normalization (`True`/`False`/`None` → JSON literals), with string-context awareness to avoid mutating quoted values.
- **Schema-aware coercion extended** — Added coercion support for `ZodDate`, case-insensitive `ZodEnum`, `ZodLiteral` primitive matching, `ZodTuple`, `ZodUnion`, and `ZodDiscriminatedUnion` traversal.
- **`forge()` retry hooks and richer telemetry** — Added `onRetry` callback and per-attempt telemetry via `attemptDetails`.

### Changed

- **`forge()` retry safety hardened** — Retry assistant content is now truncated before being appended to the conversation to control token growth.
- **`forge()` options normalization** — `maxRetries` is now defensively normalized (`NaN`/`Infinity`/negative values resolve to bounded non-negative behavior).
- **Markdown extraction broadened** — JSON extraction now supports both backtick and tilde code fences (` ``` ` and `~~~`).

### Fixed

- **Bracket extraction robustness** — Improved mismatched-closer handling in bracket extraction to avoid incorrect early boundary selection in malformed wrappers.
- **Parse-failure reporting consistency** — Parse failures now consistently surface a structured custom parse error in `guard()` failure paths, including non-string runtime input.
- **Coercion clone hardening** — Object cloning in validation coercion now uses a safer plain-object clone strategy to avoid prototype pollution edge cases.

## [0.2.0] - 2026-03-12

### Added

- **`forge()` function** — End-to-end structured LLM output. Calls a provider, pipes through `guard()`, and auto-retries on validation failure. Configurable `maxRetries` (default: 3) with targeted retry prompts.
- **Provider adapter system** — `ReforgeProvider` interface with a single `call()` method. Three built-in adapters:
  - `openaiCompatible()` — works with OpenAI, OpenRouter, Groq, Together, Fireworks, Ollama, LM Studio, vLLM, and any OpenAI-compatible API.
  - `anthropic()` — dedicated Anthropic Claude adapter. Handles system message extraction and `max_tokens` defaults.
  - `google()` — Google Gemini / Vertex AI adapter. Maps `assistant` role to `model`.
- **Sub-path exports** — `reforge-ai/openai-compatible`, `reforge-ai/anthropic`, `reforge-ai/google`. Tree-shakeable, each adapter is independently importable.
- **`ForgeTelemetry`** — Extends `TelemetryData` with `attempts` and `totalDurationMs` fields.
- **New types** — `Message`, `ProviderCallOptions`, `ForgeOptions`, `ForgeResult`, `ReforgeProvider`.
- **Full test coverage** — 36+ new tests for `forge()` and all three provider adapters.

### Changed

- **Package exports expanded** — Exports now include four entry points (core + three adapters).
- **Provider peer dependencies updated** — `openai`, `@anthropic-ai/sdk`, and `@google/generative-ai` are listed as optional peer dependencies.

## [0.1.1] - 2026-03-11

### Changed

- **Retry prompt — parse failures now echo the offending text.** When `guard()` fails because no JSON could be extracted, the `retryPrompt` now includes a snippet (up to 300 chars) of exactly what the LLM returned, so it knows what it produced wrong.
- **Retry prompt — explicit schema-context assumption.** The prompt wording now reflects that the LLM is expected to still have the original schema in its conversation context. The prompt never re-sends the schema — it only describes what was wrong. New wording: `"The schema is still in your context — return ONLY corrected valid JSON."`
- **Retry prompt — distinguishes parse vs. validation failures.** Parse failures say `"could not be parsed as JSON"` and include the raw snippet. Validation failures say `"failed schema validation"` and list the exact field paths, expected types, and received types.

### Fixed

- **`generateRetryPrompt([])` parse-failure path** — Previously returned a generic message with no details; now returns an actionable message that includes the raw offending snippet.

## [0.1.0] - 2026-03-11

### Added

- **`guard()` function** — Main entry-point that parses, repairs, validates, and returns typed results.
- **Dirty parser pipeline** — Multi-stage JSON repair engine:
  - Markdown fence extraction (` ```json ` blocks)
  - Conversational wrapper removal ("Here is the data: {...}")
  - Trailing comma removal
  - Unquoted key fixing
  - Single quote → double quote conversion
  - Escaped quote anomaly repair
  - Stack-based bracket balancing for truncated output
- **Zod schema validation** with automatic type coercion:
  - String `"true"` / `"false"` → boolean
  - String `"42"` / `"3.14"` → number
  - String `"null"` → null
- **Retry prompt generation** — Token-efficient error messages for LLM re-queries.
- **Telemetry** — Every result includes `{ durationMs, status }` for observability.
- **TypeScript support** — Discriminated union result types with generic inference from Zod schemas.
- **Dual CJS/ESM output** — Built with tsup, tree-shakeable, source maps included.
- **Zero runtime dependencies** — Only `zod` as an optional peer dependency.
- **Environment agnostic** — No Node-specific APIs. Works in Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, and browsers.

[Unreleased]: https://github.com/Champion2005/reforge/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Champion2005/reforge/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Champion2005/reforge/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Champion2005/reforge/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Champion2005/reforge/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Champion2005/reforge/releases/tag/v0.1.0
