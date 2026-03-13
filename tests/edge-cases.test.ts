import { describe, expect, it } from "vitest";
import { z } from "zod";
import { guard } from "../src/guard.js";
import { dirtyParse } from "../src/dirty-parser/index.js";

describe("edge cases", () => {
  it("handles deeply nested truncated arrays", () => {
    const depth = 100;
    const opens = "[".repeat(depth);
    const raw = opens + "1";

    const result = dirtyParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Array.isArray(result.value)).toBe(true);
    }
  });

  it("handles large valid JSON payloads", () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.number(), text: z.string() })),
    });

    const items = Array.from({ length: 8000 }, (_, i) => ({
      id: i,
      text: "x".repeat(100),
    }));
    const raw = JSON.stringify({ items });

    const result = guard(raw, schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items.length).toBe(8000);
    }
  });

  it("preserves unicode and zero-width characters", () => {
    const schema = z.object({ text: z.string() });
    const raw = '{"text":"emoji 😀 and zwsp \u200b and accented café"}';

    const result = guard(raw, schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toContain("😀");
      expect(result.data.text).toContain("\u200b");
    }
  });

  it("fails safely when null bytes are present in otherwise invalid JSON", () => {
    const schema = z.object({ value: z.number() });
    const raw = "{\u0000value: 1}";

    const result = guard(raw, schema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.retryPrompt).toContain("valid JSON");
      expect(result.telemetry.status).toBe("failed");
    }
  });

  it("handles long backslash-heavy string content", () => {
    const schema = z.object({ value: z.string() });
    const slashes = "\\\\\\\\\\\\\\\\\\\\\\\\\\\\";
    const raw = JSON.stringify({ value: `prefix-${slashes}-suffix` });

    const result = guard(raw, schema);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toContain("prefix-");
      expect(result.data.value).toContain("-suffix");
    }
  });
});
