import type { MetricPoint } from "@/types/system";

type MetricCardProps = {
  title: string;
  value: string;
  points: MetricPoint[];
};

export function MetricCard({ title, value, points }: MetricCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{points.length} points</p>
    </section>
  );
}
