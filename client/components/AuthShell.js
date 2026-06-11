"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Workflow } from "lucide-react";
import { PublicFooter, PublicHeader } from "./PublicChrome.js";

const points = [
  [Workflow, "Automated workflows", "Resume parsing to email in one traceable chain"],
  [ShieldCheck, "Full control", "Human approval at every critical step"],
  [CheckCircle2, "Track everything", "Real-time analytics and execution logs"]
];

export default function AuthShell({ title, subtitle, children, footerText, footerHref, footerLabel }) {
  const isSignupPage = footerHref === "/login";

  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <PublicHeader
        ctaHref={isSignupPage ? "#auth-form" : "/signup"}
        ctaLabel="Register"
        signInHref={isSignupPage ? footerHref : "#auth-form"}
      />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-teal-500 opacity-10 mix-blend-multiply blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500 opacity-10 mix-blend-multiply blur-3xl" />
      </div>

      <section className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-8 px-4 py-8 sm:py-10 md:min-h-[calc(100vh-128px)] md:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] md:px-8">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-medium text-teal-300 backdrop-blur-sm sm:mb-6 sm:text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Spec-driven AI recruitment</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent sm:text-4xl md:mb-6 md:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg md:mb-10">
            {subtitle}
          </p>

          <div className="grid items-stretch gap-3 sm:grid-cols-3 md:gap-4">
            {points.map(([Icon, label, desc]) => (
              <div key={label} className="group relative h-full">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-teal-500/10 to-blue-500/10 opacity-0 blur transition-opacity group-hover:opacity-100" />
                <div className="relative flex h-full min-h-36 flex-col rounded-lg border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/30 p-3 backdrop-blur-sm transition-colors hover:border-teal-500/30 sm:p-4">
                  <Icon className="mb-3 text-teal-400" size={20} />
                  <p className="mb-1 text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="auth-form" className="relative w-full min-w-0 scroll-mt-24">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-teal-500/10 to-blue-500/10 blur-xl" />
          <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-5 backdrop-blur-sm sm:p-6 md:p-8">
            {children}
            <p className="mt-6 border-t border-slate-700/30 pt-6 text-center text-sm text-slate-400">
              {footerText}{" "}
              <Link href={footerHref} className="inline-flex items-center gap-1 font-semibold text-teal-400 transition-colors hover:text-teal-300">
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
