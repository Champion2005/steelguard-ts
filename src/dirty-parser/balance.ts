import type { BalanceResult } from "../types.js";

/**
 * Balance mismatched brackets and braces in a JSON string.
 *
 * When an LLM response is truncated (e.g. hitting `max_tokens`), the output
 * often ends mid-object or mid-array. This function uses a single-pass
 * stack-based scan to detect unclosed structures and appends the necessary
 * closing characters.
 *
 * ### Behaviour
 * - Tracks `{`, `}`, `[`, `]` while ignoring those inside string literals.
 * - At end-of-input, pops the stack and appends matching closers.
 * - Strips orphaned trailing closers that have no matching opener.
 *
 * @param input - A JSON-like string (after extraction & heuristic repair).
 * @returns The balanced string and whether any modification was made.
 *
 * @example
 * ```ts
 * balanceBrackets('{"items": [{"id": 1');
 * // => { result: '{"items": [{"id": 1}]}', wasBalanced: true }
 * ```
 */
export function balanceBrackets(input: string): BalanceResult {
  if (input.length === 0) {
    return { result: input, wasBalanced: false };
  }

  const stack: string[] = [];
  const cleaned: string[] = [];
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    // --- Inside a string literal: only watch for close-quote and escapes. ---
    if (inString) {
      cleaned.push(ch);
      if (ch === "\\" && i + 1 < input.length) {
        i++;
        cleaned.push(input[i]!);
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    // --- Outside a string literal. ---
    if (ch === '"') {
      inString = true;
      cleaned.push(ch);
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push(ch);
      cleaned.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      const expected = ch === "}" ? "{" : "[";
      if (stack.length > 0 && stack[stack.length - 1] === expected) {
        stack.pop();
        cleaned.push(ch);
      } else {
        // Orphaned closer — skip it.
      }
      continue;
    }

    cleaned.push(ch);
  }

  // --- If we're inside an unclosed string, close it. ---
  if (inString) {
    cleaned.push('"');
  }

  // --- Append missing closers from the stack (LIFO order). ---
  let suffix = "";
  while (stack.length > 0) {
    const opener = stack.pop()!;
    suffix += opener === "{" ? "}" : "]";
  }

  const result = cleaned.join("") + suffix;
  const wasBalanced = result !== input;

  return { result, wasBalanced };
}
