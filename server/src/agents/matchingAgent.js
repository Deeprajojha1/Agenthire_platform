import { loadSpec } from "../utils/specLoader.js";
import { scoreCandidate } from "../utils/scoring.js";
import { searchRag } from "../rag/qdrantClient.js";

export async function matchingAgent(input) {
  const ragPolicy = loadSpec("system/rag-policy.json");
  const ragContext = await searchRag((input.parsedResume.skills || []).join(" "), ragPolicy);
  const match_score = scoreCandidate(input.parsedResume, input.hiringSpec);
  const missing_skills = (input.hiringSpec.required_skills || []).filter(
    (skill) => !(input.parsedResume.skills || []).map((item) => item.toLowerCase()).includes(skill.toLowerCase())
  );
  return {
    success: true,
    data: {
      match_score,
      missing_skills,
      recommendation: match_score >= input.hiringSpec.minimum_score ? "Shortlist" : "Review",
      rag_context_count: ragContext.length
    }
  };
}
