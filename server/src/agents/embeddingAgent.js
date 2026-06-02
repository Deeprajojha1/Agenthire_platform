import { upsertResumeEmbedding } from "../rag/qdrantClient.js";

export async function embeddingAgent(input) {
  const stored = await upsertResumeEmbedding({
    id: input.candidate._id.toString(),
    type: "resume",
    candidate_id: input.candidate._id.toString(),
    text: input.parsedResume.raw_text || "",
    metadata: { skills: input.parsedResume.skills }
  });
  return { success: true, data: stored };
}
