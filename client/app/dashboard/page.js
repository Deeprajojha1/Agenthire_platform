"use client";

import Link from "next/link";
import { RefreshCcw, Search, SquarePlus } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Track jobs, candidates, workflow health, and hiring progress.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => load(true)} disabled={refreshing}><RefreshCcw size={16} />Refresh</Button>
          <Button asChild><Link href="/dashboard/jobs/create"><SquarePlus size={16} />Create Job</Link></Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Jobs" value={data.jobs.length} />
        <StatCard label="Candidates" value={data.analytics.candidate_count} />
        <StatCard label="Workflows" value={data.analytics.workflow_count} />
        <StatCard label="Completion" value={`${data.analytics.workflow_completion_rate}%`} />
      </div>
      <div className="mt-6 rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <div>
            <h2 className="font-medium">Recent Workflows</h2>
            <p className="mt-1 text-xs text-slate-500">{filteredWorkflows.length} of {data.workflows.workflows.length} workflows</p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <Input
              className="pl-9"
              placeholder="Search workflows..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="max-h-[calc(100vh-22rem)] overflow-y-auto">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow._id} className="grid gap-2 border-b border-slate-100 p-4 text-sm last:border-0 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <p className="font-medium text-slate-950">{workflow.candidate_id?.name || "Candidate"}</p>
                <p className="mt-1 text-slate-600">{workflow.job_id?.title || "No job linked"} - {workflow.current_state} - retries {workflow.retry_count}</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-1 text-center text-slate-800">{workflow.status}</span>
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
