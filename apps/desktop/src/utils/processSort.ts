import type { ProcessRow } from "@/types/system";

export function sortProcesses(
  rows: ProcessRow[],
  by: "cpu" | "mem" | "pid",
  dir: "asc" | "desc",
): ProcessRow[] {
  const out = [...rows];
  out.sort((a, b) => {
    const value = by === "cpu" ? a.cpu_percent - b.cpu_percent : by === "mem" ? a.mem_percent - b.mem_percent : a.pid - b.pid;
    return dir === "asc" ? value : -value;
  });
  return out;
}
