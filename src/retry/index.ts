import type { ZodIssue } from "zod";
import type {
  RetryPromptContextBlock,
  RetryPromptOptions,
  RetryPromptStrategy,
  RetryPromptStrategyInput,
} from "../types.js";

/**
 * Maximum characters of raw input to include in a parse-failure prompt.
 * If the raw output exceeds this, the snippet is omitted entirely — a
 * truncated beginning gives the LLM no actionable signal about what went
 * wrong, and wastes tokens.
 */
const RAW_SNIPPET_MAX = 300;

interface RetryPromptConfig {
  options?: RetryPromptOptions;
  sourceText?: string;
  strategy?: RetryPromptStrategy;
  parseErrorLine?: number;
  onContextBlocks?: (blocks: RetryPromptContextBlock[]) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<
  Omit<RetryPromptOptions, "redactPaths" | "redactRegex">
> = {
  mode: "compact",
  contextRadius: 1,
  maxContextChars: 700,
  includeLineNumbers: true,
  maxIssueBlocks: 3,
};

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
  config?: RetryPromptConfig,
): string {
  const options = {
    ...DEFAULT_RETRY_OPTIONS,
    ...(config?.options ?? {}),
  };

  let contextBlocks: RetryPromptContextBlock[] = [];

  // Parse failure: JSON could not be extracted at all.
  if (errors.length === 0) {
    if (options.mode === "line-aware" && rawSnippet) {
      const line =
        config?.parseErrorLine !== undefined
          ? clampLine(config.parseErrorLine, rawSnippet)
          : inferLikelyParseLine(rawSnippet);

      contextBlocks = createContextBlocksFromLines(
        rawSnippet,
        [line],
        options.contextRadius,
        options.maxIssueBlocks,
        options.maxContextChars,
        options.includeLineNumbers,
      );
      contextBlocks = applyContextRedaction(contextBlocks, options, []);
    }

    config?.onContextBlocks?.(contextBlocks);

    const strategyInput: RetryPromptStrategyInput = {
      errors,
      rawOutput: rawSnippet,
      contextBlocks,
    };

    if (config?.strategy) {
      const custom = config.strategy(strategyInput).trim();
      if (custom.length > 0) {
        return custom;
      }
    }

    // Only echo the raw output when it fits entirely — a truncated leading
    // slice shows the LLM a fragment that may look fine, giving no signal
    // about where extraction failed and wasting context tokens.
    const redactedRaw = applyRawRedaction(rawSnippet, options);

    if (contextBlocks.length > 0) {
      const blocks = contextBlocks.map((b) => b.text).join("\n\n");
      return `Your previous response could not be parsed as JSON. Relevant lines:\n${blocks}\nThe schema is still in your context — return ONLY valid JSON.`;
    }

    if (
      redactedRaw !== undefined &&
      redactedRaw.length > 0 &&
      redactedRaw.length <= RAW_SNIPPET_MAX
    ) {
      return `Your previous response could not be parsed as JSON. Got: \`${redactedRaw}\`. The schema is still in your context — return ONLY valid JSON.`;
    }

    return "Your previous response could not be parsed as JSON. The schema is still in your context — return ONLY valid JSON.";
  }

  if (options.mode === "line-aware" && config?.sourceText) {
    const lines = gatherIssueLines(config.sourceText, errors);
    contextBlocks = createContextBlocksFromLines(
      config.sourceText,
      lines,
      options.contextRadius,
      options.maxIssueBlocks,
      options.maxContextChars,
      options.includeLineNumbers,
    );
    contextBlocks = applyContextRedaction(contextBlocks, options, errors);
  }

  config?.onContextBlocks?.(contextBlocks);

  const strategyInput: RetryPromptStrategyInput = {
    errors,
    rawOutput: rawSnippet,
    contextBlocks,
  };

  if (config?.strategy) {
    const custom = config.strategy(strategyInput).trim();
    if (custom.length > 0) {
      return custom;
    }
  }

  // Validation failure: JSON parsed but didn't satisfy the schema.
  const formatted = errors.map(formatIssue).join("; ");

  if (contextBlocks.length > 0) {
    const blocks = contextBlocks.map((b) => b.text).join("\n\n");
    return `Your previous response failed schema validation. Relevant lines:\n${blocks}\nErrors: ${formatted}. The schema is still in your context — return ONLY corrected valid JSON.`;
  }

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

function gatherIssueLines(sourceText: string, errors: ZodIssue[]): number[] {
  const lines = sourceText.split(/\r?\n/);
  const result = new Set<number>();

  for (const issue of errors) {
    const line = findLineForIssue(lines, issue);
    result.add(line);
  }

  if (result.size === 0) {
    result.add(1);
  }

  return [...result].sort((a, b) => a - b);
}

function findLineForIssue(lines: string[], issue: ZodIssue): number {
  if (issue.path.length === 0) {
    return firstNonEmptyLine(lines);
  }

  for (let i = issue.path.length - 1; i >= 0; i--) {
    const part = issue.path[i];
    if (typeof part === "string") {
      const needle = `"${part}"`;
      const lineIdx = lines.findIndex((line) => line.includes(needle));
      if (lineIdx !== -1) {
        return lineIdx + 1;
      }
    }
  }

  return firstNonEmptyLine(lines);
}

function firstNonEmptyLine(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.trim().length > 0) {
      return i + 1;
    }
  }
  return 1;
}

