import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Header() {
  return (
    <Card className="rounded-[32px] border-0 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
          SDSU course and transfer planner
        </CardTitle>
        <CardDescription className="text-base text-slate-600">
          Search courses, add them once, and drag course-code cards from Unassigned into the requirement bucket where you want them counted.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3 text-sm text-slate-600">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
          Search stays visible
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
          Drag and drop bucket assignment
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
          Hover a chip to see full course title
        </div>
      </CardContent>
    </Card>
  );
}