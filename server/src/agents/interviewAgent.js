import { loadSpec } from "../utils/specLoader.js";

export async function interviewAgent(input) {
  const promptSpec = loadSpec("prompts/interview.json");
  const rounds = input.hiringSpec.interview_rounds;
  return {
    success: true,
    data: {
      rounds,
      questions: [
        `Explain a ${promptSpec.question_style} project you shipped.`,
        "How would you structure reusable React components for a dashboard?",
        `Complete a ${promptSpec.coding_task_focus} exercise.`
      ],
      rubric: ["technical clarity", "frontend fundamentals", "communication"]
    }
  };
}
