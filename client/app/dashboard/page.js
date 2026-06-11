"use client";

import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, GitBranch, RefreshCcw, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "../../components/StatCard.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { PageLoader } from "../../components/ui/PageLoader.js";
import { api } from "../../lib/api.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load(showToast = false) {
    setRefreshing(true);
    try {
      const [analytics, jobs, workflows] = await Promise.all([api("/analytics"), api("/jobs"), api("/workflow")]);
      setData({ analytics, jobs, workflows });
      if (showToast) toast.success("Dashboard refreshed");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (!data) return <PageLoader label="Loading dashboard..." />;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredWorkflows = data.workflows.workflows.filter((workflow) => {
    if (!normalizedQuery) return true;
    return [
      workflow.candidate_id?.name,
      workflow.job_id?.title,
      workflow.current_state,
      workflow.status,
      workflow.retry_count?.toString()
    ].filter(Boolean).some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  return (
    <section>
      <div className="rounded-xl border border-teal-100 bg-gradient-to-r from-white/95 via-teal-50/95 to-indigo-50/95 p-4 shadow-sm ring-1 ring-white/70 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal-700">Recruiter Console</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">Recruiter Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Track jobs, candidates, workflow health, and hiring progress.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button className="h-9 px-2 border-indigo-200 bg-white text-slate-900 shadow-sm hover:bg-indigo-50 hover:text-indigo-700 sm:px-4" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:mt-6 md:grid-cols-4 md:gap-4">
        <StatCard label="Jobs" value={data.jobs.length} tone="teal" icon={BriefcaseBusiness} />
        <StatCard label="Candidates" value={data.analytics.candidate_count} tone="indigo" icon={Users} />
        <StatCard label="Workflows" value={data.analytics.workflow_count} tone="amber" icon={GitBranch} />
        <StatCard label="Completion" value={`${data.analytics.workflow_completion_rate}%`} tone="rose" icon={CheckCircle2} />
      </div>
      <div className="mt-4 flex h-[min(32rem,calc(100vh-15rem))] min-h-[24rem] flex-col overflow-hidden rounded-xl border border-teal-100 bg-white/85 shadow-sm ring-1 ring-white/70 md:mt-6 md:h-[420px]">
        <div className="h-1.5 bg-gradient-to-r from-teal-400 via-indigo-400 to-amber-300" />
        <div className="shrink-0 border-b border-slate-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-teal-700"><GitBranch size={15} />Workflow Activity</p>
            <h2 className="mt-1 font-semibold text-slate-950">Recent Workflows</h2>
            <p className="mt-1 text-xs text-slate-500">{filteredWorkflows.length} of {data.workflows.workflows.length} workflows</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-500" size={17} />
            <Input
              className="border-slate-200 bg-slate-50/70 pl-9 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Search workflows..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow._id} className="grid gap-2 border-b border-slate-100 p-3 text-sm transition last:border-0 hover:bg-teal-50/50 sm:p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <p className="font-medium text-slate-950">{workflow.candidate_id?.name || "Candidate"}</p>
                <p className="mt-1 text-slate-600">{workflow.job_id?.title || "No job linked"} - {workflow.current_state} - retries {workflow.retry_count}</p>
              </div>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-center text-xs font-semibold capitalize text-indigo-700">{workflow.status}</span>
            </div>
          ))}
          {filteredWorkflows.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              {data.workflows.workflows.length === 0 ? "No workflows found yet." : "No workflows match your search."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
