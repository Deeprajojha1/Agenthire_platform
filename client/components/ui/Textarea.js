import { cn } from "../../lib/utils.js";

export function Textarea({ className, ...props }) {
  return <textarea {...props} className={cn("min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100", className)} />;
}
