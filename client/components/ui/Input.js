import { cn } from "../../lib/utils.js";

export function Input(props) {
  return <input className={cn("h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100", props.className)} {...props} />;
}
