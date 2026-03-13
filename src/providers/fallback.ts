import type { ZodTypeAny, infer as ZodInfer } from "zod";
import { forge } from "./forge.js";
import type {
  ForgeFallbackOptions,
  ForgeFallbackProvider,
  ForgeResult,
} from "./types.js";

/**
 * Try multiple providers in order until one succeeds.
 *
 * Each provider can define its own `maxAttempts` and `providerOptions`.
 * The helper preserves the same `ForgeResult<T>` contract as `forge()`.
 */
export async function forgeWithFallback<T extends ZodTypeAny>(
  providers: ForgeFallbackProvider[],
  messages: import("./types.js").Message[],
  schema: T,
  options?: ForgeFallbackOptions,
): Promise<ForgeResult<ZodInfer<T>>> {
  if (providers.length === 0) {
    throw new Error("forgeWithFallback requires at least one provider");
  }

  let lastFailure: ForgeResult<ZodInfer<T>> | null = null;

  for (let i = 0; i < providers.length; i++) {
    const entry = providers[i]!;

    const result = await forge(entry.provider, messages, schema, {
      maxRetries: Math.max(0, (entry.maxAttempts ?? 1) - 1),
      providerOptions: entry.providerOptions,
      guardOptions: options?.guardOptions,
      onRetry: options?.onRetry,
      onEvent: options?.onEvent,
    });

    if (result.success) {
      return result;
    }

    lastFailure = result;

    if (i < providers.length - 1) {
      options?.onProviderFallback?.(i, i + 1);
    }
  }

  return lastFailure as ForgeResult<ZodInfer<T>>;
}
