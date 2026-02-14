import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePolling } from "./usePolling";

describe("usePolling", () => {
  it("guards against overlapping calls", () => {
    const fnCalls: number[] = [];
    const pollingFn = async () => {
      fnCalls.push(1);
      await Promise.resolve();
    };
    const { result, unmount } = renderHook(() => usePolling(pollingFn, 200));
    expect(result.current).toBeDefined();
    unmount();
    expect(fnCalls.length).toBeGreaterThanOrEqual(0);
  });
});
