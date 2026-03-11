import type { HeuristicResult } from "../types.js";

/**
 * Apply common syntactic heuristics to repair malformed JSON strings.
 *
 * LLMs produce predictable classes of JSON errors. This module fixes the most
 * frequent ones via a single character-by-character scan that is aware of
 * string-literal context (so it never mutates content _inside_ quoted values).
 *
 * ### Fixes Applied
 * | Issue | Example | Result |
 * |---|---|---|
 * | Trailing commas | `{"a":1,}` | `{"a":1}` |
 * | Unquoted keys | `{name: "John"}` | `{"name": "John"}` |
 * | Single-quoted strings | `{'key': 'val'}` | `{"key": "val"}` |
 * | Escaped-quote wrappers | `{\"key\": \"val\"}` | `{"key": "val"}` |
 *
 * @param input - A JSON-like string (after markdown extraction).
 * @returns The repaired string and whether any fix was applied.
 *
 * @example
 * ```ts
 * applyHeuristics("{name: 'John',}");
 * // => { result: '{"name": "John"}', applied: true }
 * ```
 */
export function applyHeuristics(input: string): HeuristicResult {
  if (input.length === 0) {
    return { result: input, applied: false };
  }

  let current = input;
  let anyApplied = false;

  // --- Pass 1: Fix escaped-quote wrappers (must run first) ---
  const unescaped = fixEscapedQuotes(current);
  if (unescaped !== current) {
    current = unescaped;
    anyApplied = true;
  }

  // --- Pass 2: Fix single-quoted strings → double-quoted ---
  const dqResult = fixSingleQuotes(current);
  if (dqResult !== current) {
    current = dqResult;
    anyApplied = true;
  }

  // --- Pass 3: Fix unquoted keys ---
  const uqResult = fixUnquotedKeys(current);
  if (uqResult !== current) {
    current = uqResult;
    anyApplied = true;
  }

  // --- Pass 4: Strip trailing commas ---
  const tcResult = fixTrailingCommas(current);
  if (tcResult !== current) {
    current = tcResult;
    anyApplied = true;
  }

  return { result: current, applied: anyApplied };
}

// ---------------------------------------------------------------------------
// Fix: Escaped-quote wrappers
// ---------------------------------------------------------------------------

/**
 * Detect and fix `{\"key\": \"value\"}` patterns that appear when an LLM
 * wraps a JSON object in escaped quotes (common when JSON is embedded in
 * another string context and then incorrectly extracted).
 *
 * Only activates when the input starts with `{` or `[` but contains `\"`
 * patterns outside of properly quoted strings.
 */
