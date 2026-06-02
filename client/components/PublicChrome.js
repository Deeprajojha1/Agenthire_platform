"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/Button.js";

export function PublicHeader({ ctaHref = "/signup", ctaLabel = "Create Account" }) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white"><Sparkles size={18} /></span>
          <span className="text-base font-semibold text-slate-950">AgentHire</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-2">
          <Button className="px-3 sm:px-4" variant="ghost" asChild><Link href="/login">Log In</Link></Button>
          <Button className="px-3 sm:px-4" asChild><Link href={ctaHref}>{ctaLabel}</Link></Button>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-8">
        <p>AgentHire helps recruiters run traceable, approval-ready hiring workflows.</p>
        <p>Spec-driven AI recruitment console.</p>
      </div>
    </footer>
  );
}
