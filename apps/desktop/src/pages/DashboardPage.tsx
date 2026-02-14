import { MetricCard } from "@/components/metrics/MetricCard";
import { useSystemStore } from "@/stores/systemStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardPage() {
  const metrics = useSystemStore((s) => s.metrics);
  const safeRam = metrics.ram_total_bytes > 0 ? (metrics.ram_used_bytes / metrics.ram_total_bytes) * 100 : 0;
  const safeSwap = metrics.swap_total_bytes > 0 ? (metrics.swap_used_bytes / metrics.swap_total_bytes) * 100 : 0;

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
      </Card>
      <MetricCard title="CPU" value={`${metrics.cpu_percent.toFixed(1)}%`} points={metrics.cpu_history} />
      <MetricCard title="RAM" value={`${safeRam.toFixed(1)}%`} points={metrics.ram_history} />
      <MetricCard title="Swap" value={`${safeSwap.toFixed(1)}%`} points={metrics.ram_history} />
      <MetricCard title="Disk Read" value={`${metrics.disk_read_bps.toFixed(0)} B/s`} points={metrics.disk_read_history} />
      <MetricCard title="Disk Write" value={`${metrics.disk_write_bps.toFixed(0)} B/s`} points={metrics.disk_write_history} />
      <MetricCard
        title="Network"
        value={`${metrics.net_rx_bps.toFixed(0)} / ${metrics.net_tx_bps.toFixed(0)} B/s`}
        points={metrics.net_rx_history}
      />
    </section>
  );
}
