import { loadSpec } from "../utils/specLoader.js";
import { generateJsonWithFallback } from "../services/llmService.js";

export async function interviewAgent(input) {
  const promptSpec = loadSpec("prompts/interview-agent.json");
  const rounds = input.hiringSpec.interview_rounds;
  const fallback = {
    rounds,
    questions: [
      `Explain a ${promptSpec.question_style} project you shipped.`,
      "How would you structure reusable React components for a dashboard?",
      `Complete a ${promptSpec.coding_task_focus} exercise.`
    ],
    coding_task: `Build and explain a small ${input.hiringSpec.role} assessment focused on ${promptSpec.coding_task_focus}.`,
    rubric: promptSpec.rubric
  };
  const generated = await generateJsonWithFallback({
    system: "You are an interview material generation agent for a recruitment workflow.",
    user: JSON.stringify({ role: input.hiringSpec.role, rounds, promptSpec, match: input.match, parsedResume: input.parsedResume }),
    fallback
  });
  return {
    success: true,
    data: { ...generated.data, provider: generated.provider }
  };
}
