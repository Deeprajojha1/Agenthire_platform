import dotenv from "dotenv";
import mongoose from "mongoose";
import Interview from "../src/models/Interview.js";
import Workflow from "../src/models/Workflow.js";
import { env } from "../src/config/env.js";
import { runHiringWorkflow } from "../src/workflows/hiringWorkflow.js";

dotenv.config();

function interviewMaterialFromSession(interview) {
  const questions = (interview.questions || [])
    .filter((question) => question.type !== "coding")
    .map((question) => question.prompt);
  const codingQuestion = (interview.questions || []).find((question) => question.type === "coding");
  return {
    rounds: 1,
    questions,
    coding_task: codingQuestion?.coding_task || codingQuestion?.prompt || "",
    rubric: ["technical clarity", "frontend fundamentals", "communication", "maintainability"],
    provider: "interview-session"
  };
}

function markInterviewAgentComplete(workflow, interview) {
  const node = workflow.node_states.find((item) => item.name === "interview_agent");
  const output = workflow.context?.interview || interviewMaterialFromSession(interview);
  if (node && node.status !== "success") {
    node.status = "success";
    node.output = output;
    node.error = undefined;
    node.completed_at = new Date();
  }
  workflow.context = {
    ...workflow.context,
    interview: output
  };
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  const interviews = await Interview.find({ status: "completed" });
  let resumed = 0;

  for (const interview of interviews) {
    const workflow = await Workflow.findById(interview.workflow_id);
    if (!workflow) continue;
    const aiNode = workflow.node_states.find((node) => node.name === "ai_interview_engine");
    const recruiterNode = workflow.node_states.find((node) => node.name === "recruiter_review");
    const interviewAgentNode = workflow.node_states.find((node) => node.name === "interview_agent");
    if (aiNode?.status === "success" && recruiterNode?.status === "waiting_approval" && interviewAgentNode?.status === "success") continue;

    markInterviewAgentComplete(workflow, interview);
    workflow.current_state = "ai_interview_engine";
    workflow.context = {
      ...workflow.context,
      interviewSession: {
        _id: interview._id,
        status: interview.status,
        overall_score: interview.overall_score,
        recommendation: interview.recommendation,
        completed_at: interview.completed_at
      },
      interviewEvaluation: interview.evaluation
    };
    await workflow.save();
    await runHiringWorkflow(workflow._id, { approved: true, interviewCompleted: true });
    resumed += 1;
  }

  console.log(`Resumed ${resumed} completed interview workflow${resumed === 1 ? "" : "s"}.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
