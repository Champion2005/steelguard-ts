import type { ReforgeProvider, Message, ProviderCallOptions } from "./types.js";
import { filterReforgeKeys } from "./utils.js";

/**
 * Minimal subset of the Anthropic client used by the adapter.
 */
interface AnthropicClient {
  messages: {
    create(params: Record<string, unknown>): Promise<{
      content: Array<{ type: string; text?: string }>;
    }>;
  };
}

/**
 * Create a `ReforgeProvider` for the Anthropic Messages API.
 *
 * Only needed for **direct** Anthropic API access. If you're using
 * Claude through OpenRouter or another proxy, use `openaiCompatible()` instead.
 *
 * @param client - An `Anthropic` client instance (from `@anthropic-ai/sdk`).
 * @param model  - The model identifier (e.g. `"claude-sonnet-4-20250514"`).
 * @returns A `ReforgeProvider` ready to use with `forge()`.
 *
 * @example
 * ```ts
 * import Anthropic from '@anthropic-ai/sdk';
 * import { anthropic } from 'reforge-ai/anthropic';
 *
 * const provider = anthropic(new Anthropic(), 'claude-sonnet-4-20250514');
 * ```
 */
export function anthropic(
  client: AnthropicClient,
  model: string,
): ReforgeProvider {
  return {
    async call(
      messages: Message[],
      options?: ProviderCallOptions,
    ): Promise<string> {
      const extra = filterReforgeKeys(options);

      // Anthropic requires system messages to be passed separately
      const systemMessages = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content);
      const nonSystemMsgs = messages.filter((m) => m.role !== "system");

      const params: Record<string, unknown> = {
        model,
        max_tokens: options?.maxTokens ?? 4096,
        messages: nonSystemMsgs.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        ...extra,
      };

      if (systemMessages.length > 0) {
        params.system = systemMessages.join("\n\n");
      }

      if (options?.temperature !== undefined) {
        params.temperature = options.temperature;
      }

      const response = await client.messages.create(params);

      const textBlock = response.content.find((b) => b.type === "text");
      if (!textBlock || textBlock.type !== "text" || !textBlock.text) {
        throw new Error("Anthropic returned no text content");
      }
      return textBlock.text;
    },
  };
}
