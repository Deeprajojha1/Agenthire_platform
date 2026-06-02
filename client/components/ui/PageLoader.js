"use client";

import ClipLoader from "react-spinners/ClipLoader";
import { cn } from "../../lib/utils.js";

export function PageLoader({ label = "Loading...", className }) {
  return (
    <div className={cn("flex min-h-56 flex-col items-center justify-center gap-3 text-sm text-slate-600", className)}>
      <ClipLoader color="#0f766e" size={34} speedMultiplier={0.9} />
      <span>{label}</span>
    </div>
  );
}

export function InlineLoader({ label = "Working..." }) {
  return (
    <span className="inline-flex items-center gap-2">
      <ClipLoader color="currentColor" size={14} speedMultiplier={0.9} />
      {label}
    </span>
  );
}
