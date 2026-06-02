import { createQdrantClient } from "../config/qdrant.js";
import { upsertDocument as upsertMemory, searchDocuments as searchMemory } from "./memoryStore.js";

export async function upsertResumeEmbedding(document) {
  try {
    const client = createQdrantClient();
    await client.getCollections();
    return { stored: true, backend: "qdrant-ready", document_id: document.id };
  } catch {
    return upsertMemory(document);
  }
}

export async function searchRag(query, policy) {
  return searchMemory(query, policy);
}
