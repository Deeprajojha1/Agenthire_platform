"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button.js";

export function PublicHeader({ ctaHref = "/signup", ctaLabel = "Get Started", signInHref = "/login", signInLabel = "Sign In", showCta = true }) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-800 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white group-hover:from-teal-600 group-hover:to-teal-700 transition-all shadow-lg">
            <Sparkles size={18} />
          </span>
          <span className="text-base font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">AgentHire</span>
        </Link>
        <nav className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <Button className="h-9 border border-slate-600/70 bg-slate-800/70 px-3 text-xs text-slate-100 shadow-sm hover:border-teal-500/50 hover:bg-slate-700 hover:text-white sm:h-10 sm:px-4 sm:text-sm" asChild>
            <Link href={signInHref}>{signInLabel}</Link>
          </Button>
          {showCta && (
            <Button className="h-9 bg-gradient-to-r from-teal-500 to-teal-600 px-3 text-xs font-semibold text-white shadow-lg transition-all hover:from-teal-600 hover:to-teal-700 hover:shadow-xl sm:h-10 sm:px-4 sm:text-sm" asChild>
              <Link href={ctaHref} className="flex items-center gap-2">
                {ctaLabel}
                <ArrowRight size={16} className="hidden sm:block" />
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="shrink-0 border-t border-slate-700/50 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10 md:px-8 md:py-16">
        <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-7 sm:mb-10 sm:grid-cols-2 sm:gap-8 md:mb-12 md:grid-cols-4 md:gap-12">
          <div className="col-span-2 sm:col-span-1 md:col-span-1">
            <Link href="/" className="mb-3 flex items-center gap-2.5 sm:mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
                <Sparkles size={18} />
              </span>
              <span className="text-base font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">AgentHire</span>
            </Link>
            <p className="max-w-xs text-xs leading-relaxed text-slate-400 sm:text-sm">AI-powered hiring workflows with human control.</p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white sm:mb-4 sm:text-sm">Product</h4>
            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
              <li><Link href="/" className="text-slate-400 hover:text-teal-400 transition-colors">Home</Link></li>
              <li><Link href="/signup" className="text-slate-400 hover:text-teal-400 transition-colors">Get Started</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-teal-400 transition-colors">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white sm:mb-4 sm:text-sm">About</h4>
            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Features</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white sm:mb-4 sm:text-sm">Legal</h4>
            <ul className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Terms</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700/30 pt-5 sm:pt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
            <p className="text-xs text-slate-500 sm:text-sm">&copy; 2024 AgentHire. All rights reserved.</p>
            <div className="flex flex-wrap gap-3 text-xs sm:gap-6 sm:text-sm">
              <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors">Terms of Service</a>
              <a href="#" className="text-slate-500 hover:text-teal-400 transition-colors">Cookie Settings</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
