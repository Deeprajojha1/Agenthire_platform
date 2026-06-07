"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import WorkflowGraph from "../../../components/WorkflowGraph.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { api } from "../../../lib/api.js";

function toDateTimeLocalValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [active, setActive] = useState(null);
  const [nodeStateSpec, setNodeStateSpec] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null);
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewDifficulty, setInterviewDifficulty] = useState("standard");
  const [minimumInterviewTime, setMinimumInterviewTime] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [approving, setApproving] = useState(false);
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

  async function approve(id, approved, scheduledAt = null, difficulty = "standard") {
    try {
      await api("/workflow/approve", {
        method: "POST",
        body: JSON.stringify({
          workflow_id: id,
          approved,
          ...(scheduledAt ? { interview_scheduled_at: scheduledAt, interview_difficulty: difficulty } : {})
        })
      });
      toast.success(approved ? "Checkpoint approved" : "Checkpoint rejected");
      await load();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  }

  function openApprovalModal(workflow) {
    const nextHour = new Date();
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(nextHour.getHours() + 1);
    setInterviewTime(toDateTimeLocalValue(nextHour));
    setInterviewDifficulty(workflow.interview_difficulty || workflow.context?.interviewDifficulty || "standard");
    setApprovalAction(workflow);
  }

  async function submitApproval(event) {
    event.preventDefault();
    if (!approvalAction || !interviewTime) return;
    setApproving(true);
    try {
      const approved = await approve(approvalAction._id, true, new Date(interviewTime).toISOString(), interviewDifficulty);
      if (approved) {
        setApprovalAction(null);
        setInterviewTime("");
      }
    } finally {
      setApproving(false);
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

  async function submitRecruiterReview(decision) {
    if (!active) return;
    setReviewing(true);
    try {
      await api("/workflow/recruiter-review", {
        method: "POST",
        body: JSON.stringify({
          workflow_id: active._id,
          decision,
          note: reviewNote
        })
      });
      toast.success(`Recruiter decision saved: ${decision}`);
      setReviewNote("");
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReviewing(false);
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

  useEffect(() => {
    setMinimumInterviewTime(toDateTimeLocalValue(new Date()));
    const timer = setInterval(() => setMinimumInterviewTime(toDateTimeLocalValue(new Date())), 30000);
    return () => clearInterval(timer);
  }, []);

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
              {active.current_state === "recruiter_review" && active.status === "waiting_approval" && (
                <div className="mb-4 rounded-md border border-teal-200 bg-teal-50 p-4">
                  <h2 className="text-sm font-semibold text-teal-950">Recruiter Review Required</h2>
                  <p className="mt-1 text-sm text-teal-800">Verify the interview result, then choose the next action to complete the workflow.</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {active.status === "waiting_approval" && active.current_state === "human_approval" && <Button onClick={() => openApprovalModal(active)}>Approve checkpoint</Button>}
                {active.status === "waiting_approval" && active.current_state === "human_approval" && <Button variant="outline" onClick={() => approve(active._id, false)}>Reject checkpoint</Button>}
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

              {active.interview && (
                <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm">
                  <h3 className="font-semibold text-slate-950">Interview Result</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Status</p>
                      <p className="mt-1 font-semibold capitalize text-slate-950">{active.interview.status}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Overall Score</p>
                      <p className="mt-1 font-semibold text-slate-950">{active.interview.overall_score ?? "Pending"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Recommendation</p>
                      <p className="mt-1 font-semibold text-slate-950">{active.interview.recommendation || "Pending"}</p>
                    </div>
                  </div>
                  {active.interview.answers?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium uppercase text-slate-500">Transcript And Code</p>
                      {active.interview.answers.map((answer) => (
                        <div key={answer.question_id} className="rounded-md bg-white p-3">
                          <p className="font-semibold text-slate-950">{answer.question_id}</p>
                          <p className="mt-1 text-slate-600">{answer.clean_transcript || answer.manual_text || "No transcript captured."}</p>
                          {answer.code && <pre className="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">{answer.code}</pre>}
                        </div>
                      ))}
                    </div>
                  )}
                  {active.current_state === "recruiter_review" && active.status === "waiting_approval" && (
                    <div className="mt-4 rounded-md border border-teal-200 bg-white p-4">
                      <h4 className="font-semibold text-slate-950">Verify Result And Continue</h4>
                      <p className="mt-1 text-sm text-slate-600">Auto evaluation policy checks score, recommendation, transcript, and code submission before final recruiter action.</p>
                      <textarea
                        value={reviewNote}
                        onChange={(event) => setReviewNote(event.target.value)}
                        placeholder="Optional recruiter note"
                        className="mt-3 min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" onClick={() => submitRecruiterReview("advance")} disabled={reviewing}>Advance Candidate</Button>
                        <Button type="button" variant="outline" onClick={() => submitRecruiterReview("hold")} disabled={reviewing}>Hold Candidate</Button>
                        <Button type="button" variant="danger" onClick={() => submitRecruiterReview("reject")} disabled={reviewing}>Reject Candidate</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

      {approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <form onSubmit={submitApproval} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Schedule interview</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Set the interview time for {approvalAction.candidate_id?.name || "this candidate"}. The candidate email will include this timing.
            </p>
            <label htmlFor="interview-time" className="mt-4 block text-sm font-medium text-slate-700">Interview time</label>
            <Input
              id="interview-time"
              type="datetime-local"
              value={interviewTime}
              min={minimumInterviewTime}
              onChange={(event) => setInterviewTime(event.target.value)}
              required
              className="mt-2"
            />
            <label htmlFor="interview-difficulty" className="mt-4 block text-sm font-medium text-slate-700">Interview difficulty</label>
            <select
              id="interview-difficulty"
              value={interviewDifficulty}
              onChange={(event) => setInterviewDifficulty(event.target.value)}
              required
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            >
              <option value="starter">Starter</option>
              <option value="standard">Standard</option>
              <option value="advanced">Advanced</option>
            </select>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setApprovalAction(null)} disabled={approving}>Cancel</Button>
              <Button type="submit" disabled={approving}>
                {approving ? "Approving..." : "Approve and send invite"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
