import type { ZodIssue } from "zod";

/**
 * Generate a token-efficient retry prompt from Zod validation errors.
 *
 * When `guard()` fails semantically (the JSON is structurally valid but
 * doesn't match the schema), this function produces a concise instruction
 * string that can be appended to the LLM conversation to request a
 * corrected response.
 *
 * ### Design Goals
 * - **Token-efficient:** Every word costs money. The prompt is terse on purpose.
 * - **Actionable:** Each error includes the JSON path, expected type, and received value.
 * - **Self-contained:** The LLM doesn't need prior context to understand the ask.
 *
 * @param errors - The `ZodIssue[]` array from a failed `safeParse()`.
 * @returns A prompt string ready to be appended to the LLM message array.
 *
 * @example
 * ```ts
 * generateRetryPrompt([
 *   { code: "invalid_type", expected: "number", received: "string", path: ["user", "age"], message: "Expected number" },
 * ]);
 * // => 'Your previous response failed validation. Errors: [Path: /user/age, Expected: number, Received: string]. Return ONLY valid JSON matching the schema.'
 * ```
 */
export function generateRetryPrompt(errors: ZodIssue[]): string {
  if (errors.length === 0) {
    return "Your previous response failed validation. Return ONLY valid JSON matching the schema.";
  }

  const formatted = errors.map(formatIssue).join("; ");
  return `Your previous response failed validation. Errors: ${formatted}. Return ONLY valid JSON matching the schema.`;
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
