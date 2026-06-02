"use client";

import { useEffect, useState } from "react";
import WorkflowGraph from "../../../components/WorkflowGraph.js";
import { Button } from "../../../components/ui/Button.js";
import { api } from "../../../lib/api.js";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [active, setActive] = useState(null);
  const [nodeStateSpec, setNodeStateSpec] = useState({});
  async function load() {
    const data = await api("/workflow");
    setWorkflows(data.workflows);
    setNodeStateSpec(data.node_state_spec);
    if (data.workflows[0]) setActive(data.workflows[0]);
  }
  async function approve(id, approved) {
    await api("/workflow/approve", { method: "POST", body: JSON.stringify({ workflow_id: id, approved }) });
    await load();
  }
  async function retry(id) {
    await api("/workflow/retry", { method: "POST", body: JSON.stringify({ workflow_id: id }) });
    await load();
  }
  useEffect(() => { load(); }, []);
  return (
    <section>
      <h1 className="text-2xl font-semibold">Workflows</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <button key={workflow._id} onClick={() => setActive(workflow)} className="w-full rounded-md border border-slate-200 bg-white p-4 text-left text-sm">
              <div className="flex justify-between gap-2"><strong>{workflow.candidate_id?.name || "Candidate"}</strong><span>{workflow.status}</span></div>
              <p className="mt-2 text-slate-600">Active: {workflow.current_state} · Retries: {workflow.retry_count}</p>
            </button>
          ))}
        </div>
        <div className="space-y-4">
          {active && <WorkflowGraph workflow={active} nodeStateSpec={nodeStateSpec} />}
          {active && (
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap gap-2">
                {active.status === "waiting_approval" && <Button onClick={() => approve(active._id, true)}>Approve checkpoint</Button>}
                {active.status === "waiting_approval" && <Button variant="outline" onClick={() => approve(active._id, false)}>Reject checkpoint</Button>}
                {active.status === "failed" && <Button variant="outline" onClick={() => retry(active._id)}>Retry failed node</Button>}
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                {active.node_states?.map((node) => (
                  <div key={node.name} className="flex justify-between rounded bg-slate-50 p-2">
                    <span>{node.name}</span><span>{node.status} · attempts {node.attempts}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
