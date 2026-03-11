/**
 * Telemetry utilities — environment-agnostic high-resolution timing.
 *
 * Uses `performance.now()` which is available in all target runtimes:
 * browsers, Node.js, Deno, Bun, and Cloudflare Workers.
 *
 * @module
 */

/**
 * Create a high-resolution timer.
 *
 * @returns An object with a `stop()` method that returns elapsed milliseconds.
 *
 * @example
 * ```ts
 * const timer = createTimer();
 * // … do work …
 * const elapsed = timer.stop(); // e.g. 0.42
 * ```
 */
export function createTimer(): { stop: () => number } {
  const start = performance.now();
  return {
    stop: () => performance.now() - start,
  };
}
