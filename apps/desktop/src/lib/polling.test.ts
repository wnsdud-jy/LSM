import { describe, expect, it } from "vitest";
import { normalizeIntervalMs } from "./polling";

describe("normalizeIntervalMs", () => {
  it("maps arbitrary values to 500/1000/2000", () => {
    expect(normalizeIntervalMs(400)).toBe(500);
    expect(normalizeIntervalMs(999)).toBe(1000);
    expect(normalizeIntervalMs(1500)).toBe(2000);
  });
});
