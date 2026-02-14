import { useId } from "react";

export function TrendArea({
  points,
  stroke,
  glow,
}: {
  points: Array<{ value: number }>;
  stroke: string;
  glow: string;
}) {
  const safe = points.slice(-60);
  const gradientId = useId();

  if (safe.length === 0) {
    return <div className="h-28 rounded-lg border border-slate-800 bg-slate-950/50" />;
  }

  const width = 360;
  const height = 112;
  const inset = 6;
  const min = Math.min(...safe.map((p) => p.value));
  const max = Math.max(...safe.map((p) => p.value), 1);
  const range = Math.max(max - min, 1);

  const coords = safe.map((point, idx) => {
    const x = inset + (idx / Math.max(safe.length - 1, 1)) * (width - inset * 2);
    const normalized = (point.value - min) / range;
    const y = inset + (1 - normalized) * (height - inset * 2);
    return { x, y };
  });

  const linePath = coords
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${(height - inset).toFixed(2)} L ${coords[0].x.toFixed(2)} ${(height - inset).toFixed(2)} Z`;

  return (
    <div className="relative h-28 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={glow} stopOpacity="0.45" />
            <stop offset="100%" stopColor={glow} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((g) => (
          <line
            key={g}
            x1={0}
            x2={width}
            y1={height * g}
            y2={height * g}
            stroke="#334155"
            strokeOpacity="0.45"
            strokeWidth="1"
          />
        ))}
        <path d={areaPath} fill={`url(#${gradientId})`} className="tm-area-rise" />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" className="tm-line-draw" />
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="2.8" fill={stroke} className="tm-dot-pulse" />
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent_20%,rgba(255,255,255,0.06)_46%,transparent_72%)] tm-scan" />
    </div>
  );
}
