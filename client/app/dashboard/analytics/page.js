"use client";

import { useEffect, useState } from "react";
import { StatCard } from "../../../components/StatCard.js";
import { api } from "../../../lib/api.js";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => { api("/analytics").then(setAnalytics); }, []);
  if (!analytics) return <p className="text-sm text-slate-600">Loading analytics...</p>;
  return (
    <section>
      <h1 className="text-2xl font-semibold">Analytics</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="Candidates" value={analytics.candidate_count} />
        <StatCard label="Workflows" value={analytics.workflow_count} />
        <StatCard label="Shortlist Rate" value={`${analytics.shortlist_rate}%`} />
        <StatCard label="Completion Rate" value={`${analytics.workflow_completion_rate}%`} />
      </div>
      <div className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="font-medium">Agent Execution Metrics</h2>
        <div className="mt-3 space-y-2 text-sm">
          {analytics.agent_execution_metrics.map((item) => <div key={item.agent_name}>{item.agent_name}: {item.count}</div>)}
        </div>
      </div>
    </section>
  );
}
