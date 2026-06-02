"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/Button.js";

export function PublicHeader({ ctaHref = "/signup", ctaLabel = "Create Account" }) {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white"><Sparkles size={18} /></span>
          <span className="text-base font-semibold text-slate-950">AgentHire</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild><Link href="/login">Log In</Link></Button>
          <Button asChild><Link href={ctaHref}>{ctaLabel}</Link></Button>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 md:flex-row md:items-center md:justify-between md:px-8">
        <p>AgentHire helps recruiters run traceable, approval-ready hiring workflows.</p>
        <p>Spec-driven AI recruitment console.</p>
      </div>
    </footer>
  );
}
