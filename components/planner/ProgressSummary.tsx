import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TARGETS, BUCKET_META } from "@/lib/buckets";
import type { BucketKey } from "@/lib/types";

type Props = {
  totals: Record<BucketKey, number>;
  totalUnits: number;
};

export function ProgressSummary({ totals, totalUnits }: Props) {
  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border-0 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Progress</CardTitle>
          <CardDescription>Requirement bars plus your running total.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(Object.keys(TARGETS) as (keyof typeof TARGETS)[]).map((bucket) => {
            const current = totals[bucket] || 0;
            const target = TARGETS[bucket];
            const value = Math.min(100, Math.round((current / target) * 100));

            return (
              <div key={bucket} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium text-slate-800">{BUCKET_META[bucket].label}</div>
                  <div className="text-slate-500">
                    {current} / {target}
                  </div>
                </div>
                <Progress value={value} className="h-3 rounded-full" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="text-center text-4xl font-semibold tracking-tight text-slate-900">
        Total Units {totalUnits}
      </div>
    </div>
  );
}