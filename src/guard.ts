import type { ZodIssue, ZodTypeAny, infer as ZodInfer } from "zod";
import type {
  GuardResult,
  TelemetryData,
  GuardOptions,
  GuardHeuristicOptions,
  RetryPromptContextBlock,
  GuardSemanticResolution,
} from "./types.js";
import { dirtyParse } from "./dirty-parser/index.js";
import { validateWithSchema } from "./validation/index.js";
import { generateRetryPrompt } from "./retry/index.js";
import { createTimer } from "./telemetry.js";

function createParseFailureError(): ZodIssue {
  return {
    code: "custom",
    path: [],
    message: "Input could not be parsed as JSON",
  } as ZodIssue;
}

/**
 * Validate and repair raw LLM output against a Zod schema.
 *
 * `guard()` is the single entry-point for Reforge. It runs a three-stage
 * pipeline — **parse → validate → report** — and returns a typed,
 * discriminated-union result that is safe to pattern-match on.
 *
 * ### Pipeline
 * 1. **Dirty Parse** — Extracts JSON from markdown wrappers, fixes trailing
 *    commas / unquoted keys / single quotes, and closes truncated brackets.
 * 2. **Schema Validation** — Runs `schema.safeParse()` with automatic
 *    coercion for common LLM type mismatches (string `"true"` → boolean, etc.).
 * 3. **Result** — Returns either `{ success: true, data, telemetry }` or
 *    `{ success: false, retryPrompt, errors, telemetry }`.
 *
 * ### Guarantees
 * - **Never throws.** All error paths return a typed failure object.
 * - **Synchronous.** No async, no network calls, no I/O.
 * - **Pure.** No global state is mutated.
 * - **Fast.** Targets < 5 ms for a 2 KB input string.
 *
 * @typeParam T - A Zod schema type (e.g. `z.ZodObject<…>`).
 * @param llmOutput - The raw string produced by an LLM.
 * @param schema    - The Zod schema the output must conform to.
 * @returns A `GuardResult<z.infer<T>>` — either success with typed data
 *          or failure with a retry prompt and error details.
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { guard } from 'reforge-ai';
 *
 * const UserSchema = z.object({
 *   name: z.string(),
 *   age:  z.number(),
 * });
 *
 * const result = guard('```json\n{"name": "Alice", "age": 30,}\n```', UserSchema);
 *
 * if (result.success) {
 *   console.log(result.data);       // { name: "Alice", age: 30 }
 *   console.log(result.isRepaired); // true
 *   console.log(result.telemetry);  // { durationMs: 0.4, status: "repaired_natively" }
 * } else {
 *   // Append result.retryPrompt to your LLM conversation
 *   console.log(result.retryPrompt);
 * }
 * ```
 */
