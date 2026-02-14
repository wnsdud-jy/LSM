import { describe, expect, it } from "vitest";
import { useSystemStore } from "./systemStore";

describe("systemStore interval", () => {
  it("accepts only 500/1000/2000ms", () => {
    const { setIntervalMs } = useSystemStore.getState();
    setIntervalMs(700);
    expect(useSystemStore.getState().intervalMs).toBe(1000);
  });
});
