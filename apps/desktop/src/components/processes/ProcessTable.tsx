import type { ProcessRow } from "@/types/system";
import { useMemo } from "react";

export function ProcessTable({ rows }: { rows: ProcessRow[] }) {
  const list = useMemo(() => rows, [rows]);

  return (
    <div className="overflow-hidden rounded border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2">PID</th>
            <th className="p-2">USER</th>
            <th className="p-2">COMMAND</th>
            <th className="p-2">CPU%</th>
            <th className="p-2">MEM%</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.pid} className="border-t border-slate-100">
              <td className="p-2">{row.pid}</td>
              <td className="p-2">{row.user}</td>
              <td className="p-2">{row.command}</td>
              <td className="p-2">{row.cpu_percent.toFixed(1)}</td>
              <td className="p-2">{row.mem_percent.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
