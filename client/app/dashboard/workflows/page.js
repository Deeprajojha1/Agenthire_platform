"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import WorkflowGraph from "../../../components/WorkflowGraph.js";
import { Button } from "../../../components/ui/Button.js";
import { api } from "../../../lib/api.js";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [active, setActive] = useState(null);
  const [nodeStateSpec, setNodeStateSpec] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const selectWorkflow = useCallback((workflow) => {
    setActive(workflow);
    const failedNode = workflow.node_states?.find((node) => node.status === "failed" || node.error);
    if (failedNode) {
      toast.error(`${failedNode.name} failed`, {
        id: `workflow-failure-${workflow._id}`,
        description: failedNode.error?.message || "Workflow failed without a message"
      });
    }
  }, []);

  const load = useCallback(async () => {
    const data = await api("/workflow");
    setWorkflows(data.workflows);
    setNodeStateSpec(data.node_state_spec);
    if (data.workflows[0]) {
      selectWorkflow(data.workflows[0]);
    } else {
      setActive(null);
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

  async function confirmDelete(event) {
    event.preventDefault();
    if (!confirmAction) return;
    setDeleting(true);
    try {
      if (confirmAction.type === "clear") {
        const result = await api("/workflow", { method: "DELETE" });
        toast.success(`Cleared ${result.deleted} workflow${result.deleted === 1 ? "" : "s"}`);
      } else {
        await api(`/workflow/${confirmAction.workflow._id}`, { method: "DELETE" });
        toast.success("Workflow deleted");
      }
      setConfirmAction(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => { load(); }, [load]);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Workflows</h1>
        <Button
          variant="outline"
          onClick={() => setConfirmAction({ type: "clear" })}
          disabled={workflows.length === 0}
        >
          <Trash2 size={16} /> Clear all
        </Button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div key={workflow._id} className={`rounded-md border bg-white p-4 text-sm ${active?._id === workflow._id ? "border-teal-300 shadow-sm" : "border-slate-200"}`}>
              <button onClick={() => selectWorkflow(workflow)} className="w-full text-left">
                <div className="flex justify-between gap-2"><strong>{workflow.candidate_id?.name || "Candidate"}</strong><span>{workflow.status}</span></div>
                <p className="mt-2 text-slate-600">Active: {workflow.current_state} - Retries: {workflow.retry_count}</p>
              </button>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmAction({ type: "delete", workflow })}
                >
                  <Trash2 size={15} /> Delete
                </Button>
              </div>
            </div>
          ))}
          {workflows.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              No workflows found.
            </div>
          )}
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

            </div>
          )}
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <form onSubmit={confirmDelete} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">
              {confirmAction.type === "clear" ? "Clear all workflows?" : "Delete this workflow?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {confirmAction.type === "clear"
                ? "This will remove every workflow execution and its logs from the dashboard."
                : `This will remove the workflow for ${confirmAction.workflow.candidate_id?.name || "this candidate"} and its logs.`}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmAction(null)} disabled={deleting}>Cancel</Button>
              <Button type="submit" variant="danger" disabled={deleting}>
                <Trash2 size={16} /> {deleting ? "Deleting..." : confirmAction.type === "clear" ? "Clear all" : "Delete"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
