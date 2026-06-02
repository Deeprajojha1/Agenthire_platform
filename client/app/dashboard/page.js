"use client";

import Link from "next/link";
import { RefreshCcw, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "../../components/StatCard.js";
import { Button } from "../../components/ui/Button.js";
import { api } from "../../lib/api.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  async function load() {
    const [analytics, jobs, workflows] = await Promise.all([api("/analytics"), api("/jobs"), api("/workflow")]);
    setData({ analytics, jobs, workflows });
  }
  useEffect(() => { load(); }, []);
  if (!data) return <p className="text-sm text-slate-600">Loading dashboard...</p>;
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Recruiter Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCcw size={16} />Refresh</Button>
          <Button asChild><Link href="/dashboard/jobs/create"><SquarePlus size={16} />Create Job</Link></Button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Jobs" value={data.jobs.length} />
        <StatCard label="Candidates" value={data.analytics.candidate_count} />
        <StatCard label="Workflows" value={data.analytics.workflow_count} />
        <StatCard label="Completion" value={`${data.analytics.workflow_completion_rate}%`} />
      </div>
      <div className="mt-6 rounded-md border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4 font-medium">Recent Workflows</div>
        {data.workflows.workflows.slice(0, 6).map((workflow) => (
          <div key={workflow._id} className="flex items-center justify-between border-b border-slate-100 p-4 text-sm last:border-0">
            <span>{workflow.candidate_id?.name || "Candidate"} · {workflow.current_state}</span>
            <span className="rounded bg-slate-100 px-2 py-1">{workflow.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
