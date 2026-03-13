import type { ParseResult } from "../types.js";
import { extractJsonString } from "./extract.js";
import { applyHeuristics } from "./heuristics.js";
import { balanceBrackets } from "./balance.js";

interface DirtyParseOptions {
  heuristics?: {
    escapedQuotes?: boolean;
    singleQuotes?: boolean;
    stripComments?: boolean;
    normalizePythonLiterals?: boolean;
    unquotedKeys?: boolean;
    trailingCommas?: boolean;
  };
}

/**
 * The Dirty Parser — Reforge's native JSON repair pipeline.
 *
 * Accepts raw LLM output (which may be wrapped in markdown, contain trailing
 * commas, have unquoted keys, or be truncated) and attempts to produce a
 * valid JavaScript value via `JSON.parse`.
 *
 * ### Pipeline Order
 * 1. **Fast path** — try `JSON.parse(input)` directly.
 * 2. **Extract** — strip markdown fences and conversational wrappers.
 * 3. **Heuristics** — fix trailing commas, unquoted keys, single quotes, escaped quotes.
 * 4. **Balance** — close unclosed brackets/braces (truncated output).
 * 5. **Final parse** — `JSON.parse` on the repaired string.
 *
 * ### Performance
 * The entire pipeline is synchronous, zero-allocation where possible, and
 * operates in O(n) time relative to input length.
 *
 * @param input - Raw string from an LLM.
 * @returns A discriminated-union `ParseResult`: either the parsed value or
 *          the raw input for error reporting.
 *
 * @example
 * ```ts
 * dirtyParse('```json\n{"name": "Alice",}\n```');
 * // => { success: true, value: { name: "Alice" }, isRepaired: true }
 * ```
 */

/** Maximum input size in bytes (10 MB). Inputs larger than this are rejected. */
const MAX_INPUT_SIZE = 10 * 1024 * 1024;

export function dirtyParse(input: string, options?: DirtyParseOptions): ParseResult {
  // --- Guard: reject absurdly large inputs to prevent DoS. ---
  if (input.length > MAX_INPUT_SIZE) {
    return {
      success: false,
      raw: input,
      likelyErrorLine: getLastNonEmptyLine(input),
    };
  }

  // --- Fast path: already valid JSON. ---
  const fast = tryParse(input);
  if (fast !== PARSE_FAILED) {
    return {
      success: true,
      value: fast,
      isRepaired: false,
      extractedText: input,
      repairedText: input,
    };
  }

  // --- Stage 1: Extract ---
  const { extracted, wasExtracted } = extractJsonString(input);

  // --- Stage 2: Heuristics ---
  const heuristicMeta = applyHeuristics(extracted, options?.heuristics);
  const heuristicResult = heuristicMeta.result;
  const heuristicsApplied = heuristicMeta.applied;

  // --- Stage 3: Balance ---
  const { result: balanced, wasBalanced } = balanceBrackets(heuristicResult);

  // --- Final parse ---
  const parsed = tryParse(balanced);
  if (parsed !== PARSE_FAILED) {
    const isRepaired = wasExtracted || heuristicsApplied || wasBalanced;
    const appliedRepairs = [...(heuristicMeta.appliedRepairs ?? [])];
    if (wasExtracted) appliedRepairs.unshift("extract_json");
    if (wasBalanced) appliedRepairs.push("balance_brackets");

    return {
      success: true,
      value: parsed,
      isRepaired,
      extractedText: extracted,
      repairedText: balanced,
      appliedRepairs: appliedRepairs.length > 0 ? appliedRepairs : undefined,
    };
  }

  const appliedRepairs = [...(heuristicMeta.appliedRepairs ?? [])];
  if (wasExtracted) appliedRepairs.unshift("extract_json");
  if (wasBalanced) appliedRepairs.push("balance_brackets");

  return {
    success: false,
    raw: input,
    likelyErrorLine: inferLikelyErrorLine(balanced),
    extractedText: extracted,
    repairedText: balanced,
    appliedRepairs: appliedRepairs.length > 0 ? appliedRepairs : undefined,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Sentinel value for failed `JSON.parse` attempts (avoids exceptions in hot path). */
const PARSE_FAILED: unique symbol = Symbol("PARSE_FAILED");

function tryParse(input: string): unknown | typeof PARSE_FAILED {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return PARSE_FAILED;
  }
}

function inferLikelyErrorLine(input: string): number {
  const stack: Array<{ ch: "{" | "["; line: number }> = [];
  let inString = false;
  let line = 1;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    if (ch === "\n") {
      line++;
      continue;
    }

    if (inString) {
      if (ch === "\\" && i + 1 < input.length) {
        i++;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push({ ch, line });
      continue;
    }

    if (ch === "}" || ch === "]") {
      const top = stack[stack.length - 1];
      if (!top) return line;

      const expected = top.ch === "{" ? "}" : "]";
      if (expected !== ch) {
        return line;
      }

      stack.pop();
    }
  }

  if (stack.length > 0) {
    return stack[stack.length - 1]!.line;
  }

  return getLastNonEmptyLine(input);
}

function getLastNonEmptyLine(input: string): number {
  const lines = input.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]!.trim().length > 0) {
      return i + 1;
    }
  }
  return 1;
}
