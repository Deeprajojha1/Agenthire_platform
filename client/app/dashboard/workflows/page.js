"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import WorkflowGraph from "../../../components/WorkflowGraph.js";
import { Button } from "../../../components/ui/Button.js";
import { api } from "../../../lib/api.js";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [active, setActive] = useState(null);
  const [activeDetails, setActiveDetails] = useState(null);
  const [nodeStateSpec, setNodeStateSpec] = useState({});

  const selectWorkflow = useCallback(async (workflow) => {
    setActive(workflow);
    const details = await api(`/workflow/${workflow._id}`);
    setActiveDetails(details);
  }, []);

  const load = useCallback(async () => {
    const data = await api("/workflow");
    setWorkflows(data.workflows);
    setNodeStateSpec(data.node_state_spec);
    if (data.workflows[0]) {
      await selectWorkflow(data.workflows[0]);
    }
  }, [selectWorkflow]);

  async function approve(id, approved) {
    try {
      await api("/workflow/approve", { method: "POST", body: JSON.stringify({ workflow_id: id, approved }) });
      toast.success(approved ? "Checkpoint approved" : "Checkpoint rejected");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function retry(id) {
    try {
      await api("/workflow/retry", { method: "POST", body: JSON.stringify({ workflow_id: id }) });
      toast.success("Retry started");
      await load();
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => { load(); }, [load]);

  const failedNodes = active?.node_states?.filter((node) => node.status === "failed" || node.error) || [];
  const emailLogs = activeDetails?.logs?.filter((log) => log.agent_name === "email_agent") || [];

  return (
    <section>
      <h1 className="text-2xl font-semibold">Workflows</h1>
      <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <button key={workflow._id} onClick={() => selectWorkflow(workflow)} className="w-full rounded-md border border-slate-200 bg-white p-4 text-left text-sm">
              <div className="flex justify-between gap-2"><strong>{workflow.candidate_id?.name || "Candidate"}</strong><span>{workflow.status}</span></div>
              <p className="mt-2 text-slate-600">Active: {workflow.current_state} - Retries: {workflow.retry_count}</p>
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
                  <div key={node.name} className="flex justify-between gap-3 rounded bg-slate-50 p-2">
                    <span>{node.name}</span>
                    <span>{node.status} - attempts {node.attempts}</span>
                  </div>
                ))}
              </div>

              {failedNodes.length > 0 && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-medium">Failure details</p>
                  {failedNodes.map((node) => (
                    <div key={node.name} className="mt-2">
                      <p className="font-medium">{node.name}</p>
                      <p>{node.error?.message || "Failed without message"}</p>
                    </div>
                  ))}
                </div>
              )}

              {emailLogs.length > 0 && (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-medium">Email logs</p>
                  <div className="mt-2 space-y-2">
                    {emailLogs.slice(-5).map((log) => (
                      <div key={log._id} className="rounded bg-white p-2">
                        <p>{log.status}</p>
                        {log.error?.message && <p className="mt-1 text-red-700">{log.error.message}</p>}
                        {log.output?.id && <p className="mt-1 text-green-700">Resend id: {log.output.id}</p>}
                        {log.output?.redirected && <p className="mt-1 text-amber-700">Redirected to verified test inbox.</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