export function guard<T extends ZodTypeAny>(
  llmOutput: string,
  schema: T,
  options?: GuardOptions,
): GuardResult<ZodInfer<T>> {
  const timer = createTimer();
  const heuristics = resolveHeuristics(options);
  let retryContextBlocks: RetryPromptContextBlock[] = [];

  // --- Safety: handle non-string input at runtime boundary ---
  if (typeof llmOutput !== "string") {
    const parseError = createParseFailureError();
    const telemetry: TelemetryData = {
      durationMs: timer.stop(),
      status: "failed",
    };
    return {
      success: false,
      retryPrompt: generateRetryPrompt([], undefined, {
        options: options?.retryPrompt,
        strategy: options?.retryPromptStrategy,
        onContextBlocks: (blocks) => {
          retryContextBlocks = blocks;
        },
      }),
      errors: [parseError],
      telemetry,
      debug: options?.debug
        ? {
            retryContextBlocks:
              retryContextBlocks.length > 0 ? retryContextBlocks : undefined,
          }
        : undefined,
    };
  }

  // --- Stage 1: Dirty Parse ---
  const parseResult = dirtyParse(llmOutput, { heuristics });

  if (!parseResult.success) {
    const parseError = createParseFailureError();
    const telemetry: TelemetryData = {
      durationMs: timer.stop(),
      status: "failed",
    };
    return {
      success: false,
      retryPrompt: generateRetryPrompt([], parseResult.raw, {
        options: options?.retryPrompt,
        strategy: options?.retryPromptStrategy,
        parseErrorLine: parseResult.likelyErrorLine,
        onContextBlocks: (blocks) => {
          retryContextBlocks = blocks;
        },
      }),
      errors: [parseError],
      telemetry,
      debug: options?.debug
        ? {
            extractedText: parseResult.extractedText,
            repairedText: parseResult.repairedText,
            appliedRepairs: parseResult.appliedRepairs,
            likelyErrorLine: parseResult.likelyErrorLine,
            retryContextBlocks:
              retryContextBlocks.length > 0 ? retryContextBlocks : undefined,
          }
        : undefined,
    };
  }

  // --- Stage 2: Schema Validation (with coercion) ---
  const validationResult = validateWithSchema(parseResult.value, schema);

  if (validationResult.success) {
    const status = parseResult.isRepaired ? "repaired_natively" : "clean";
    const telemetry: TelemetryData = {
      durationMs: timer.stop(),
      status,
      coercedPaths: [],
    };
    return {
      success: true,
      data: validationResult.data,
      telemetry,
      isRepaired: parseResult.isRepaired,
      debug: options?.debug
        ? {
            extractedText: parseResult.extractedText,
            repairedText: parseResult.repairedText,
            appliedRepairs: parseResult.appliedRepairs,
          }
        : undefined,
    };
  }

  const semanticMode = options?.semanticResolution?.mode ?? "retry";
  if (semanticMode === "clamp") {
    const coercion = applySemanticCoercion(
      parseResult.value,
      validationResult.errors,
      options?.semanticResolution,
    );

    if (coercion.appliedPaths.length > 0) {
      const secondPass = validateWithSchema(coercion.value, schema);
      if (secondPass.success) {
        const telemetry: TelemetryData = {
          durationMs: timer.stop(),
          status: "coerced_locally",
          coercedPaths: coercion.appliedPaths,
        };

        return {
          success: true,
          data: secondPass.data,
          telemetry,
          isRepaired: parseResult.isRepaired,
          debug: options?.debug
            ? {
                extractedText: parseResult.extractedText,
                repairedText: safeStringify(secondPass.data) ?? parseResult.repairedText,
                appliedRepairs: parseResult.appliedRepairs,
              }
            : undefined,
        };
      }
    }
  }

  // --- Stage 3: Failure — generate retry prompt ---
  const telemetry: TelemetryData = {
    durationMs: timer.stop(),
    status: "failed",
    coercedPaths: [],
  };
  const sourceTextForContext =
    parseResult.repairedText ??
    safeStringify(parseResult.value) ??
    undefined;

  return {
    success: false,
    retryPrompt: generateRetryPrompt(validationResult.errors, undefined, {
      options: options?.retryPrompt,
      sourceText: sourceTextForContext,
      strategy: options?.retryPromptStrategy,
      onContextBlocks: (blocks) => {
        retryContextBlocks = blocks;
      },
    }),
    errors: validationResult.errors,
    telemetry,
    debug: options?.debug
      ? {
          extractedText: parseResult.extractedText,
          repairedText: parseResult.repairedText,
          appliedRepairs: parseResult.appliedRepairs,
          retryContextBlocks:
            retryContextBlocks.length > 0 ? retryContextBlocks : undefined,
        }
      : undefined,
  };
}

function applySemanticCoercion(
  input: unknown,
  issues: ZodIssue[],
  resolution?: GuardSemanticResolution,
): { value: unknown; appliedPaths: string[] } {
  const cloned = deepClone(input);
  const appliedPaths = new Set<string>();

  for (const issue of issues) {
    const path = issue.path;
    const currentValue = getAtPath(cloned, path);
    const nextValue = resolveSemanticValue({
      path,
      issue,
      currentValue,
      resolution,
    });

    if (nextValue !== undefined && nextValue !== currentValue) {
      if (setAtPath(cloned, path, nextValue)) {
        appliedPaths.add(toPathString(path));
      }
    }
  }

  return {
    value: cloned,
    appliedPaths: [...appliedPaths],
  };
}

