import { cloneElement, isValidElement } from "react";
import { cn } from "../../lib/utils.js";

export function Button({ className, variant = "primary", asChild = false, children, ...props }) {
  const styles = variant === "outline"
    ? "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
    : "bg-slate-950 text-white hover:bg-slate-800";
  const mergedClassName = cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition disabled:opacity-50", styles, className);
  if (asChild && isValidElement(children)) {
    return cloneElement(children, { className: cn(mergedClassName, children.props.className), ...props });
  }
  return <button className={mergedClassName} {...props}>{children}</button>;
}
