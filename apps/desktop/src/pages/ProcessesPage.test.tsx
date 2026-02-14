import { describe, expect, it } from "vitest";
import { sortProcesses } from "../utils/processSort";
import type { ProcessRow } from "@/types/system";

describe("ProcessesPage helpers", () => {
  it("sortProcesses sorts by pid desc", () => {
    const rows: ProcessRow[] = [
      { pid: 1, user: "u", command: "a", cpu_percent: 1, mem_percent: 1 },
      { pid: 3, user: "u", command: "b", cpu_percent: 2, mem_percent: 2 },
    ];
    const out = sortProcesses(rows, "pid", "desc");
    expect(out[0].pid).toBe(3);
  });
});
