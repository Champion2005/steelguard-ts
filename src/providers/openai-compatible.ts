import type { ReforgeProvider, Message, ProviderCallOptions } from "./types.js";
import { filterReforgeKeys } from "./utils.js";

/**
 * Minimal subset of the `OpenAI` client used by the adapter.
 * This avoids importing the full `openai` package at the type level
 * while still providing type-safety for users who pass their client.
 */
interface OpenAICompatibleClient {
  chat: {
    completions: {
      create(params: Record<string, unknown>): Promise<{
        choices: Array<{
          message?: { content?: string | null };
        }>;
      }>;
    };
  };
}

/**
 * Create a `ReforgeProvider` for any OpenAI-compatible API.
 *
 * Works with: **OpenAI**, **OpenRouter**, **Together AI**, **Groq**,
 * **Fireworks**, **Perplexity**, **Ollama**, **LM Studio**, **vLLM**,
 * **Deepseek**, **Mistral**, and any other provider that implements the
 * `/v1/chat/completions` API shape.
 *
 * The user passes their own pre-configured client (with `baseURL` and
 * `apiKey` already set). Reforge never manages credentials.
 *
 * @param client - An `OpenAI` client instance (from the `openai` npm package).
 * @param model  - The model identifier (e.g. `"gpt-4o"`, `"llama-3-70b"`).
 * @returns A `ReforgeProvider` ready to use with `forge()`.
 *
 * @example
 * ```ts
 * import OpenAI from 'openai';
 * import { openaiCompatible } from 'reforge-ai/openai-compatible';
 *
 * // Direct OpenAI
 * const provider = openaiCompatible(new OpenAI(), 'gpt-4o');
 *
 * // OpenRouter
 * const provider = openaiCompatible(
 *   new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: '...' }),
 *   'anthropic/claude-3.5-sonnet',
 * );
 * ```
 */
export function openaiCompatible(
  client: OpenAICompatibleClient,
  model: string,
): ReforgeProvider {
  return {
    async call(
      messages: Message[],
      options?: ProviderCallOptions,
    ): Promise<string> {
      const extra = filterReforgeKeys(options);

      const params: Record<string, unknown> = {
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        ...extra,
      };

      if (options?.temperature !== undefined) {
        params.temperature = options.temperature;
      }

      if (options?.maxTokens !== undefined) {
        params.max_tokens = options.maxTokens;
      }

      const response = await client.chat.completions.create(params);

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("OpenAI-compatible provider returned an empty response");
      }
      return content;
    },
  };
}
