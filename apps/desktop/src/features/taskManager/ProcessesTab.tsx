import { useMemo, useState } from "react";
import { useSystemStore } from "@/stores/systemStore";
import type { ProcessRow } from "@/types/system";
import { ProcessActionButtons } from "@/features/taskManager/ProcessActionButtons";

export function ProcessesTab() {
  const processes = useSystemStore((s) => s.processes);
  const refreshProcesses = useSystemStore((s) => s.refreshProcesses);
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return processes;
    return processes.filter((p) => p.command.toLowerCase().includes(q) || p.user.toLowerCase().includes(q));
  }, [keyword, processes]);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{visible.length} Running Processes</h2>
          <p className="text-sm text-slate-400">Task manager style process control</p>
        </div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search process or user"
          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 outline-none md:w-80"
        />
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="sticky top-0 bg-slate-950 text-xs uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="px-3 py-2">PID</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Process</th>
              <th className="px-3 py-2 text-right">CPU</th>
              <th className="px-3 py-2 text-right">Memory</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row: ProcessRow) => (
              <tr key={row.pid} className="border-t border-slate-800/80 text-slate-200">
                <td className="px-3 py-2 font-mono text-xs">{row.pid}</td>
                <td className="px-3 py-2">{row.user}</td>
                <td className="max-w-[560px] truncate px-3 py-2" title={row.command}>
                  {row.command}
                </td>
                <td className="px-3 py-2 text-right">{row.cpu_percent.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right">{row.mem_percent.toFixed(1)}%</td>
                <td className="px-3 py-2">
                  <ProcessActionButtons pid={row.pid} onDone={refreshProcesses} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
