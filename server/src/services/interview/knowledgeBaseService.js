import fs from "fs";
import pdf from "pdf-parse";
import AdmZip from "adm-zip";
import { loadSpec } from "../../utils/specLoader.js";
import { searchRag, upsertRagDocument } from "../../rag/qdrantClient.js";

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function extractDocxText(filePath) {
  const zip = new AdmZip(filePath);
  const document = zip.getEntry("word/document.xml");
  if (!document) return "";
  return decodeXml(document.getData().toString("utf8"))
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractText(file) {
  if (!file?.path) return "";
  if (file.mimetype === "text/plain") {
    return fs.readFileSync(file.path, "utf8");
  }
  if (file.mimetype === "application/pdf") {
    const parsed = await pdf(fs.readFileSync(file.path));
    return parsed.text || "";
  }
  if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractDocxText(file.path);
  }
  return "";
}

export async function indexInterviewDocuments({ files = [], workflow, recruiterId }) {
  if (!files.length) return [];
  const policy = loadSpec("interview/retrieval-rules.json");
  const uploadedAt = new Date().toISOString();

  const documents = [];
  for (const file of files) {
    const documentId = `${workflow._id}-${Date.now()}-${documents.length + 1}`;
    const text = await extractText(file);
    const document = {
      id: documentId,
      documentId,
      type: "interview_document",
      workflowId: workflow._id.toString(),
      jobId: workflow.job_id.toString(),
      recruiterId: recruiterId?.toString() || "",
      fileName: file.originalname,
      filePath: file.path,
      uploadedAt,
      embeddingStatus: text ? "pending" : "metadata_only",
      text,
      policy
    };

    let result = { stored: false, chunks: 0 };
    if (text) {
      result = await upsertRagDocument(document);
    }

    documents.push({
      documentId,
      jobId: document.jobId,
      recruiterId: document.recruiterId,
      fileName: document.fileName,
      filePath: document.filePath,
      uploadedAt,
      embeddingStatus: result.stored ? "embedded" : document.embeddingStatus,
      chunks: result.chunks || 0,
      backend: result.backend || null
    });
  }

  return documents;
}

export async function retrieveInterviewContext({ workflow, candidate, job, difficulty }) {
  const documents = workflow.context?.interviewDocuments || [];
  if (!documents.length) return { chunks: [], metadata: { documents: 0, top_k: 0, minimum_similarity: 0 } };

  const policy = loadSpec("interview/retrieval-rules.json");
  const skills = [
    ...(candidate.parsed_resume_json?.skills || []),
    ...(job?.required_skills || []),
    ...(job?.preferred_skills || [])
  ].filter(Boolean);
  const query = [
    job?.title,
    job?.description,
    skills.join(", "),
    `difficulty: ${difficulty}`
  ].filter(Boolean).join("\n");

  const results = await searchRag(query, {
    ...policy,
    filter: {
      must: [
        { key: "type", match: { value: "interview_document" } },
        { key: "workflowId", match: { value: workflow._id.toString() } }
      ]
    }
  });

  return {
    chunks: results,
    metadata: {
      documents: documents.length,
      top_k: policy.top_k,
      minimum_similarity: policy.minimum_similarity,
      returned: results.length
    }
  };
}
