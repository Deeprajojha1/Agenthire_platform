import crypto from "crypto";
import { createQdrantClient } from "../config/qdrant.js";
import { embedText, getEmbeddingRuntime } from "./embeddingProvider.js";
import { upsertDocument as upsertMemory, searchDocuments as searchMemory } from "./memoryStore.js";

const VECTOR_SIZE = 384;

function chunkText(text, size) {
  const chunks = [];
  const source = String(text || "");
  for (let i = 0; i < source.length; i += size) {
    chunks.push(source.slice(i, i + size));
  }
  return chunks.length ? chunks : [""];
}

function pointId(documentId, chunkIndex) {
  const hex = crypto.createHash("sha1").update(`${documentId}:${chunkIndex}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function ensureCollection(client, collectionName) {
  const collections = await client.getCollections();
  const exists = collections.collections?.some((collection) => collection.name === collectionName);
  if (!exists) {
    await client.createCollection(collectionName, {
      vectors: { size: VECTOR_SIZE, distance: "Cosine" }
    });
  }
}

export async function upsertResumeEmbedding(document) {
  const policy = document.policy;
  const collectionName = policy.collection_name;
  const chunks = chunkText(document.text, policy.chunk_sizes[document.type] || policy.chunk_sizes.resume);
  try {
    const client = createQdrantClient();
    await ensureCollection(client, collectionName);
    const vectors = await Promise.all(chunks.map((chunk) => embedText(chunk, policy.embedding_model)));
    const runtime = getEmbeddingRuntime(policy.embedding_model);
    await client.upsert(collectionName, {
      wait: true,
      points: chunks.map((chunk, index) => ({
        id: pointId(document.id, index),
        vector: vectors[index],
        payload: {
          ...document,
          text: chunk,
          chunk_index: index,
          embedding_model: policy.embedding_model,
          embedding_runtime_model: runtime.runtime_model
        }
      }))
    });
    return { stored: true, backend: "qdrant", document_id: document.id, chunks: chunks.length, embedding_model: policy.embedding_model, embedding_runtime_model: runtime.runtime_model };
  } catch {
    await Promise.all(chunks.map((chunk, index) => upsertMemory({ ...document, id: `${document.id}-${index}`, text: chunk, chunk_index: index })));
    return { stored: true, backend: "memory", document_id: document.id, chunks: chunks.length, embedding_model: policy.embedding_model, fallback: true };
  }
}

export async function searchRag(query, policy) {
  try {
    const client = createQdrantClient();
    await ensureCollection(client, policy.collection_name);
    const results = await client.search(policy.collection_name, {
      vector: await embedText(query, policy.embedding_model),
      limit: policy.top_k,
      score_threshold: policy.minimum_similarity,
      with_payload: true
    });
    return results.map((result) => ({ ...result.payload, score: result.score }));
  } catch {
    const memoryResults = await searchMemory(query, policy);
    if (memoryResults.length) return memoryResults;
    return [];
  }
}
