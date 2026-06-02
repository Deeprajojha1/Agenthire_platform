import { upsertResumeEmbedding } from "../rag/qdrantClient.js";

export async function embeddingAgent(input) {
  const stored = await upsertResumeEmbedding({
    id: input.candidate._id.toString(),
    type: "resume",
    candidate_id: input.candidate._id.toString(),
    job_id: input.job._id.toString(),
    text: input.parsedResume.raw_text || "",
    metadata: { skills: input.parsedResume.skills, model: input.ragSpec.embedding_model },
    policy: input.ragSpec
  });
  return { success: true, data: stored };
}
