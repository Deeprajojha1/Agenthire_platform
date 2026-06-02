import { cn } from "../../lib/utils.js";

export function Textarea(props) {
  return <textarea className={cn("min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900", props.className)} {...props} />;
}
