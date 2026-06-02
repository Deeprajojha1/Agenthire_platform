import { loadSpec } from "../utils/specLoader.js";
import { scoreCandidate } from "../utils/scoring.js";
import { searchRag } from "../rag/qdrantClient.js";

export async function matchingAgent(input) {
  const ragPolicy = loadSpec("evaluation/rag-retrieval.json");
  const matchingSpec = loadSpec("prompts/matching-agent.json");
  const ragContext = await searchRag((input.parsedResume.skills || []).join(" "), ragPolicy);
  const score = scoreCandidate(input.parsedResume, input.hiringSpec, matchingSpec);
  const shortlistRule = matchingSpec.recommendations.find((item) => item.minimum_score_field);
  const recommendation = shortlistRule && score.match_score >= input.hiringSpec[shortlistRule.minimum_score_field]
    ? shortlistRule.name
    : matchingSpec.recommendations.find((item) => item.fallback)?.name;
  return {
    success: true,
    data: {
      ...score,
      recommendation,
      rag_context_count: ragContext.length,
      rag_context: ragContext.map((item) => ({ id: item.id, type: item.type, score: item.score }))
    }
  };
}
