import { describe, it, expect } from "vitest";
import { balanceBrackets } from "../../src/dirty-parser/balance.js";

describe("balanceBrackets", () => {
  // -----------------------------------------------------------------------
  // No-op cases
  // -----------------------------------------------------------------------

  it("returns empty string unchanged", () => {
    const r = balanceBrackets("");
    expect(r).toEqual({ result: "", wasBalanced: false });
  });

  it("returns already-balanced object unchanged", () => {
    const input = '{"name": "Alice"}';
    const r = balanceBrackets(input);
    expect(r).toEqual({ result: input, wasBalanced: false });
  });

  it("returns already-balanced array unchanged", () => {
    const input = "[1, 2, 3]";
    const r = balanceBrackets(input);
    expect(r).toEqual({ result: input, wasBalanced: false });
  });

  it("returns balanced nested structure unchanged", () => {
    const input = '{"a": {"b": [1, 2]}}';
    const r = balanceBrackets(input);
    expect(r).toEqual({ result: input, wasBalanced: false });
  });

  // -----------------------------------------------------------------------
  // Truncated (unclosed) structures
  // -----------------------------------------------------------------------

  it("closes truncated object", () => {
    const r = balanceBrackets('{"name": "Alice"');
    expect(r.wasBalanced).toBe(true);
    expect(r.result).toBe('{"name": "Alice"}');
    expect(JSON.parse(r.result)).toEqual({ name: "Alice" });
  });

  it("closes truncated array", () => {
    const r = balanceBrackets("[1, 2, 3");
    expect(r.wasBalanced).toBe(true);
    expect(r.result).toBe("[1, 2, 3]");
    expect(JSON.parse(r.result)).toEqual([1, 2, 3]);
  });

  it("closes deeply nested truncated structure", () => {
    const input = '{"items": [{"id": 1';
    const r = balanceBrackets(input);
    expect(r.wasBalanced).toBe(true);
    expect(r.result).toBe('{"items": [{"id": 1}]}');
    expect(JSON.parse(r.result)).toEqual({ items: [{ id: 1 }] });
  });

  it("closes multiple levels of nesting", () => {
    const input = '{"a": {"b": {"c": [1, 2';
    const r = balanceBrackets(input);
    expect(r.wasBalanced).toBe(true);
    expect(JSON.parse(r.result)).toEqual({ a: { b: { c: [1, 2] } } });
  });

  it("closes truncated string inside object", () => {
    const input = '{"name": "Alice';
    const r = balanceBrackets(input);
    expect(r.wasBalanced).toBe(true);
    // Should close the string and the object
    expect(r.result).toBe('{"name": "Alice"}');
  });

  // -----------------------------------------------------------------------
  // Extra closing brackets (orphans)
  // -----------------------------------------------------------------------

  it("strips orphaned closing brace", () => {
    const r = balanceBrackets('{"a": 1}}');
    expect(r.wasBalanced).toBe(true);
    expect(r.result).toBe('{"a": 1}');
  });

  it("strips orphaned closing bracket", () => {
    const r = balanceBrackets("[1, 2]]");
    expect(r.wasBalanced).toBe(true);
    expect(r.result).toBe("[1, 2]");
  });

  // -----------------------------------------------------------------------
  // String context awareness
  // -----------------------------------------------------------------------

  it("ignores brackets inside string values", () => {
    const input = '{"text": "has {brackets} and [arrays]"}';
    const r = balanceBrackets(input);
    expect(r).toEqual({ result: input, wasBalanced: false });
  });

  it("ignores escaped quotes inside strings", () => {
    const input = '{"text": "has \\"escaped\\" quotes"}';
    const r = balanceBrackets(input);
    expect(r).toEqual({ result: input, wasBalanced: false });
  });

  // -----------------------------------------------------------------------
  // Complex scenarios
  // -----------------------------------------------------------------------

  it("handles array of objects, truncated", () => {
    const input = '[{"id": 1}, {"id": 2';
    const r = balanceBrackets(input);
    expect(r.wasBalanced).toBe(true);
    expect(JSON.parse(r.result)).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("handles object with array value, truncated at array level", () => {
    const input = '{"items": [1, 2, 3';
    const r = balanceBrackets(input);
    expect(r.wasBalanced).toBe(true);
    expect(JSON.parse(r.result)).toEqual({ items: [1, 2, 3] });
  });
});
