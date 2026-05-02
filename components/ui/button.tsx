import * as React from "react";

export function Button({
  className = "",
  variant = "default",
  size,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
  size?: "icon";
}) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
  };
  const sizes = size === "icon" ? "h-8 w-8" : "h-10 px-4 py-2";
  return <button className={`${base} ${variants[variant]} ${sizes} ${className}`} {...props} />;
}