function resolveSemanticValue(input: {
  path: (string | number)[];
  issue: ZodIssue;
  currentValue: unknown;
  resolution?: GuardSemanticResolution;
}): unknown {
  const { issue, path, currentValue, resolution } = input;

  if (resolution?.resolver) {
    const custom = resolution.resolver({ path, issue, currentValue });
    if (custom !== undefined) return custom;
  }

  const pointer = toPathPointer(path);
  if (resolution?.pathDefaults && pointer in resolution.pathDefaults) {
    return resolution.pathDefaults[pointer];
  }

  if (issue.code === "too_small" && issue.type === "number") {
    const min =
      typeof issue.minimum === "bigint"
        ? Number(issue.minimum)
        : issue.minimum;
    const n = typeof currentValue === "number" ? currentValue : Number(currentValue);
    if (!Number.isFinite(min)) {
      return undefined;
    }
    if (Number.isFinite(n)) {
      if (issue.exact) return min;
      return issue.inclusive ? Math.max(n, min) : Math.max(n, min + Number.EPSILON);
    }
    return min;
  }

  if (issue.code === "too_big" && issue.type === "number") {
    const max =
      typeof issue.maximum === "bigint"
        ? Number(issue.maximum)
        : issue.maximum;
    const n = typeof currentValue === "number" ? currentValue : Number(currentValue);
    if (!Number.isFinite(max)) {
      return undefined;
    }
    if (Number.isFinite(n)) {
      if (issue.exact) return max;
      return issue.inclusive ? Math.min(n, max) : Math.min(n, max - Number.EPSILON);
    }
    return max;
  }

  if (issue.code === "invalid_enum_value") {
    if (Array.isArray(issue.options) && issue.options.length > 0) {
      return issue.options[0];
    }
  }

  return undefined;
}

function deepClone<T>(value: T): T {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function getAtPath(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const segment of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[segment];
  }
  return cur;
}

function setAtPath(obj: unknown, path: (string | number)[], value: unknown): boolean {
  if (path.length === 0) return false;

  let cur: unknown = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = path[i]!;
    if (cur === null || typeof cur !== "object") return false;
    cur = (cur as Record<string | number, unknown>)[segment];
  }

  if (cur === null || typeof cur !== "object") return false;
  const leaf = path[path.length - 1]!;
  (cur as Record<string | number, unknown>)[leaf] = value;
  return true;
}

function toPathPointer(path: (string | number)[]): string {
  return `/${path.map((s) => String(s)).join("/")}`;
}

function toPathString(path: (string | number)[]): string {
  if (path.length === 0) return "$";

  let result = "";
  for (const part of path) {
    if (typeof part === "number") {
      result += `[${part}]`;
    } else if (result.length === 0) {
      result += part;
    } else {
      result += `.${part}`;
    }
  }
  return result;
}

function resolveHeuristics(options?: GuardOptions): GuardHeuristicOptions {
  const profile = options?.profile ?? "standard";

  const profileDefaults: Record<
    "safe" | "standard" | "aggressive",
    GuardHeuristicOptions
  > = {
    safe: {
      escapedQuotes: false,
      singleQuotes: true,
      stripComments: false,
      normalizePythonLiterals: false,
      unquotedKeys: true,
      trailingCommas: true,
    },
    standard: {
      escapedQuotes: true,
      singleQuotes: true,
      stripComments: true,
      normalizePythonLiterals: true,
      unquotedKeys: true,
      trailingCommas: true,
    },
    aggressive: {
      escapedQuotes: true,
      singleQuotes: true,
      stripComments: true,
      normalizePythonLiterals: true,
      unquotedKeys: true,
      trailingCommas: true,
    },
  };

  return {
    ...profileDefaults[profile],
    ...(options?.heuristics ?? {}),
  };
}

function safeStringify(value: unknown): string | null {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return null;
  }
}
