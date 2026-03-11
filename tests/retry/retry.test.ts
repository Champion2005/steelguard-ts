import { describe, it, expect } from "vitest";
import { z } from "zod";
import { generateRetryPrompt } from "../../src/retry/index.js";

describe("generateRetryPrompt", () => {
  it("returns generic prompt for empty errors array", () => {
    const prompt = generateRetryPrompt([]);
    expect(prompt).toContain("failed validation");
    expect(prompt).toContain("Return ONLY valid JSON");
  });

  it("formats a single error with path and expected/received", () => {
    const errors: z.ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: ["user", "age"],
        message: "Expected number, received string",
      },
    ];
    const prompt = generateRetryPrompt(errors);
    expect(prompt).toContain("Path: /user/age");
    expect(prompt).toContain("Expected: number");
    expect(prompt).toContain("Received: string");
    expect(prompt).toContain("Return ONLY valid JSON");
  });

  it("formats multiple errors", () => {
    const errors: z.ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["name"],
        message: "Expected string",
      },
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: ["age"],
        message: "Expected number",
      },
    ];
    const prompt = generateRetryPrompt(errors);
    expect(prompt).toContain("Path: /name");
    expect(prompt).toContain("Path: /age");
  });

  it("handles nested paths with number indices", () => {
    const errors: z.ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "string",
        received: "number",
        path: ["users", 0, "name"],
        message: "Expected string",
      },
    ];
    const prompt = generateRetryPrompt(errors);
    expect(prompt).toContain("Path: /users/0/name");
  });

  it("handles errors without expected/received (e.g. custom)", () => {
    const errors: z.ZodIssue[] = [
      {
        code: "custom",
        path: ["email"],
        message: "Invalid email format",
      },
    ];
    const prompt = generateRetryPrompt(errors);
    expect(prompt).toContain("Path: /email");
    expect(prompt).toContain("Message: Invalid email format");
  });

  it("produces a reasonably token-efficient prompt", () => {
    const errors: z.ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "number",
        received: "string",
        path: ["a"],
        message: "Expected number",
      },
    ];
    const prompt = generateRetryPrompt(errors);
    // Should be concise — less than 200 characters for a single error
    expect(prompt.length).toBeLessThan(200);
  });

  it("handles root-level path", () => {
    const errors: z.ZodIssue[] = [
      {
        code: "invalid_type",
        expected: "object",
        received: "string",
        path: [],
        message: "Expected object",
      },
    ];
    const prompt = generateRetryPrompt(errors);
    expect(prompt).toContain("Path: /");
  });
});
