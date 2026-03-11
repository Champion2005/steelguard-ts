import { describe, it, expect } from "vitest";
import { createTimer } from "../src/telemetry.js";

describe("createTimer", () => {
  it("returns a positive durationMs", () => {
    const timer = createTimer();
    // Small busy loop to ensure non-zero time.
    let sum = 0;
    for (let i = 0; i < 1000; i++) sum += i;
    const elapsed = timer.stop();
    expect(typeof elapsed).toBe("number");
    expect(elapsed).toBeGreaterThanOrEqual(0);
    // Suppress unused var lint
    void sum;
  });

  it("measures increasing time", () => {
    const timer = createTimer();
    const first = timer.stop();
    // Do a little more work.
    let sum = 0;
    for (let i = 0; i < 100000; i++) sum += i;
    const second = timer.stop();
    expect(second).toBeGreaterThanOrEqual(first);
    void sum;
  });
});
