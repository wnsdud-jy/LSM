import type { MetricsSnapshot, ProcessRow } from "@/types/system";
import { formatBytes } from "@/features/taskManager/format";
import { TrendArea } from "@/features/taskManager/TrendArea";

export function PerformanceTab({ metrics, processes }: { metrics: MetricsSnapshot; processes: ProcessRow[] }) {
  const deviceTiles = [
    {
      name: "CPU",
      sub: `${metrics.cpu_percent.toFixed(1)}%`,
      accent: "border-sky-500/70",
    },
    {
      name: "Memory",
      sub: `${((metrics.ram_used_bytes / Math.max(metrics.ram_total_bytes, 1)) * 100).toFixed(1)}%`,
      accent: "border-emerald-500/70",
    },
    {
      name: "Disk",
      sub: `R ${formatBytes(metrics.disk_read_bps)}/s · W ${formatBytes(metrics.disk_write_bps)}/s`,
      accent: "border-amber-500/70",
    },
    {
      name: "Network",
      sub: `D ${formatBytes(metrics.net_rx_bps)}/s · U ${formatBytes(metrics.net_tx_bps)}/s`,
      accent: "border-fuchsia-500/70",
    },
  ];

  const topCpu = [...processes].sort((a, b) => b.cpu_percent - a.cpu_percent).slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-slate-400">DEVICES</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-1">
          {deviceTiles.map((tile) => (
            <div key={tile.name} className={`rounded-lg border bg-slate-950/60 p-3 ${tile.accent}`}>
              <p className="text-sm font-semibold text-slate-100">{tile.name}</p>
              <p className="mt-1 text-xs text-slate-400">{tile.sub}</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100">Performance</h2>
          <p className="text-sm text-slate-400">Live monitor</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">CPU</p>
            <p className="mb-2 text-xl font-bold text-slate-100">{metrics.cpu_percent.toFixed(1)}%</p>
            <TrendArea points={metrics.cpu_history} stroke="#38bdf8" glow="#38bdf8" />
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Memory</p>
            <p className="mb-2 text-xl font-bold text-slate-100">
              {formatBytes(metrics.ram_used_bytes)} / {formatBytes(metrics.ram_total_bytes)}
            </p>
            <TrendArea points={metrics.ram_history} stroke="#22c55e" glow="#22c55e" />
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Disk Throughput</p>
            <p className="mb-2 text-xl font-bold text-slate-100">
              {formatBytes(metrics.disk_read_bps)}/s · {formatBytes(metrics.disk_write_bps)}/s
            </p>
            <TrendArea points={metrics.disk_write_history} stroke="#f59e0b" glow="#f59e0b" />
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Network</p>
            <p className="mb-2 text-xl font-bold text-slate-100">
              {formatBytes(metrics.net_rx_bps)}/s · {formatBytes(metrics.net_tx_bps)}/s
            </p>
            <TrendArea points={metrics.net_rx_history} stroke="#d946ef" glow="#d946ef" />
          </article>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Top Processes (CPU)</p>
            <div className="space-y-2">
              {topCpu.map((p) => (
                <div key={p.pid} className="flex items-center justify-between rounded bg-slate-900/80 px-3 py-2 text-sm">
                  <span className="max-w-[70%] truncate text-slate-200" title={p.command}>
                    {p.command}
                  </span>
                  <span className="font-mono text-sky-300">{p.cpu_percent.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Quick Stats</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-slate-900/80 p-2 text-slate-300">RAM Used: {formatBytes(metrics.ram_used_bytes)}</div>
              <div className="rounded bg-slate-900/80 p-2 text-slate-300">Swap Used: {formatBytes(metrics.swap_used_bytes)}</div>
              <div className="rounded bg-slate-900/80 p-2 text-slate-300">Net RX: {formatBytes(metrics.net_rx_bps)}/s</div>
              <div className="rounded bg-slate-900/80 p-2 text-slate-300">Net TX: {formatBytes(metrics.net_tx_bps)}/s</div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
