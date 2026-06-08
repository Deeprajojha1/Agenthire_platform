import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import Candidate from "../models/Candidate.js";
import Job from "../models/Job.js";
import Workflow from "../models/Workflow.js";
import WorkflowLog from "../models/WorkflowLog.js";
import { embeddingAgent } from "../agents/embeddingAgent.js";
import { emailAgent } from "../agents/emailAgent.js";
import { humanApprovalAgent } from "../agents/humanApprovalAgent.js";
import { interviewAgent } from "../agents/interviewAgent.js";
import { matchingAgent } from "../agents/matchingAgent.js";
import { resumeParserAgent } from "../agents/resumeParserAgent.js";
import { shortlistingAgent } from "../agents/shortlistingAgent.js";
import { NODE_STATUS, WORKFLOW_STATUS } from "../constants/workflowStatus.js";
import { loadHiringSpec, loadSpec, loadWorkflowSpec, mergeJobWithHiringSpec } from "../utils/specLoader.js";
import { logWorkflowFailure } from "../utils/workflowFailureLogger.js";
import { publishCandidateEvent } from "../services/candidate/eventService.js";

const agents = {
  resume_parser: resumeParserAgent,
  embedding_agent: embeddingAgent,
  matching_agent: matchingAgent,
  shortlisting_agent: shortlistingAgent,
  human_approval: humanApprovalAgent,
  interview_scheduling: async (context) => ({
    success: true,
    data: {
      scheduled_at: context.interviewScheduledAt || null,
      ends_at: context.interviewEndsAt || null,
      status: context.interviewScheduledAt ? "scheduled" : "pending_schedule"
    }
  }),
  interview_agent: interviewAgent,
  email_agent: emailAgent,
  ai_interview_engine: async (context) => ({
    success: true,
    data: {
      status: context.interviewSession?.status || "waiting_for_candidate",
      interview_id: context.interviewSession?._id || null
    }
  }),
  evaluation_agent: async (context) => ({
    success: true,
    data: context.interviewEvaluation || {
      status: "pending_interview_completion",
      recommendation: "Pending"
    }
  }),
  recruiter_review: async (context) => ({
    success: true,
    data: {
      status: "waiting_for_recruiter_decision"
    }
  }),
  final_email_agent: emailAgent
};

const WorkflowState = Annotation.Root({
  context: Annotation()
});

const successEvents = {
  resume_parser: "resume_parsed",
  embedding_agent: "embedding_completed",
  matching_agent: "matching_completed",
  shortlisting_agent: "shortlisting_completed",
  interview_scheduling: "interview_scheduled",
  email_agent: "email_sent",
  interview_agent: "interview_generated",
  ai_interview_engine: "interview_started",
  evaluation_agent: "evaluation_ready",
  recruiter_review: "waiting_for_recruiter_review",
  final_email_agent: "email_sent"
};

function ensureNodeStates(workflow, order) {
  const existing = new Map((workflow.node_states || []).map((node) => [node.name, node]));
  return order.map((name) => existing.get(name) || ({ name, status: NODE_STATUS.pending, attempts: 0 }));
}

function applyOutput(context, agentName, output) {
  if (agentName === "resume_parser") context.parsedResume = output.data;
  if (agentName === "embedding_agent") context.embedding = output.data;
  if (agentName === "matching_agent") context.match = output.data;
  if (agentName === "shortlisting_agent") context.shortlist = output.data;
  if (agentName === "interview_scheduling") context.interviewSchedule = output.data;
  if (agentName === "interview_agent") context.interview = output.data;
  if (agentName === "ai_interview_engine") context.interviewEngine = output.data;
  if (agentName === "evaluation_agent") context.interviewEvaluation = output.data;
  if (agentName === "recruiter_review") context.recruiterReview = output.data;
  if (agentName === "email_agent") context.email = output.data;
  if (agentName === "final_email_agent") context.finalEmail = output.data;
}

