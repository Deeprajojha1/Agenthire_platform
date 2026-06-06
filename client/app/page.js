"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, GitBranch, ShieldCheck, Sparkles } from "lucide-react";
import { getToken } from "../lib/api.js";
import { resolveSession } from "../lib/session.js";
import { Button } from "../components/ui/Button.js";
import { PublicHeader, PublicFooter } from "../components/PublicChrome.js";

const features = [
  [GitBranch, "Automated agent workflows", "Resume parsing, matching, shortlisting, approval, interview material, and email output run in one traceable chain."],
  [ShieldCheck, "Recruiter-controlled approvals", "Human checkpoints keep AI decisions reviewable before the workflow continues."],
  [BarChart3, "Operational analytics", "Track candidates, workflow completion, shortlist rate, and agent execution health."]
];

export default function Home() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      setHasToken(Boolean(getToken()));
      const session = await resolveSession();
      if (mounted && session) router.replace(session.redirectTo);
    }

    checkSession();
    return () => {
      mounted = false;
    };
  }, [router]);
  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f4f7f7]">
      <PublicHeader ctaHref={hasToken ? "/dashboard" : "/signup"} ctaLabel={hasToken ? "Open Dashboard" : "Create Account"} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-14 lg:py-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
              <Sparkles size={15} /> Spec-driven AI recruitment
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl">Run candidate screening with AI agents and recruiter approval.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
              AgentHire helps recruiters publish jobs, collect PDF resumes, process applications through a LangGraph workflow, pause for approval, and review every hiring decision with logs and analytics.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild><Link href={hasToken ? "/dashboard" : "/signup"}>{hasToken ? "Open Dashboard" : "Start Recruiting"}<ArrowRight size={16} /></Link></Button>
              <Button variant="outline" asChild><Link href="/login">Log In</Link></Button>
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">Workflow Snapshot</p>
              <div className="mt-4 space-y-3">
                {["Resume parser", "Matching agent", "Human approval", "Email agent"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between gap-3 rounded-md bg-white p-3 text-sm shadow-sm">
                    <span className="flex min-w-0 items-center gap-2"><CheckCircle2 size={16} className="shrink-0 text-teal-700" /><span className="truncate">{index + 1}. {item}</span></span>
                    <span className="shrink-0 text-xs text-slate-500">tracked</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 md:grid-cols-3 md:px-8 md:pb-12">
          {features.map(([Icon, title, text]) => (
            <div key={title} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="text-teal-700" size={22} />
              <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          ))}
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
