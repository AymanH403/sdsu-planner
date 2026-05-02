import * as React from "react";

export function Progress({ value = 0, className = "" }: { value?: number; className?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <div className="h-full bg-slate-800 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
