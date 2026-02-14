import type { MetricPoint } from "@/types/system";

type SparklineProps = {
  points: MetricPoint[];
  className?: string;
};

export function Sparkline({ points, className = "" }: SparklineProps) {
  if (points.length === 0) {
    return <div className={`h-full w-full rounded-md bg-slate-100 ${className}`} />;
  }

  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const width = Math.max(points.length - 1, 1) * 8;

  const pathD = points
    .map((point, idx) => {
      const x = idx * 8;
      const y = 48 - (point.value / maxValue) * 42;
      return `${idx === 0 ? "M" : "L"}${x},${Math.max(2, Number(y.toFixed(2)))}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${Math.max(width, 40)} 50`} className={`h-12 w-full ${className}`}>
      <path d={pathD} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <line x1="0" y1="48" x2={Math.max(width, 40)} y2="48" stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}
