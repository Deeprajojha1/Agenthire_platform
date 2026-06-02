import { loadSpec } from "../utils/specLoader.js";
import { decideShortlist } from "../utils/scoring.js";

export async function shortlistingAgent(input) {
  const rules = loadSpec("evaluation/shortlisting-rules.json");
  const decision = decideShortlist(input.match.match_score, rules);
  return { success: true, data: { decision, score: input.match.match_score } };
}
