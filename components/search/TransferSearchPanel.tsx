import { ArrowRightLeft, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TransferExample = {
  fromCollege: string;
  fromCourse: string;
  sdsuEquivalent: string;
  confidence: string;
};

type Props = {
  college: string;
  setCollege: (v: string) => void;
  course: string;
  setCourse: (v: string) => void;
  matches: TransferExample[];
  addedCourseCodes: Set<string>;
  resolveCourseCode: (row: TransferExample) => string | null;
  onAdd: (row: TransferExample) => void;
};

export function TransferSearchPanel({
  college,
  setCollege,
  course,
  setCourse,
  matches,
  addedCourseCodes,
  resolveCourseCode,
  onAdd,
}: Props) {
  return (
    <Card className="rounded-3xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ArrowRightLeft className="h-5 w-5" />
          Transfer lookup examples
        </CardTitle>
        <CardDescription>
          Replace these later with real transfer-source data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={college} onChange={(e) => setCollege(e.target.value)} placeholder="College name" className="h-11 rounded-2xl" />
          <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Course code" className="h-11 rounded-2xl" />
        </div>

        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No transfer example match.
            </div>
          ) : (
            matches.map((row, idx) => {
              const resolvedCode = resolveCourseCode(row);
              const alreadyAdded = resolvedCode ? addedCourseCodes.has(resolvedCode) : false;

              return (
                <div
                  key={`${row.fromCollege}-${row.fromCourse}-${idx}`}
                  className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {row.fromCollege} · {row.fromCourse}
                    </div>
                    <div className="text-sm text-slate-600">
                      Maps to {row.sdsuEquivalent}
                    </div>
                  </div>

                  <Button
                    onClick={() => onAdd(row)}
                    disabled={alreadyAdded}
                    variant={alreadyAdded ? "secondary" : "default"}
                    className="rounded-2xl"
                  >
                    {alreadyAdded ? "Added" : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