function persistedContext(context) {
  return {
    parsedResume: context.parsedResume,
    embedding: context.embedding,
    match: context.match,
    shortlist: context.shortlist,
    interviewSchedule: context.interviewSchedule,
    interview: context.interview,
    interviewSession: context.interviewSession,
    interviewEngine: context.interviewEngine,
    interviewEvaluation: context.interviewEvaluation,
    recruiterReview: context.recruiterReview,
    interviewScheduledAt: context.interviewScheduledAt,
    interviewEndsAt: context.interviewEndsAt,
    interviewDifficulty: context.interviewDifficulty,
    interviewQuestionCount: context.interviewQuestionCount,
    preferredLanguage: context.preferredLanguage,
    interviewDocuments: context.interviewDocuments,
    email: context.email,
    finalEmail: context.finalEmail
  };
}

async function executePersistedAgent({ workflow, candidate, agentName, context, retryPolicy, options }) {
  const node = workflow.node_states.find((item) => item.name === agentName);
  if (node.status === NODE_STATUS.success) return context;
  if (node.attempts >= retryPolicy.max_retries + 1 && node.status !== NODE_STATUS.pending) {
    node.status = NODE_STATUS.failed;
    workflow.status = WORKFLOW_STATUS.failed;
    await workflow.save();
    throw new Error(`${agentName} exceeded retry policy`);
  }

  workflow.current_state = agentName;
  node.status = NODE_STATUS.running;
  node.started_at = new Date();
  await workflow.save();
  await WorkflowLog.create({ workflow_id: workflow._id, agent_name: agentName, input: { state: workflow.current_state }, status: "running" });

  if (agentName === "human_approval" && !options.approved) {
    const output = await agents[agentName](context);
    node.status = NODE_STATUS.waitingApproval;
    node.output = output.data;
    node.completed_at = new Date();
    workflow.status = WORKFLOW_STATUS.waitingApproval;
    workflow.approval_status = "pending";
    await WorkflowLog.create({ workflow_id: workflow._id, agent_name: agentName, output: output.data, status: "waiting_approval" });
    await workflow.save();
    await publishCandidateEvent({ candidateId: candidate._id, workflowId: workflow._id, event: "waiting_for_recruiter_review" });
    return context;
  }

  if (agentName === "ai_interview_engine" && !options.interviewCompleted) {
    const output = await agents[agentName](context);
    applyOutput(context, agentName, output);
    node.status = NODE_STATUS.waitingApproval;
    node.output = output.data;
    node.completed_at = new Date();
    workflow.status = WORKFLOW_STATUS.waitingApproval;
    await WorkflowLog.create({ workflow_id: workflow._id, agent_name: agentName, output: output.data, status: "waiting_approval" });
    workflow.context = persistedContext(context);
    await workflow.save();
    return context;
  }

  if (agentName === "recruiter_review" && !options.recruiterReviewed) {
    const output = await agents[agentName](context);
    applyOutput(context, agentName, output);
    node.status = NODE_STATUS.waitingApproval;
    node.output = output.data;
    node.completed_at = new Date();
    workflow.status = WORKFLOW_STATUS.waitingApproval;
    await WorkflowLog.create({ workflow_id: workflow._id, agent_name: agentName, output: output.data, status: "waiting_approval" });
    workflow.context = persistedContext(context);
    await workflow.save();
    return context;
  }

  for (let attempt = node.attempts; attempt < retryPolicy.max_retries + 1; attempt += 1) {
    try {
      node.attempts += 1;
      const output = await agents[agentName](context);
      applyOutput(context, agentName, output);
      node.status = NODE_STATUS.success;
      node.output = output.data;
      node.error = undefined;
      node.completed_at = new Date();
      await WorkflowLog.create({ workflow_id: workflow._id, agent_name: agentName, output: output.data, status: "success" });

      if (agentName === "resume_parser") {
        candidate.parsed_resume_json = output.data;
        await candidate.save();
      }
      if (agentName === "matching_agent") {
        candidate.match_score = output.data.match_score;
        await candidate.save();
      }
      if (agentName === "shortlisting_agent") {
        candidate.status = output.data.decision;
        await candidate.save();
        if (["reject", "rejected"].includes(output.data.decision)) {
          await publishCandidateEvent({ candidateId: candidate._id, workflowId: workflow._id, event: "application_rejected", payload: { status: output.data.decision } });
        }
      }

      workflow.context = persistedContext(context);
      await workflow.save();
      if (successEvents[agentName]) {
        await publishCandidateEvent({ candidateId: candidate._id, workflowId: workflow._id, event: successEvents[agentName], payload: { node: agentName } });
      }
      return context;
    } catch (error) {
      workflow.retry_count += 1;
      node.error = { message: error.message, stack: error.stack, timestamp: new Date() };
      logWorkflowFailure({ agentName, state: workflow.current_state, error });
      await WorkflowLog.create({ workflow_id: workflow._id, agent_name: agentName, status: "failed", error: node.error });
      await workflow.save();

      if (node.attempts >= retryPolicy.max_retries + 1) {
        node.status = NODE_STATUS.failed;
        workflow.status = WORKFLOW_STATUS.failed;
        await workflow.save();
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, Math.min(retryPolicy.retry_delay_ms, 250)));
    }
  }

  return context;
}

