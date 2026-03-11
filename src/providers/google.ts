import type { ReforgeProvider, Message, ProviderCallOptions } from "./types.js";

/**
 * Minimal subset of the Google Generative AI client used by the adapter.
 */
interface GoogleGenerativeAIClient {
  getGenerativeModel(params: {
    model: string;
    generationConfig?: Record<string, unknown>;
  }): {
    startChat(params: {
      history?: Array<{ role: string; parts: Array<{ text: string }> }>;
      systemInstruction?: { role: string; parts: Array<{ text: string }> };
    }): {
      sendMessage(
        message: string,
      ): Promise<{ response: { text(): string } }>;
    };
  };
}

/**
 * Create a `ReforgeProvider` for Google Gemini / Vertex AI.
 *
 * Only needed for **direct** Google AI access via the `@google/generative-ai`
 * SDK. If you're using Gemini through an OpenAI-compatible proxy, use
 * `openaiCompatible()` instead.
 *
 * @param client - A `GoogleGenerativeAI` instance (from `@google/generative-ai`).
 * @param model  - The model identifier (e.g. `"gemini-2.0-flash"`).
 * @returns A `ReforgeProvider` ready to use with `forge()`.
 *
 * @example
 * ```ts
 * import { GoogleGenerativeAI } from '@google/generative-ai';
 * import { google } from 'reforge-ai/google';
 *
 * const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
 * const provider = google(client, 'gemini-2.0-flash');
 * ```
 */
export function google(
  client: GoogleGenerativeAIClient,
  model: string,
): ReforgeProvider {
  return {
    async call(
      messages: Message[],
      options?: ProviderCallOptions,
    ): Promise<string> {
      const generationConfig: Record<string, unknown> = {};
      if (options?.temperature !== undefined) {
        generationConfig.temperature = options.temperature;
      }
      if (options?.maxTokens !== undefined) {
        generationConfig.maxOutputTokens = options.maxTokens;
      }

      const genModel = client.getGenerativeModel({
        model,
        generationConfig,
      });

      // Convert messages to Gemini format
      const systemMsg = messages.find((m) => m.role === "system");
      const nonSystemMsgs = messages.filter((m) => m.role !== "system");

      const history = nonSystemMsgs.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const lastMsg = nonSystemMsgs[nonSystemMsgs.length - 1];
      if (!lastMsg) {
        throw new Error("No user message provided");
      }

      const chat = genModel.startChat({
        history,
        systemInstruction: systemMsg
          ? { role: "user", parts: [{ text: systemMsg.content }] }
          : undefined,
      });

      const result = await chat.sendMessage(lastMsg.content);
      const text = result.response.text();
      if (!text) {
        throw new Error("Google returned an empty response");
      }
      return text;
    },
  };
}
