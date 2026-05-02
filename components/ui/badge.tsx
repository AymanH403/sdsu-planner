import * as React from "react";

export function Badge({
  className = "",
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "outline" }) {
  const styles = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-200 text-slate-900",
    outline: "border border-slate-300 text-slate-700 bg-white",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${styles[variant]} ${className}`} {...props} />;
}
