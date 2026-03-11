import { describe, it, expect } from "vitest";
import { dirtyParse } from "../../src/dirty-parser/index.js";

describe("dirtyParse", () => {
  // -----------------------------------------------------------------------
  // Clean JSON (fast path)
  // -----------------------------------------------------------------------

  it("parses clean JSON object without repair", () => {
    const r = dirtyParse('{"name": "Alice", "age": 30}');
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ name: "Alice", age: 30 });
      expect(r.isRepaired).toBe(false);
    }
  });

  it("parses clean JSON array without repair", () => {
    const r = dirtyParse("[1, 2, 3]");
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual([1, 2, 3]);
      expect(r.isRepaired).toBe(false);
    }
  });

  it("parses clean JSON string without repair", () => {
    const r = dirtyParse('"hello"');
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toBe("hello");
      expect(r.isRepaired).toBe(false);
    }
  });

  it("parses JSON number without repair", () => {
    const r = dirtyParse("42");
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toBe(42);
      expect(r.isRepaired).toBe(false);
    }
  });

  it("parses null without repair", () => {
    const r = dirtyParse("null");
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toBe(null);
      expect(r.isRepaired).toBe(false);
    }
  });

  // -----------------------------------------------------------------------
  // Markdown extraction + parse
  // -----------------------------------------------------------------------

  it("repairs markdown-wrapped JSON", () => {
    const input = '```json\n{"name": "Alice"}\n```';
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ name: "Alice" });
      expect(r.isRepaired).toBe(true);
    }
  });

  it("repairs conversational-wrapped JSON", () => {
    const input = 'Here is the data: {"a": 1}';
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ a: 1 });
      expect(r.isRepaired).toBe(true);
    }
  });

  // -----------------------------------------------------------------------
  // Heuristic fixes + parse
  // -----------------------------------------------------------------------

  it("repairs trailing commas", () => {
    const input = '{"a": 1, "b": 2,}';
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ a: 1, b: 2 });
      expect(r.isRepaired).toBe(true);
    }
  });

  it("repairs unquoted keys", () => {
    const input = '{name: "Alice", age: 30}';
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ name: "Alice", age: 30 });
      expect(r.isRepaired).toBe(true);
    }
  });

  it("repairs single-quoted strings", () => {
    const input = "{'name': 'Alice'}";
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ name: "Alice" });
      expect(r.isRepaired).toBe(true);
    }
  });

  // -----------------------------------------------------------------------
  // Bracket balancing + parse
  // -----------------------------------------------------------------------

  it("repairs truncated object", () => {
    const input = '{"name": "Alice", "items": [1, 2';
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ name: "Alice", items: [1, 2] });
      expect(r.isRepaired).toBe(true);
    }
  });

  // -----------------------------------------------------------------------
  // Combined repairs (real-world LLM output)
  // -----------------------------------------------------------------------

  it("repairs markdown + trailing commas + unquoted keys", () => {
    const input = '```json\n{name: "Alice", age: 30,}\n```';
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ name: "Alice", age: 30 });
      expect(r.isRepaired).toBe(true);
    }
  });

  it("repairs markdown + truncation", () => {
    const input =
      'Here is your data:\n```json\n{"items": [{"id": 1}, {"id": 2';
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ items: [{ id: 1 }, { id: 2 }] });
      expect(r.isRepaired).toBe(true);
    }
  });

  it("repairs all issues combined: markdown + single quotes + trailing comma + truncation", () => {
    const input = "Sure! ```json\n{'users': [{'name': 'Alice',}";
    const r = dirtyParse(input);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.value).toEqual({ users: [{ name: "Alice" }] });
      expect(r.isRepaired).toBe(true);
    }
  });

  // -----------------------------------------------------------------------
  // Failure cases
  // -----------------------------------------------------------------------

  it("fails on completely non-JSON input", () => {
    const r = dirtyParse("This is not JSON at all.");
    expect(r.success).toBe(false);
  });

  it("fails on empty string", () => {
    const r = dirtyParse("");
    expect(r.success).toBe(false);
  });

  it("rejects input larger than 10MB", () => {
    const huge = "{" + '"a":'.repeat(3_000_000) + '"b"}';
    expect(huge.length).toBeGreaterThan(10 * 1024 * 1024);
    const r = dirtyParse(huge);
    expect(r.success).toBe(false);
  });
});