function createContextBlocksFromLines(
  sourceText: string,
  issueLines: number[],
  radius: number,
  maxBlocks: number,
  maxChars: number,
  includeLineNumbers: boolean,
): RetryPromptContextBlock[] {
  const lines = sourceText.split(/\r?\n/);
  const windows = issueLines
    .map((line) => ({
      start: Math.max(1, line - radius),
      end: Math.min(lines.length, line + radius),
    }))
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const win of windows) {
    const last = merged[merged.length - 1];
    if (!last || win.start > last.end + 1) {
      merged.push({ ...win });
    } else {
      last.end = Math.max(last.end, win.end);
    }
  }

  const blocks: RetryPromptContextBlock[] = [];
  let budget = maxChars;
  for (let i = 0; i < merged.length && i < maxBlocks && budget > 0; i++) {
    const win = merged[i]!;
    const rows: string[] = [];
    for (let line = win.start; line <= win.end; line++) {
      const raw = lines[line - 1] ?? "";
      rows.push(includeLineNumbers ? `${line.toString().padStart(4, " ")} | ${raw}` : raw);
    }

    let text = rows.join("\n");
    if (text.length > budget) {
      text = `${text.slice(0, Math.max(0, budget - 18))}\n...[truncated]`;
    }

    if (text.length === 0) continue;

    blocks.push({
      startLine: win.start,
      endLine: win.end,
      text,
    });

    budget -= text.length;
  }

  return blocks;
}

function applyContextRedaction(
  blocks: RetryPromptContextBlock[],
  options: Required<Omit<RetryPromptOptions, "redactPaths" | "redactRegex">> &
    Pick<RetryPromptOptions, "redactPaths" | "redactRegex">,
  errors: ZodIssue[],
): RetryPromptContextBlock[] {
  if (blocks.length === 0) return blocks;

  const keysToMask = new Set<string>();
  for (const pointer of options.redactPaths ?? []) {
    const parts = pointer.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) keysToMask.add(last);
  }

  for (const issue of errors) {
    const pointer = `/${issue.path.map(String).join("/")}`;
    if ((options.redactPaths ?? []).includes(pointer)) {
      const last = issue.path[issue.path.length - 1];
      if (typeof last === "string") {
        keysToMask.add(last);
      }
    }
  }

  return blocks.map((block) => ({
    ...block,
    text: redactBlockText(block.text, keysToMask, options.redactRegex),
  }));
}

function redactBlockText(
  input: string,
  keysToMask: Set<string>,
  redactRegex?: RegExp[],
): string {
  let out = input;

  for (const key of keysToMask) {
    const escaped = escapeRegex(key);
    const rx = new RegExp(`("${escaped}"\\s*:\\s*)(.+)$`, "gm");
    out = out.replace(rx, "$1\"[REDACTED]\"");
  }

  for (const rx of redactRegex ?? []) {
    out = out.replace(rx, "[REDACTED]");
  }

  return out;
}

function applyRawRedaction(
  rawSnippet: string | undefined,
  options: Required<Omit<RetryPromptOptions, "redactPaths" | "redactRegex">> &
    Pick<RetryPromptOptions, "redactPaths" | "redactRegex">,
): string | undefined {
  if (rawSnippet === undefined) return undefined;
  let out = rawSnippet;

  for (const rx of options.redactRegex ?? []) {
    out = out.replace(rx, "[REDACTED]");
  }

  return out;
}

function inferLikelyParseLine(rawSnippet: string): number {
  const lines = rawSnippet.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]!.trim().length > 0) return i + 1;
  }
  return 1;
}

function clampLine(line: number, rawSnippet: string): number {
  const count = Math.max(1, rawSnippet.split(/\r?\n/).length);
  if (!Number.isFinite(line)) return 1;
  return Math.min(count, Math.max(1, Math.floor(line)));
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
