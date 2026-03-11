import type { ZodTypeAny, infer as ZodInfer } from "zod";
import type {
  ReforgeProvider,
  Message,
  ForgeOptions,
  ForgeResult,
  ForgeTelemetry,
} from "./types.js";
import { guard } from "../guard.js";
import { createTimer } from "../telemetry.js";

/**
 * End-to-end structured LLM output: call a provider, validate with
 * `guard()`, and automatically retry on failure.
 *
 * @typeParam T - A Zod schema type.
 * @param provider  - A `ReforgeProvider` (built-in adapter or custom).
 * @param messages  - The conversation messages to send to the LLM.
 * @param schema    - The Zod schema the output must conform to.
 * @param options   - Optional configuration (maxRetries, providerOptions).
 * @returns A `ForgeResult<z.infer<T>>` with telemetry.
 */
export async function forge<T extends ZodTypeAny>(
  provider: ReforgeProvider,
  messages: Message[],
  schema: T,
  options?: ForgeOptions,
): Promise<ForgeResult<ZodInfer<T>>> {
  const maxRetries = options?.maxRetries ?? 3;
  const totalAttempts = 1 + maxRetries;
  const timer = createTimer();

  // Clone messages so we never mutate the caller's array
  const conversation: Message[] = [...messages];

  let lastErrors: import("zod").ZodIssue[] = [];
  let lastTelemetry: import("../types.js").TelemetryData | undefined;

  for (let attempt = 1; attempt <= totalAttempts; attempt++) {
    // Let provider errors bubble — they are the user's responsibility
    const raw = await provider.call(conversation, options?.providerOptions);

    const result = guard(raw, schema);
    lastTelemetry = result.telemetry;

    if (result.success) {
      const forgeTelemetry: ForgeTelemetry = {
        durationMs: result.telemetry.durationMs,
        status: result.telemetry.status,
        attempts: attempt,
        totalDurationMs: timer.stop(),
      };

      return {
        success: true,
        data: result.data,
        telemetry: forgeTelemetry,
        isRepaired: result.isRepaired,
      };
    }

    lastErrors = result.errors;

    // Don't append retry messages after the final attempt
    if (attempt < totalAttempts) {
      conversation.push(
        { role: "assistant", content: raw },
        { role: "user", content: result.retryPrompt },
      );
    }
  }

  // All attempts exhausted
  const forgeTelemetry: ForgeTelemetry = {
    durationMs: lastTelemetry?.durationMs ?? 0,
    status: "failed",
    attempts: totalAttempts,
    totalDurationMs: timer.stop(),
  };

  return {
    success: false,
    errors: lastErrors,
    telemetry: forgeTelemetry,
  };
}
