"use client";

import Link from "next/link";
import { RefreshCcw, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "../../components/StatCard.js";
import { Button } from "../../components/ui/Button.js";
import { PageLoader } from "../../components/ui/PageLoader.js";
import { api } from "../../lib/api.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
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
        <div className="border-b border-slate-200 p-4 font-medium">Recent Workflows</div>
        {data.workflows.workflows.slice(0, 6).map((workflow) => (
          <div key={workflow._id} className="flex items-center justify-between border-b border-slate-100 p-4 text-sm last:border-0">
            <span>{workflow.candidate_id?.name || "Candidate"} - {workflow.current_state}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{workflow.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
