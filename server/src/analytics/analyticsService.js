import Candidate from "../models/Candidate.js";
import Workflow from "../models/Workflow.js";
import WorkflowLog from "../models/WorkflowLog.js";

export async function getAnalytics() {
  const [candidateCount, workflowCount, completed, shortlisted, logs] = await Promise.all([
    Candidate.countDocuments(),
    Workflow.countDocuments(),
    Workflow.countDocuments({ status: "completed" }),
    Candidate.countDocuments({ status: "shortlist" }),
    WorkflowLog.aggregate([{ $group: { _id: "$agent_name", count: { $sum: 1 } } }])
  ]);
  return {
    candidate_count: candidateCount,
    workflow_count: workflowCount,
    shortlist_rate: candidateCount ? Math.round((shortlisted / candidateCount) * 100) : 0,
    workflow_completion_rate: workflowCount ? Math.round((completed / workflowCount) * 100) : 0,
    agent_execution_metrics: logs.map((item) => ({ agent_name: item._id, count: item.count }))
  };
}
