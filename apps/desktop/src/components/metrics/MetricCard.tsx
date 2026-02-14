import { Sparkline } from "@/components/metrics/Sparkline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricPoint } from "@/types/system";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  points: MetricPoint[];
};

export function MetricCard({ title, value, subtitle, points }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle ?? `${points.length} points`}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        <div className="mt-4 h-12 text-slate-500">
          <Sparkline points={points} />
        </div>
      </CardContent>
    </Card>
  );
}
