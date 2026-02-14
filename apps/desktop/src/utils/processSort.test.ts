import { describe, expect, it } from "vitest";
import { sortProcesses } from "./processSort";

it("sorts by cpu desc", () => {
  const rows = [
    { pid: 1, cpu_percent: 2, mem_percent: 1, user: "a", command: "a" },
    { pid: 2, cpu_percent: 9, mem_percent: 2, user: "b", command: "b" },
  ];
  const out = sortProcesses(rows, "cpu", "desc");
  expect(out[0].pid).toBe(2);
});
