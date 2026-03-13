import type { ZodIssue } from "zod";
import type { TelemetryData, GuardOptions } from "../types.js";

// ---------------------------------------------------------------------------
// Provider Layer Types — these form the contract for the forge() function
// and provider adapters.
// ---------------------------------------------------------------------------

/**
 * A message in the LLM conversation format.
 */
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Options passed through to the provider SDK call.
 * `temperature` and `maxTokens` are the common subset; any extra
 * key-value pairs are forwarded as-is.
 */
export interface ProviderCallOptions {
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

/**
 * The minimal interface every provider adapter must implement.
 *
 * Each built-in adapter factory (`openaiCompatible()`, `anthropic()`, `google()`)
 * returns an object satisfying this interface. Users can also implement it
 * directly for any provider not covered by the built-ins.
 */
export interface ReforgeProvider {
  call(messages: Message[], options?: ProviderCallOptions): Promise<string>;
}

export interface ForgeFailurePayload {
  errors: ZodIssue[];
  retryPrompt: string;
}

export interface ForgeRetryPolicy {
  maxRetries?: number;
  shouldRetry?: (failure: ForgeFailurePayload, attempt: number) => boolean;
  mutateProviderOptions?: (
    attempt: number,
    baseOptions: ProviderCallOptions | undefined,
  ) => ProviderCallOptions;
}

export type ForgeEvent =
  | { kind: "attempt_start"; attempt: number; totalAttempts: number }
  | {
      kind: "provider_response";
      attempt: number;
      rawLength: number;
      truncatedForRetry: boolean;
    }
  | {
      kind: "guard_success";
      attempt: number;
      status: "clean" | "repaired_natively";
      durationMs: number;
    }
  | {
      kind: "guard_failure";
      attempt: number;
      durationMs: number;
      errorCount: number;
    }
  | {
      kind: "retry_scheduled";
      attempt: number;
      nextAttempt: number;
      reason: "guard_failure";
    }
  | {
      kind: "finished";
      success: boolean;
      attempts: number;
      totalDurationMs: number;
    };

/**
 * Options for the `forge()` orchestrator.
 */
export interface ForgeOptions {
  /** Maximum number of retry attempts after the initial call. Default: 3. */
  maxRetries?: number;
  /** Optional retry policy hooks for advanced retry control. */
  retryPolicy?: ForgeRetryPolicy;
  /** Options passed through to the provider on every call. */
  providerOptions?: ProviderCallOptions;
  /** Forwarded to `guard()` on every attempt. */
  guardOptions?: GuardOptions;
  /** Callback invoked after a failed attempt that will be retried. */
  onRetry?: (attempt: number, failure: { errors: ZodIssue[]; retryPrompt: string }) => void;
  /** Structured event stream for observability. */
  onEvent?: (event: ForgeEvent) => void;
}

export interface ForgeFallbackProvider {
  provider: ReforgeProvider;
  maxAttempts?: number;
  providerOptions?: ProviderCallOptions;
}

export interface ForgeFallbackOptions {
  guardOptions?: GuardOptions;
  onRetry?: ForgeOptions["onRetry"];
  onEvent?: ForgeOptions["onEvent"];
  onProviderFallback?: (fromProviderIndex: number, toProviderIndex: number) => void;
}

export interface ForgeAttemptDetail {
  attempt: number;
  durationMs: number;
  status: "clean" | "repaired_natively" | "failed";
}

/**
 * Telemetry data from a `forge()` run. Extends the core `TelemetryData`
 * with multi-attempt tracking.
 */
export interface ForgeTelemetry extends TelemetryData {
  /** Total number of provider calls made (1 = success on first try). */
  attempts: number;
  /** Wall-clock time across all attempts (including provider latency). */
  totalDurationMs: number;
  /** Per-attempt guard telemetry snapshots. */
  attemptDetails: ForgeAttemptDetail[];
}

/**
 * Returned when `forge()` succeeds — the LLM output has been validated
 * (possibly after retries).
 */
export interface ForgeSuccess<T> {
  success: true;
  data: T;
  telemetry: ForgeTelemetry;
  isRepaired: boolean;
}

/**
 * Returned when `forge()` fails — all retry attempts exhausted.
 */
export interface ForgeFailure {
  success: false;
  errors: ZodIssue[];
  retryPrompt: string;
  telemetry: ForgeTelemetry;
}

/**
 * Discriminated union returned by `forge()`.
 */
export type ForgeResult<T> = ForgeSuccess<T> | ForgeFailure;
