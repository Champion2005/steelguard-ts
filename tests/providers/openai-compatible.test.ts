import { describe, it, expect, vi } from "vitest";
import { openaiCompatible } from "../../src/providers/openai-compatible.js";
import type { Message } from "../../src/providers/types.js";

/**
 * Helper: create a mock OpenAI-compatible client.
 */
function mockOpenAIClient(content: string | null = '{"result": true}') {
  return {
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [
            {
              message: { content },
            },
          ],
        })),
      },
    },
  };
}

describe("openaiCompatible()", () => {
  const messages: Message[] = [
    { role: "system", content: "Return JSON." },
    { role: "user", content: "Hello" },
  ];

  it("calls client.chat.completions.create with correct params", async () => {
    const client = mockOpenAIClient('{"ok": true}');
    const provider = openaiCompatible(client, "gpt-4o");

    await provider.call(messages, { temperature: 0.7, maxTokens: 500 });

    expect(client.chat.completions.create).toHaveBeenCalledWith({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Return JSON." },
        { role: "user", content: "Hello" },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
  });

  it("returns the response content string", async () => {
    const client = mockOpenAIClient('{"name": "Alice"}');
    const provider = openaiCompatible(client, "gpt-4o");

    const result = await provider.call(messages);

    expect(result).toBe('{"name": "Alice"}');
  });

  it("throws on empty response", async () => {
    const client = mockOpenAIClient(null);
    const provider = openaiCompatible(client, "gpt-4o");

    await expect(provider.call(messages)).rejects.toThrow(
      "OpenAI-compatible provider returned an empty response",
    );
  });

  it("throws on empty string response", async () => {
    const client = mockOpenAIClient("");
    const provider = openaiCompatible(client, "gpt-4o");

    await expect(provider.call(messages)).rejects.toThrow(
      "OpenAI-compatible provider returned an empty response",
    );
  });

  it("throws when choices array is empty", async () => {
    const client = {
      chat: {
        completions: {
          create: vi.fn(async () => ({ choices: [] })),
        },
      },
    };
    const provider = openaiCompatible(client, "gpt-4o");

    await expect(provider.call(messages)).rejects.toThrow(
      "OpenAI-compatible provider returned an empty response",
    );
  });

  it("passes through extra options", async () => {
    const client = mockOpenAIClient('{"ok": true}');
    const provider = openaiCompatible(client, "gpt-4o");

    await provider.call(messages, {
      temperature: 0.5,
      maxTokens: 200,
      response_format: { type: "json_object" },
    });

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o",
        temperature: 0.5,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    );
  });

  it("works without options", async () => {
    const client = mockOpenAIClient('{"data": 1}');
    const provider = openaiCompatible(client, "gpt-4o-mini");

    const result = await provider.call(messages);

    expect(result).toBe('{"data": 1}');
    expect(client.chat.completions.create).toHaveBeenCalledWith({
      model: "gpt-4o-mini",
      messages: expect.any(Array),
      temperature: undefined,
      max_tokens: undefined,
    });
  });
});
