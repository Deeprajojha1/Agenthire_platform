import { cloneElement, isValidElement } from "react";
import { cn } from "../../lib/utils.js";

export function Button({ className, variant = "primary", asChild = false, children, ...props }) {
  const styles = {
    primary: "bg-teal-700 text-white shadow-sm hover:bg-teal-800",
    outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
    danger: "bg-red-600 text-white shadow-sm hover:bg-red-700"
  }[variant] || "bg-teal-700 text-white shadow-sm hover:bg-teal-800";
  const mergedClassName = cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-60", styles, className);
  if (asChild && isValidElement(children)) {
    return cloneElement(children, { suppressHydrationWarning: true, className: cn(mergedClassName, children.props.className), ...props });
  }
  return <button suppressHydrationWarning className={mergedClassName} {...props}>{children}</button>;
}
