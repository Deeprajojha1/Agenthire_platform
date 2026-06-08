"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "./ui/Button.js";

export function PublicHeader({ ctaHref = "/signup", ctaLabel = "Get Started" }) {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-slate-700/50 bg-gradient-to-b from-slate-900 to-slate-800 backdrop-blur-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white group-hover:from-teal-600 group-hover:to-teal-700 transition-all shadow-lg">
            <Sparkles size={18} />
          </span>
          <span className="text-base font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">AgentHire</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-2">
          <Button className="px-4 text-slate-200 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600 transition-all" variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button className="px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl" asChild>
            <Link href={ctaHref} className="flex items-center gap-2">
              {ctaLabel}
              <ArrowRight size={16} />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="shrink-0 border-t border-slate-700/50 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
                <Sparkles size={18} />
              </span>
              <span className="text-base font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">AgentHire</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">AI-powered hiring workflows with human control.</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/" className="text-slate-400 hover:text-teal-400 transition-colors">Home</Link></li>
              <li><Link href="/signup" className="text-slate-400 hover:text-teal-400 transition-colors">Get Started</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-teal-400 transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">About</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Features</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Pricing</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Terms</a></li>
              <li><a href="#" className="text-slate-400 hover:text-teal-400 transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-slate-700/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-slate-500">&copy; 2024 AgentHire. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
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
