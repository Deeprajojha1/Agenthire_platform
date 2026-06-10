"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import WorkflowGraph from "../../../components/WorkflowGraph.js";
import { Button } from "../../../components/ui/Button.js";
import { Input } from "../../../components/ui/Input.js";
import { api } from "../../../lib/api.js";

function toDateTimeLocalValue(date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const difficultyDefaults = {
  starter: 5,
  standard: 10,
  advanced: 15,
  expert: 20
};

const difficultyFixedCounts = {
  starter: 2,
  standard: 4,
  advanced: 6,
  expert: 7
};

const languages = ["javascript", "typescript", "python", "java", "c++"];

function formatDateTime(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleString();
}

function prettyState(value) {
  return String(value || "pending").replaceAll("_", " ");
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [active, setActive] = useState(null);
  const [nodeStateSpec, setNodeStateSpec] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null);
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewEndTime, setInterviewEndTime] = useState("");
  const [interviewDifficulty, setInterviewDifficulty] = useState("standard");
  const [interviewQuestionCount, setInterviewQuestionCount] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("javascript");
  const [interviewDocuments, setInterviewDocuments] = useState([]);
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

  async function approve(id, approved, scheduledAt = null, endsAt = null, difficulty = "standard") {
    try {
      const hasDocuments = interviewDocuments.length > 0;
      const body = hasDocuments ? new FormData() : null;
      if (hasDocuments) {
        body.set("workflow_id", id);
        body.set("approved", String(approved));
        if (scheduledAt) {
          body.set("interview_scheduled_at", scheduledAt);
          body.set("interview_ends_at", endsAt);
          body.set("interview_difficulty", difficulty);
          body.set("preferred_language", preferredLanguage);
          if (interviewQuestionCount) body.set("interview_question_count", interviewQuestionCount);
        }
        interviewDocuments.forEach((file) => body.append("interview_documents", file));
      }
      await api("/workflow/approve", {
        method: "POST",
        body: hasDocuments ? body : JSON.stringify({
          workflow_id: id,
          approved,
          ...(scheduledAt ? {
            interview_scheduled_at: scheduledAt,
            interview_ends_at: endsAt,
            interview_difficulty: difficulty,
            preferred_language: preferredLanguage,
            ...(interviewQuestionCount ? { interview_question_count: Number(interviewQuestionCount) } : {})
          } : {})
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
    const nextEnd = new Date(nextHour);
    nextEnd.setHours(nextEnd.getHours() + 1);
    setInterviewTime(toDateTimeLocalValue(nextHour));
    setInterviewEndTime(toDateTimeLocalValue(workflow.interview_ends_at || workflow.context?.interviewEndsAt ? new Date(workflow.interview_ends_at || workflow.context?.interviewEndsAt) : nextEnd));
    setInterviewDifficulty(workflow.interview_difficulty || workflow.context?.interviewDifficulty || "standard");
    setInterviewQuestionCount(workflow.context?.interviewTechnicalQuestionCount || workflow.context?.interviewQuestionCount || "");
    setPreferredLanguage(workflow.context?.preferredLanguage || "javascript");
    setInterviewDocuments([]);
    setApprovalAction(workflow);
  }

  async function submitApproval(event) {
    event.preventDefault();
    if (!approvalAction || !interviewTime || !interviewEndTime) return;
    const start = new Date(interviewTime);
    const end = new Date(interviewEndTime);
    if (end.getTime() <= start.getTime()) {
      toast.error("Interview end time must be after start time");
      return;
    }
    setApproving(true);
    try {
      const approved = await approve(approvalAction._id, true, start.toISOString(), end.toISOString(), interviewDifficulty);
      if (approved) {
        setApprovalAction(null);
        setInterviewTime("");
        setInterviewEndTime("");
        setInterviewQuestionCount("");
        setInterviewDocuments([]);
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

  const activeNodes = active?.node_states || [];
  const completedNodes = activeNodes.filter((node) => node.status === "success").length;
  const progressPercent = activeNodes.length ? Math.round((completedNodes / activeNodes.length) * 100) : 0;
  const activeNode = activeNodes.find((node) => node.name === active?.current_state) || activeNodes.find((node) => node.status === "running" || node.status === "waiting_approval");
  const scheduledAt = active?.interview_scheduled_at || active?.context?.interviewScheduledAt;
  const endsAt = active?.interview_ends_at || active?.context?.interviewEndsAt;
  const technicalQuestions = active?.context?.interviewTechnicalQuestionCount || active?.context?.interviewQuestionCount;
  const candidateStatus = active?.candidate_id?.status;
  const humanApprovalNode = activeNodes.find((node) => node.name === "human_approval");
  const canVerifyShortlist = active?.current_state === "human_approval" && (
    active?.status === "waiting_approval" ||
    humanApprovalNode?.status === "waiting_approval" ||
    ["shortlist", "submitted", "hold"].includes(candidateStatus)
  );

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
          {active && (
            <div className="rounded-md border border-slate-200 bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Selected Workflow</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{active.candidate_id?.name || "Candidate"}</h2>
                  <p className="mt-1 text-sm text-slate-600">{active.job_id?.title || "No job linked"}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-sm font-medium capitalize text-slate-800">{prettyState(active.status)}</span>
                  <span className="rounded-md bg-teal-50 px-3 py-1 text-sm font-medium capitalize text-teal-800">{prettyState(active.approval_status)}</span>
                  <span className="rounded-md bg-emerald-50 px-3 py-1 text-sm font-medium capitalize text-emerald-800">{prettyState(candidateStatus)}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Current Step</p>
                  <p className="mt-1 font-semibold capitalize text-slate-950">{prettyState(active.current_state)}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Progress</p>
                  <p className="mt-1 font-semibold text-slate-950">{completedNodes}/{activeNodes.length || 0} steps</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Difficulty</p>
                  <p className="mt-1 font-semibold capitalize text-slate-950">{active.interview_difficulty || active.context?.interviewDifficulty || "Standard"}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-medium uppercase text-slate-500">Retries</p>
                  <p className="mt-1 font-semibold text-slate-950">{active.retry_count || 0}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-700 transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {activeNode ? `${prettyState(activeNode.name)} is ${prettyState(activeNode.status)}.` : "Workflow is ready."}
                </p>
              </div>

              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-sm md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Interview Start</p>
                  <p className="mt-1 text-slate-800">{formatDateTime(scheduledAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Interview End</p>
                  <p className="mt-1 text-slate-800">{formatDateTime(endsAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Technical Questions</p>
                  <p className="mt-1 text-slate-800">{technicalQuestions || "Policy default"}</p>
                </div>
              </div>

              <div className="mt-4">
                <WorkflowGraph workflow={active} nodeStateSpec={nodeStateSpec} />
              </div>

              {active.current_state === "recruiter_review" && active.status === "waiting_approval" && (
                <div className="mt-4 rounded-md border border-teal-200 bg-teal-50 p-4">
                  <h2 className="text-sm font-semibold text-teal-950">Recruiter Review Required</h2>
                  <p className="mt-1 text-sm text-teal-800">Verify the interview result, then choose the next action to complete the workflow.</p>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {canVerifyShortlist && <Button onClick={() => openApprovalModal(active)}>Verify shortlist</Button>}
                {canVerifyShortlist && <Button variant="outline" onClick={() => approve(active._id, false)}>Reject application</Button>}
                {active.status === "failed" && <Button variant="outline" onClick={() => retry(active._id)}>Retry failed node</Button>}
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
                  {active.interview.questions?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium uppercase text-slate-500">Generated Questions And Sources</p>
                      {active.interview.questions.map((question, index) => (
                        <div key={question.id} className="rounded-md bg-white p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <p className="text-sm text-slate-800"><span className="font-semibold text-slate-950">Q{index + 1}.</span> {question.prompt}</p>
                            {active.interview.evaluation?.questionScores?.find((item) => item.question_id === question.id)?.score != null && (
                              <span className="shrink-0 rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
                                Score {active.interview.evaluation.questionScores.find((item) => item.question_id === question.id).score}/100
                              </span>
                            )}
                          </div>
                          {active.interview.evaluation?.questionScores?.find((item) => item.question_id === question.id)?.feedback && (
                            <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600">
                              {active.interview.evaluation.questionScores.find((item) => item.question_id === question.id).feedback}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-2 py-1 font-medium capitalize text-slate-700">{question.source?.replace("_", " ") || "general knowledge"}</span>
                            {question.documentName && <span className="rounded-full bg-teal-50 px-2 py-1 font-medium text-teal-800">{question.documentName}</span>}
                            {typeof question.similarity === "number" && <span className="rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">Similarity {question.similarity.toFixed(2)}</span>}
                          </div>
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
          <form onSubmit={submitApproval} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-md border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">Schedule interview</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Set the interview time for {approvalAction.candidate_id?.name || "this candidate"}. The candidate email will include this timing.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label htmlFor="interview-time" className="block text-sm font-medium text-slate-700">
                Interview start time
                <Input
                  id="interview-time"
                  type="datetime-local"
                  value={interviewTime}
                  min={minimumInterviewTime}
                  onChange={(event) => setInterviewTime(event.target.value)}
                  required
                  className="mt-2"
                />
              </label>
              <label htmlFor="interview-end-time" className="block text-sm font-medium text-slate-700">
                Interview end time
                <Input
                  id="interview-end-time"
                  type="datetime-local"
                  value={interviewEndTime}
                  min={interviewTime || minimumInterviewTime}
                  onChange={(event) => setInterviewEndTime(event.target.value)}
                  required
                  className="mt-2"
                />
              </label>
              <label htmlFor="interview-difficulty" className="block text-sm font-medium text-slate-700">
                Difficulty
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
                  <option value="expert">Expert</option>
                </select>
              </label>
              <label htmlFor="question-count" className="block text-sm font-medium text-slate-700">
                Technical questions
                <Input
                  id="question-count"
                  type="number"
                  min="1"
                  max="50"
                  value={interviewQuestionCount}
                  placeholder={`Default ${difficultyDefaults[interviewDifficulty]}`}
                  onChange={(event) => setInterviewQuestionCount(event.target.value)}
                  className="mt-2"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  Total will be {(Number(interviewQuestionCount) || difficultyDefaults[interviewDifficulty]) + difficultyFixedCounts[interviewDifficulty]} with policy-based intro, behavioral, and coding questions.
                </span>
              </label>
              <label htmlFor="preferred-language" className="block text-sm font-medium text-slate-700">
                Preferred language
                <select
                  id="preferred-language"
                  value={preferredLanguage}
                  onChange={(event) => setPreferredLanguage(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                >
                  {languages.map((language) => <option key={language} value={language}>{language}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-5 rounded-md border border-dashed border-slate-300 bg-slate-50 p-4">
              <label htmlFor="interview-documents" className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-teal-700 shadow-sm"><UploadCloud size={18} /></span>
                <span>
                  Interview documents
                  <span className="block text-xs font-normal text-slate-500">Optional PDF, DOCX, DOC, or TXT files for RAG-based questions.</span>
                </span>
              </label>
              <input
                id="interview-documents"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                multiple
                className="sr-only"
                onChange={(event) => setInterviewDocuments(Array.from(event.target.files || []))}
              />
              {interviewDocuments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {interviewDocuments.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                      <FileText size={15} className="text-teal-700" /> {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
