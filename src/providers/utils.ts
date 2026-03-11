import type { ProviderCallOptions } from "./types.js";

/**
 * Keys managed by Reforge that should not be spread into the
 * provider-specific options object (they are mapped explicitly).
 */
const REFORGE_KEYS = new Set(["temperature", "maxTokens"]);

/**
 * Strip Reforge-managed keys from a `ProviderCallOptions` object so
 * they aren't double-sent when spreading into provider SDK calls.
 *
 * Returns a plain object with only the pass-through keys, or
 * `undefined` if there's nothing left.
 */
export function filterReforgeKeys(
  options?: ProviderCallOptions,
): Record<string, unknown> | undefined {
  if (!options) return undefined;

  const filtered: Record<string, unknown> = {};
  let hasKeys = false;

  for (const key of Object.keys(options)) {
    if (!REFORGE_KEYS.has(key)) {
      filtered[key] = options[key];
      hasKeys = true;
    }
  }

  return hasKeys ? filtered : undefined;
}
