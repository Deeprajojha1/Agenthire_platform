"use client";

import Link from "next/link";
import { Workflow, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { PublicHeader, PublicFooter } from "./PublicChrome.js";

const points = [
  [Workflow, "Automated workflows", "Resume parsing to email in one traceable chain"],
  [ShieldCheck, "Full control", "Human approval at every critical step"],
  [CheckCircle2, "Track everything", "Real-time analytics and execution logs"]
];

export default function AuthShell({ title, subtitle, children, footerText, footerHref, footerLabel }) {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <PublicHeader ctaHref={footerHref} ctaLabel={footerLabel} />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      <section className="relative flex-1 mx-auto grid min-h-[calc(100vh-128px)] max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_480px] md:px-8 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-sm font-medium text-teal-300 mb-6 backdrop-blur-sm">
            <span className="flex h-4 w-4 items-center justify-center">✓</span>
            Spec-driven AI recruitment
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-6">
            {title}
          </h1>
          <p className="text-lg text-slate-300 max-w-xl leading-relaxed mb-10">
            {subtitle}
          </p>
          
          <div className="grid gap-4 sm:grid-cols-3">
            {points.map(([Icon, label, desc]) => (
              <div key={label} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative rounded-lg border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/30 p-4 backdrop-blur-sm hover:border-teal-500/30 transition-colors">
                  <Icon className="text-teal-400 mb-3" size={20} />
                  <p className="text-sm font-semibold text-white mb-1">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
          <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm">
            {children}
            <p className="mt-6 pt-6 text-center text-sm text-slate-400 border-t border-slate-700/30">
              {footerText} <Link href={footerHref} className="font-semibold text-teal-400 hover:text-teal-300 transition-colors inline-flex items-center gap-1">
                {footerLabel}
                <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
