"use client";

import Link from "next/link";
import { CheckCircle2, GitBranch, ShieldCheck } from "lucide-react";
import { PublicHeader, PublicFooter } from "./PublicChrome.js";

const points = [
  [GitBranch, "Workflow-first screening"],
  [ShieldCheck, "Protected recruiter dashboard"],
  [CheckCircle2, "Human approval checkpoints"]
];

export default function AuthShell({ title, subtitle, children, footerText, footerHref, footerLabel }) {
  return (
    <main className="min-h-screen bg-[#f4f7f7]">
      <PublicHeader ctaHref={footerHref} ctaLabel={footerLabel} />
      <section className="mx-auto grid min-h-[calc(100vh-129px)] max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_440px] md:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">AgentHire Recruiter Console</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{subtitle}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {points.map(([Icon, label]) => (
              <div key={label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <Icon className="text-teal-700" size={20} />
                <p className="mt-3 text-sm font-medium text-slate-800">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          {children}
          <p className="mt-5 text-center text-sm text-slate-600">
            {footerText} <Link href={footerHref} className="font-medium text-teal-700 hover:text-teal-800">{footerLabel}</Link>
          </p>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
