import type { MetricPoint } from "@/types/system";

type SparklineProps = {
  points: MetricPoint[];
  className?: string;
};

export function Sparkline({ points, className = "" }: SparklineProps) {
  const pathD = points
    .map((point, idx) => `${idx === 0 ? "M" : "L"}${idx * 6},${Math.max(0, 40 - point.value / 4)}`)
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${Math.max(points.length - 1, 1) * 6} 40`} className={className}>
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