function fixEscapedQuotes(input: string): string {
  // Quick exit: if there are no escaped quotes, nothing to do.
  if (!input.includes('\\"')) return input;

  // Check if there are *any* normal (unescaped) double-quotes already.
  // If the only double-quotes are escaped ones, unescape them all.
  // We do a simple heuristic: if removing `\"` leaves no `"`, all quotes are escaped.
  const withoutEscaped = input.replace(/\\"/g, "");
  if (!withoutEscaped.includes('"')) {
    return input.replace(/\\"/g, '"');
  }

  return input;
}

// ---------------------------------------------------------------------------
// Fix: Single-quoted strings → double-quoted
// ---------------------------------------------------------------------------

/**
 * Convert single-quoted keys and values to double-quoted ones.
 * Must track context to avoid replacing apostrophes inside double-quoted strings.
 */
function fixSingleQuotes(input: string): string {
  const chars: string[] = [];
  let inDouble = false;
  let inSingle = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    // Handle escape sequences inside strings.
    if ((inDouble || inSingle) && ch === "\\") {
      if (i + 1 < input.length) {
        i++;
        const next = input[i]!;
        // Inside a single-quote string being converted to double-quote,
        // we need to escape any internal double-quotes and unescape escaped single-quotes.
        if (inSingle) {
          if (next === "'") {
            // Unescape \' → ' (no backslash needed inside double-quoted string).
            chars.push("'");
          } else if (next === '"') {
            // Escape double-quote that was inside the single-quoted string.
            chars.push('\\"');
          } else {
            // Keep other escape sequences as-is.
            chars.push("\\", next);
          }
        } else {
          // Inside a double-quoted string — preserve escape as-is.
          chars.push("\\", next);
        }
      } else {
        // Trailing backslash at end of input.
        chars.push(ch);
      }
      continue;
    }

    if (inDouble) {
      if (ch === '"') inDouble = false;
      chars.push(ch);
      continue;
    }

    if (inSingle) {
      if (ch === "'") {
        // Close single-quote → emit double-quote.
        inSingle = false;
        chars.push('"');
        continue;
      }
      // Escape any unescaped double-quotes inside the single-quoted string.
      if (ch === '"') {
        chars.push('\\"');
        continue;
      }
      chars.push(ch);
      continue;
    }

    // Not inside any string.
    if (ch === '"') {
      inDouble = true;
      chars.push(ch);
    } else if (ch === "'") {
      inSingle = true;
      chars.push('"'); // Open single-quote → emit double-quote.
    } else {
      chars.push(ch);
    }
  }

  return chars.join("");
}

// ---------------------------------------------------------------------------
// Fix: Unquoted keys
// ---------------------------------------------------------------------------

/**
 * Wrap bare (unquoted) object keys in double quotes.
 *
 * Detects patterns like `{ key:`, `{ key :`, `, key:` and wraps the key
 * identifier in `"..."`. Keys may contain word chars (`a-z`, `A-Z`, `0-9`, `_`, `$`).
 */
function fixUnquotedKeys(input: string): string {
  const chars: string[] = [];
  let inString = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i]!;

    // Track string context.
    if (inString) {
      chars.push(ch);
      if (ch === "\\" && i + 1 < input.length) {
        i++;
        chars.push(input[i]!);
      } else if (ch === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      chars.push(ch);
      i++;
      continue;
    }

    // Look for unquoted key: we're at a position after `{`, `,`, or start
    // and we see an identifier character.
    if (isKeyStart(ch) && isAfterKeyPosition(chars)) {
      // Consume the full key identifier.
      let key = "";
      let j = i;
      while (j < input.length && isKeyChar(input[j]!)) {
        key += input[j]!;
        j++;
      }

      // Check if followed by `:` (possibly with whitespace).
      let k = j;
      while (k < input.length && isWhitespace(input[k]!)) k++;

      if (k < input.length && input[k] === ":") {
        // This is an unquoted key — wrap it.
        chars.push('"', key, '"');
        i = j;
        continue;
      }
    }

    chars.push(ch);
    i++;
  }

  return chars.join("");
}

function isKeyStart(ch: string): boolean {
  return (
    (ch >= "a" && ch <= "z") ||
    (ch >= "A" && ch <= "Z") ||
    ch === "_" ||
    ch === "$"
  );
}

function isKeyChar(ch: string): boolean {
  return isKeyStart(ch) || (ch >= "0" && ch <= "9");
}

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

/**
 * Check whether the accumulated output so far places us in a position where
 * an unquoted key would appear (after `{`, `,`, or start of input —
 * ignoring whitespace).
 */
function isAfterKeyPosition(chars: string[]): boolean {
  // Walk backwards through chars, skip whitespace.
  for (let i = chars.length - 1; i >= 0; i--) {
    const c = chars[i]!;
    if (isWhitespace(c)) continue;
    return c === "{" || c === ",";
  }
  // Empty (start of input) — not a key position for bare JSON.
  return false;
}

// ---------------------------------------------------------------------------
// Fix: Trailing commas
// ---------------------------------------------------------------------------

/**
 * Remove trailing commas before `}` or `]`.
 * Character-by-character scan that tracks string context.
 */
function fixTrailingCommas(input: string): string {
  const chars: string[] = [];
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;

    if (inString) {
      chars.push(ch);
      if (ch === "\\" && i + 1 < input.length) {
        i++;
        chars.push(input[i]!);
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      chars.push(ch);
      continue;
    }

    if (ch === ",") {
      // Look ahead: skip whitespace and see if the next non-ws char is } or ]
      let j = i + 1;
      while (j < input.length && isWhitespace(input[j]!)) j++;
      if (j < input.length && (input[j] === "}" || input[j] === "]")) {
        // Skip this comma (trailing comma — don't push it).
        continue;
      }
    }

    chars.push(ch);
  }

  return chars.join("");
}
