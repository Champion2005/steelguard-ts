# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-03-11

### Changed

- **Retry prompt — parse failures now echo the offending text.** When `guard()` fails because no JSON could be extracted, the `retryPrompt` now includes a snippet (up to 300 chars) of exactly what the LLM returned, so it knows what it produced wrong.
- **Retry prompt — explicit schema-context assumption.** The prompt wording now reflects that the LLM is expected to still have the original schema in its conversation context. The prompt never re-sends the schema — it only describes what was wrong. New wording: `"The schema is still in your context — return ONLY corrected valid JSON."`
- **Retry prompt — distinguishes parse vs. validation failures.** Parse failures say `"could not be parsed as JSON"` and include the raw snippet. Validation failures say `"failed schema validation"` and list the exact field paths, expected types, and received types.

### Fixed

- `generateRetryPrompt([])` (parse failure path) previously returned a generic message with no details. It now returns an actionable message with the raw offending snippet.

## [0.1.0] - 2026-03-11

### Added

- **`guard()` function** — Main entry-point that parses, repairs, validates, and returns typed results.
- **Dirty Parser pipeline** — Multi-stage JSON repair engine:
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
- **Full TypeScript support** — Discriminated union result types, generic inference from Zod schemas.
- **Dual CJS/ESM output** — Built with tsup, tree-shakeable, source maps included.
- **Zero runtime dependencies** — Only Zod as an optional peer dependency.
- **Environment agnostic** — No Node-specific APIs. Works in Node.js, Bun, Deno, Cloudflare Workers, Vercel Edge, and browsers.

[0.1.1]: https://github.com/Champion2005/reforge/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/Champion2005/reforge/releases/tag/v0.1.0
