"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, GitBranch, ShieldCheck, Sparkles, Zap, Users, Clock, TrendingUp, Workflow } from "lucide-react";
import { getToken } from "../lib/api.js";
import { resolveSession } from "../lib/session.js";
import { Button } from "../components/ui/Button.js";
import { PublicHeader, PublicFooter } from "../components/PublicChrome.js";

const features = [
  [Workflow, "Automated workflows", "Resume parsing, matching, shortlisting, approval, interview material, and email output run in one traceable chain."],
  [ShieldCheck, "Recruiter control", "Human checkpoints keep AI decisions reviewable before the workflow continues."],
  [BarChart3, "Full visibility", "Track candidates, workflow completion, shortlist rate, and agent execution health."]
];

const stats = [
  { label: "Faster screening", value: "10x" },
  { label: "Higher accuracy", value: "99%" },
  { label: "Human approved", value: "100%" }
];

const workflowSteps = [
  { number: 1, title: "Resume Parser", description: "Extract candidate information automatically" },
  { number: 2, title: "Matching Agent", description: "Match against job requirements" },
  { number: 3, title: "Human Approval", description: "Review and approve decisions" },
  { number: 4, title: "Email Agent", description: "Send automated communications" }
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
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <PublicHeader ctaHref={hasToken ? "/dashboard" : "/signup"} ctaLabel={hasToken ? "Open Dashboard" : "Get Started"} />
      
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 py-16 md:px-8 md:py-24">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-300 backdrop-blur-sm hover:bg-teal-500/20 transition-colors">
                <Sparkles size={16} className="animate-spin" style={{ animationDuration: "3s" }} />
                Spec-driven AI recruitment platform
              </div>
            </div>

            <div className="grid gap-12 items-center md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-6">
                  Hire smarter with AI agents
                </h1>
                
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-2xl">
                  Run candidate screening with AI-powered agents and human approval. AgentHire automates resume parsing, matching, and shortlisting while keeping recruiters in complete control.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-12">
                  <Button asChild className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-8 py-3 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all">
                    <Link href={hasToken ? "/dashboard" : "/signup"} className="flex items-center gap-2">
                      {hasToken ? "Open Dashboard" : "Start for Free"}
                      <ArrowRight size={18} />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="border border-slate-500 text-slate-200 hover:bg-slate-700/50 px-8 py-3 text-base font-semibold rounded-lg transition-all">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-700/50">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-3xl md:text-4xl font-bold text-teal-400 mb-2">{stat.value}</div>
                      <div className="text-sm text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side - Visual */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
                <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/50 p-8 backdrop-blur-sm">
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-4">Live Workflow</p>
                    <h3 className="text-xl font-bold text-white">Intelligent Hiring Pipeline</h3>
                  </div>

                  <div className="space-y-4">
                    {workflowSteps.map((step, idx) => (
                      <div key={step.number} className="relative">
                        {idx < workflowSteps.length - 1 && (
                          <div className="absolute left-5 top-12 w-0.5 h-8 bg-gradient-to-b from-teal-500/50 to-transparent"></div>
                        )}
                        <div className="flex gap-4 items-start">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {step.number}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-semibold text-white text-sm">{step.title}</p>
                            <p className="text-xs text-slate-400 mt-1">{step.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-700/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Execution Status</span>
                      <span className="flex items-center gap-2 text-teal-400">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-16 md:px-8 md:py-24 border-t border-slate-700/50">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for modern recruiting</h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">Everything you need to scale hiring without losing control</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {features.map(([Icon, title, text], idx) => (
                <div key={title} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-slate-900/30 p-8 backdrop-blur-sm hover:border-teal-500/30 transition-colors duration-300">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:from-teal-500/30 group-hover:to-blue-500/30 transition-all">
                      <Icon className="text-teal-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-white mb-8">Why teams choose AgentHire</h2>
                
                {[
                  { icon: Zap, title: "Lightning Fast", desc: "Process hundreds of resumes in minutes, not days" },
                  { icon: Users, title: "Human Verified", desc: "Every decision passes through recruiter approval" },
                  { icon: TrendingUp, title: "Data Driven", desc: "Make decisions backed by real analytics and insights" },
                  { icon: Clock, title: "Time Saving", desc: "Cut screening time by 90% and focus on culture fit" }
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4 mb-6">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                        <Icon className="text-teal-400" size={20} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{title}</h4>
                      <p className="text-slate-400 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-2xl blur-2xl"></div>
                <div className="relative rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/50 p-12 backdrop-blur-sm">
                  <div className="mb-8">
                    <div className="h-3 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mb-4" style={{ width: "85%" }}></div>
                    <div className="text-sm text-slate-400">Candidate Quality</div>
                  </div>
                  <div className="mb-8">
                    <div className="h-3 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mb-4" style={{ width: "95%" }}></div>
                    <div className="text-sm text-slate-400">Process Speed</div>
                  </div>
                  <div className="mb-8">
                    <div className="h-3 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full mb-4" style={{ width: "100%" }}></div>
                    <div className="text-sm text-slate-400">Human Control</div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-700/30">
                    <p className="text-xs text-slate-400 mb-3">Average improvement after 30 days</p>
                    <div className="text-2xl font-bold text-teal-400">+78% time saved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <PublicFooter />
    </main>
  );
}
