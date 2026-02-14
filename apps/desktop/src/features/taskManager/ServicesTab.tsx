import { useMemo } from "react";
import { useSystemStore } from "@/stores/systemStore";

export function ServicesTab() {
  const processes = useSystemStore((s) => s.processes);
  const services = useMemo(
    () =>
      processes.filter((p) => {
        const name = p.command.toLowerCase();
        return name.includes(".service") || name.includes("daemon") || name.includes("systemd");
      }),
    [processes],
  );

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-2xl font-bold text-slate-100">{services.length} Total Services</h2>
      <p className="mb-4 text-sm text-slate-400">Derived from running service-like processes</p>
      <div className="max-h-[72vh] overflow-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-slate-950 text-xs uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">PID</th>
              <th className="px-3 py-2 text-right">CPU</th>
              <th className="px-3 py-2 text-right">Memory</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.pid} className="border-t border-slate-800/80 text-slate-200">
                <td className="max-w-[700px] truncate px-3 py-2" title={s.command}>
                  {s.command}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{s.pid}</td>
                <td className="px-3 py-2 text-right">{s.cpu_percent.toFixed(1)}%</td>
                <td className="px-3 py-2 text-right">{s.mem_percent.toFixed(1)}%</td>
                <td className="px-3 py-2 text-emerald-300">Running</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