function compileWorkflowGraph(order, executor) {
  const graph = new StateGraph(WorkflowState);
  for (const agentName of order) {
    graph.addNode(agentName, async (state) => ({ context: await executor(agentName, state.context) }));
  }
  graph.addEdge(START, order[0]);
  for (let index = 0; index < order.length - 1; index += 1) {
    graph.addEdge(order[index], order[index + 1]);
  }
  graph.addEdge(order[order.length - 1], END);
  return graph.compile();
}

export async function runHiringWorkflow(workflowId, options = {}) {
  const retryPolicy = loadSpec("system/retry-policy.json");
  const workflow = await Workflow.findById(workflowId);
  const candidate = await Candidate.findById(workflow.candidate_id);
  const job = await Job.findById(workflow.job_id);
  const baseHiringSpec = loadHiringSpec(job.hiring_spec_id);
  const hiringSpec = mergeJobWithHiringSpec(job, baseHiringSpec);
  const workflowSpec = loadWorkflowSpec(job.workflow_spec_id);
  const order = workflowSpec.workflow;
  workflow.node_states = ensureNodeStates(workflow, order);
  workflow.execution_order = order;
  workflow.status = WORKFLOW_STATUS.running;

  const context = {
    ...workflow.context,
    candidate,
    job,
    hiringSpec,
    parserSpec: loadSpec("prompts/resume-parser.json"),
    ragSpec: loadSpec("evaluation/rag-retrieval.json"),
    resumePath: candidate.resume_url
  };
  const startIndex = Math.max(0, order.indexOf(workflow.current_state));
  const humanApprovalIndex = order.indexOf("human_approval");
  const aiInterviewIndex = order.indexOf("ai_interview_engine");
  const recruiterReviewIndex = order.indexOf("recruiter_review");
  let endIndex = order.length - 1;
  if (!options.approved && humanApprovalIndex >= startIndex) {
    endIndex = humanApprovalIndex;
  } else if (!options.interviewCompleted && aiInterviewIndex >= startIndex) {
    endIndex = aiInterviewIndex;
  } else if (!options.recruiterReviewed && recruiterReviewIndex >= startIndex) {
    endIndex = recruiterReviewIndex;
  }
  const runnableOrder = order.slice(startIndex, endIndex + 1);

  if (!runnableOrder.length) {
    return workflow;
  }

  const graph = compileWorkflowGraph(runnableOrder, (agentName, currentContext) => executePersistedAgent({
    workflow,
    candidate,
    agentName,
    context: currentContext,
    retryPolicy,
    options
  }));

  try {
    const result = await graph.invoke({ context });
    Object.assign(context, result.context);
  } catch (error) {
    workflow.status = WORKFLOW_STATUS.failed;
    await workflow.save();
    return workflow;
  }

  if (workflow.status === WORKFLOW_STATUS.waitingApproval || workflow.status === WORKFLOW_STATUS.failed) {
    return workflow;
  }

  workflow.status = WORKFLOW_STATUS.completed;
  workflow.current_state = "completed";
  workflow.approval_status = workflow.approval_status === "pending" ? "not_required" : workflow.approval_status;
  workflow.context = persistedContext(context);
  await workflow.save();
  return workflow;
}
