import type { ZodIssue } from "zod";

/**
 * Maximum characters of raw input to include in a parse-failure prompt.
 * If the raw output exceeds this, the snippet is omitted entirely — a
 * truncated beginning gives the LLM no actionable signal about what went
 * wrong, and wastes tokens.
 */
const RAW_SNIPPET_MAX = 300;

/**
 * Generate a token-efficient retry prompt from Zod validation errors or a
 * parse failure.
 *
 * When `guard()` fails it calls this function to produce a concise instruction
 * string that can be appended to the LLM conversation to request a corrected
 * response.
 *
 * ### Design Goals
 * - **Token-efficient:** Every word costs money. The prompt is terse on purpose.
 * - **Actionable:** Validation errors include the exact JSON path, expected type,
 *   and received value. Parse failures include a snippet of the offending text.
 * - **Assumes schema context:** The LLM is expected to still have the original
 *   schema in its conversation context. The prompt never re-sends the schema —
 *   it only describes what was wrong with the previous response.
 *
 * @param errors     - The `ZodIssue[]` array from a failed `safeParse()`. Pass
 *                     an empty array when the failure is a parse error.
 * @param rawSnippet - The raw LLM output that could not be parsed. Included
 *                     in the prompt only when it fits entirely within
 *                     {@link RAW_SNIPPET_MAX} characters — a truncated leading
 *                     slice gives no actionable signal, so it is omitted for
 *                     longer outputs.
 * @returns A prompt string ready to be appended to the LLM message array.
 *
 * @example Validation failure
 * ```ts
 * generateRetryPrompt([
 *   { code: "invalid_type", expected: "number", received: "string", path: ["user", "age"], message: "Expected number" },
 * ]);
 * // => 'Your previous response failed schema validation. Errors: [Path: /user/age, Expected: number, Received: string]. The schema is still in your context — return ONLY corrected valid JSON.'
 * ```
 *
 * @example Parse failure
 * ```ts
 * generateRetryPrompt([], '{name: Alice, age:}');
 * // => 'Your previous response could not be parsed as JSON. Got: `{name: Alice, age:}`. The schema is still in your context — return ONLY valid JSON.'
 * ```
 */
export function generateRetryPrompt(
  errors: ZodIssue[],
  rawSnippet?: string,
): string {
  // Parse failure: JSON could not be extracted at all.
  if (errors.length === 0) {
    // Only echo the raw output when it fits entirely — a truncated leading
    // slice shows the LLM a fragment that may look fine, giving no signal
    // about where extraction failed and wasting context tokens.
    if (
      rawSnippet !== undefined &&
      rawSnippet.length > 0 &&
      rawSnippet.length <= RAW_SNIPPET_MAX
    ) {
      return `Your previous response could not be parsed as JSON. Got: \`${rawSnippet}\`. The schema is still in your context — return ONLY valid JSON.`;
    }
    return "Your previous response could not be parsed as JSON. The schema is still in your context — return ONLY valid JSON.";
  }

  // Validation failure: JSON parsed but didn't satisfy the schema.
  const formatted = errors.map(formatIssue).join("; ");
  return `Your previous response failed schema validation. Errors: ${formatted}. The schema is still in your context — return ONLY corrected valid JSON.`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function formatIssue(issue: ZodIssue): string {
  const path = "/" + issue.path.map(String).join("/");

  // Build informative detail based on the issue code.
  const parts: string[] = [`Path: ${path}`];

  if ("expected" in issue && issue.expected !== undefined) {
    parts.push(`Expected: ${String(issue.expected)}`);
  }
  if ("received" in issue && issue.received !== undefined) {
    parts.push(`Received: ${String(issue.received)}`);
  }

  // Fallback: always include the human-readable message.
  if (parts.length === 1) {
    parts.push(`Message: ${issue.message}`);
  }

  return `[${parts.join(", ")}]`;
}
