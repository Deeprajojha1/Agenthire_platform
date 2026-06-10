import Candidate from "../../models/Candidate.js";
import Interview from "../../models/Interview.js";
import Workflow from "../../models/Workflow.js";
import { runHiringWorkflow } from "../../workflows/hiringWorkflow.js";
import { generateJsonWithFallback } from "../llmService.js";
import { loadSpec } from "../../utils/specLoader.js";
import { retrieveInterviewContext } from "./knowledgeBaseService.js";
import { persistRecording, synthesizeQuestionAudio, transcribeRecording } from "./voiceService.js";

function candidateEmail(user) {
  return user.email.trim().toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactText(value) {
  return new RegExp(`^${escapeRegExp(value.trim())}$`, "i");
}

async function findOwnedCandidate(user, candidateId) {
  const candidate = await Candidate.findOne({
    _id: candidateId,
    $or: [
      { candidate_user_id: user._id },
      { email: exactText(candidateEmail(user)) }
    ]
  }).populate("job_id");
  if (!candidate) {
    const error = new Error("Application not found");
    error.statusCode = 404;
    throw error;
  }
  return candidate;
}

function normalizeDifficulty(value) {
  const rules = loadSpec("interview/difficulty-rules.json");
  return rules.levels[value] ? value : rules.default;
}

function resolveInterviewEndsAt(workflow, scheduledAt) {
  const value = workflow.interview_ends_at || workflow.context?.interviewEndsAt || null;
  if (value) return value;
  return scheduledAt ? new Date(new Date(scheduledAt).getTime() + 60 * 60 * 1000).toISOString() : null;
}

function assertInterviewOpen(interview) {
  if (interview.status === "completed") {
    const error = new Error("Interview is already completed. Only one attempt is allowed.");
    error.statusCode = 403;
    throw error;
  }
  if (interview.ends_at && new Date(interview.ends_at).getTime() <= Date.now()) {
    const error = new Error("Interview time has ended.");
    error.statusCode = 403;
    throw error;
  }
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function candidateSkills({ parsedResume, job }) {
  return uniqueValues([
    ...(parsedResume?.skills || []),
    ...(job?.required_skills || []),
    ...(job?.preferred_skills || [])
  ]);
}

function skillQuestion(skill, role, index) {
  const normalized = skill.toLowerCase();
  const frontend = ["react", "next.js", "javascript", "typescript", "css", "tailwind css", "html", "redux"];
  const backend = ["node.js", "express", "mongodb", "mongoose", "sql", "api", "rest", "jwt"];
  const database = ["mongodb", "sql", "postgres", "mysql", "database", "mongoose"];
  if (frontend.some((item) => normalized.includes(item))) {
    return [
      `In your ${skill} work, how would you design a reusable component structure for a production dashboard, and how would you manage state between nested components?`,
      `Explain how you would optimize rendering performance in a ${skill} application when a page has large lists, filters, and frequent state updates.`,
      `Describe how you would handle form validation, loading states, API errors, and reusable UI patterns in a ${skill}-based ${role} project.`
    ][index % 3];
  }
  if (backend.some((item) => normalized.includes(item))) {
    return [
      `How would you design a secure ${skill} API for candidate interviews, including authentication, validation, error handling, and rate limiting?`,
      `Explain how you would structure controllers, services, and database models in a ${skill} backend so the code remains maintainable as features grow.`,
      `Describe how you would debug a slow ${skill} endpoint that reads workflow, interview, transcript, and evaluation data together.`
    ][index % 3];
  }
  if (database.some((item) => normalized.includes(item))) {
    return [
      `How would you model candidates, workflows, interviews, answers, transcripts, and evaluations in ${skill}, and what indexes would you add?`,
      `Explain how you would prevent duplicate applications and keep interview workflow updates consistent in ${skill}.`,
      `Describe how you would query interview results efficiently for recruiter dashboards using ${skill}.`
    ][index % 3];
  }
  return [
    `Tell me about a real project where you used ${skill}. What problem did it solve, and what technical decisions did you make?`,
    `What are common failure cases or tradeoffs when using ${skill} in a ${role} project, and how would you handle them?`,
    `How would you test and maintain a feature built with ${skill} so it remains reliable in production?`
  ][index % 3];
}

function generatedTechnicalQuestions(material) {
  return (Array.isArray(material?.questions) ? material.questions : [])
    .filter((question) => {
      const value = String(question || "").toLowerCase();
      return value.includes("how") || value.includes("explain") || value.includes("design") || value.includes("optimize") || value.includes("debug") || value.includes("implement");
    });
}

function questionSource(source = "general_knowledge", extra = {}) {
  return { source, ...extra };
}

function documentQuestion(chunk, role, index) {
  const text = String(chunk.text || "").replace(/\s+/g, " ").trim().slice(0, 260);
  return {
    prompt: `Based on ${chunk.fileName || "the uploaded interview document"}, explain how you would apply this guidance in a ${role} project: "${text}"`,
    ...questionSource("interview_document", {
      documentName: chunk.fileName,
      chunkId: `${chunk.documentId || chunk.id || "chunk"}-${chunk.chunk_index ?? index}`,
      similarity: chunk.score,
      documentReference: {
        documentId: chunk.documentId,
        fileName: chunk.fileName
      },
      retrievedChunks: [chunk]
    })
  };
}

function codingTask(skill, role, language, index) {
  const normalized = skill.toLowerCase();
  const selectedLanguage = String(language || "").toLowerCase();
  if (selectedLanguage === "javascript") {
    return [
      `JavaScript output question: What is the output of console.log([] + [])? Explain why JavaScript produces that output, then write one more similar example using type coercion.`,
      `JavaScript output question: What is the output of console.log([] + {}) and console.log({} + []) in a normal script? Explain the difference and the coercion rules involved.`,
      `JavaScript problem solving: Write a function groupBySkill(candidates) that returns an object where each skill maps to candidate names. Handle empty arrays, missing skills, and duplicate skills.`,
      `JavaScript async question: What will be printed by this code and why?\n\nconsole.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");\n\nExplain the event loop order.`,
      `JavaScript coding task: Implement debounce(fn, delay). The function should delay execution until the user stops calling it, preserve this/context, and pass all arguments correctly.`
    ][index % 5];
  }
  if (["react", "next.js", "javascript", "typescript"].some((item) => normalized.includes(item))) {
    return [
      `Build a small ${language} solution for a searchable candidate list. Include filtering by skill, empty state handling, and clean component/state structure.`,
      `Fix and improve a ${language} interview question timer component so it handles start, pause, reset, and time-expired states correctly.`,
      `Implement a reusable ${language} form handler for interview feedback with validation, error display, and submit loading state.`
    ][index % 3];
  }
  if (["node.js", "express", "api", "mongodb", "mongoose"].some((item) => normalized.includes(item))) {
    return [
      `Write a ${language} API handler that saves an interview answer with validation, duplicate-answer replacement, and clear error responses.`,
      `Implement a ${language} function that calculates an interview score from communication, technical, problem-solving, and coding dimensions.`,
      `Fix a ${language} workflow update function so it safely moves an interview from in-progress to completed without losing existing answers.`
    ][index % 3];
  }
  return [
    `Write a ${language} solution for a practical ${role} task using ${skill}. Focus on correctness, readability, and edge cases.`,
    `Debug and improve a ${language} function related to ${skill}. Explain the issue and the final approach.`,
    `Optimize a ${language} implementation that uses ${skill}, and describe the tradeoffs you made.`
  ][index % 3];
}

function questionPlan(difficulty, technicalOverrideCount) {
  const rules = loadSpec("interview/difficulty-rules.json");
  const target = { ...(rules.levels[difficulty] || rules.levels[rules.default]) };
  const desiredTechnicalCount = Number(technicalOverrideCount || 0);
  if (desiredTechnicalCount > 0) target.technical = desiredTechnicalCount;
  return target;
}

function baseQuestions({ material, role, difficulty, language, parsedResume, job, retrievedChunks = [], questionCount }) {
  const target = questionPlan(difficulty, questionCount);
  const skills = candidateSkills({ parsedResume, job });
  const primarySkills = skills.length ? skills : ["JavaScript", "React", "Node.js"];
  const generated = generatedTechnicalQuestions(material);
  const documentTechnicalTarget = retrievedChunks.length ? Math.ceil((target.technical || 0) * 0.7) : 0;
  const questions = [
    {
      id: "intro-1",
      type: "intro",
      prompt: "Tell me about yourself and your recent work.",
      ...questionSource("resume")
    }
  ];

  const technicalCount = Math.max(0, target.technical || 0);
  for (let index = 0; index < technicalCount; index += 1) {
    const skill = primarySkills[index % primarySkills.length];
    const docChunk = index < documentTechnicalTarget ? retrievedChunks[index % retrievedChunks.length] : null;
    const docQuestion = docChunk ? documentQuestion(docChunk, role, index) : null;
    questions.push({
      id: `technical-${index + 1}`,
      type: "technical",
      prompt: docQuestion?.prompt || generated[index] || skillQuestion(skill, role, index),
      ...(
        docQuestion ||
        questionSource(generated[index] ? "job_description" : "resume")
      )
    });
  }

  for (let index = 0; index < (target.behavioral || 0); index += 1) {
    questions.push({
      id: `behavioral-${index + 1}`,
      type: "behavioral",
      prompt: "Tell me about a time you received feedback and improved your work.",
      ...questionSource("general_knowledge")
    });
  }

  for (let index = 0; index < (target.coding || 0); index += 1) {
    const skill = primarySkills[(technicalCount + index) % primarySkills.length];
    questions.push({
      id: `coding-${index + 1}`,
      type: "coding",
      prompt: codingTask(skill, role, language, index),
      coding_task: codingTask(skill, role, language, index),
      language,
      ...questionSource("job_description")
    });
  }

  return questions;
}

function clampScore(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value) || 0)));
}

function answerText(answer = {}) {
  return String(answer.clean_transcript || answer.manual_text || answer.raw_transcript || "").trim();
}

function tokenize(value) {
  const ignored = new Set(["what", "when", "where", "which", "would", "could", "should", "about", "with", "your", "this", "that", "then", "than", "from", "into", "have", "will", "and", "the", "for", "you"]);
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !ignored.has(token));
}

function overlapScore(question, answer, code = "") {
  const expected = new Set(tokenize(question));
  const actual = new Set([...tokenize(answer), ...tokenize(code)]);
  if (!expected.size || !actual.size) return 0;
  const hits = [...expected].filter((token) => actual.has(token)).length;
  return Math.min(100, Math.round((hits / Math.min(expected.size, 12)) * 100));
}

function deterministicQuestionScore(question, answer) {
  const text = answerText(answer);
  const code = String(answer?.code || "").trim();
  const hasAnswer = Boolean(text || code);
  if (!hasAnswer) {
    return {
      question_id: question.id,
      score: 0,
      feedback: "No answer was submitted.",
      evidence: [],
      risk: "missing_answer"
    };
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const depthScore = Math.min(100, wordCount * 4);
  const relevanceScore = overlapScore(question.prompt, text, code);
  const confidenceScore = answer?.confidence_score ? Number(answer.confidence_score) * 100 : 70;
  const codingScore = question.type === "coding" ? (code.length > 40 ? 85 : code ? 60 : 20) : 70;
  const weighted = question.type === "coding"
    ? (depthScore * 0.2) + (relevanceScore * 0.25) + (codingScore * 0.45) + (confidenceScore * 0.1)
    : (depthScore * 0.45) + (relevanceScore * 0.35) + (confidenceScore * 0.2);

  return {
    question_id: question.id,
    score: clampScore(weighted),
    feedback: "Scored with deterministic fallback using answer depth, relevance, confidence, and coding evidence.",
    evidence: [text.slice(0, 160), code ? code.slice(0, 120) : ""].filter(Boolean),
    risk: wordCount < 12 && !code ? "thin_answer" : ""
  };
}

function deterministicEvaluation(interview, rubric) {
  const answersByQuestion = new Map((interview.answers || []).map((answer) => [answer.question_id, answer]));
  const questionScores = (interview.questions || []).map((question) => deterministicQuestionScore(question, answersByQuestion.get(question.id)));
  const average = (items) => items.length ? items.reduce((sum, item) => sum + item.score, 0) / items.length : 0;
  const byType = (type) => questionScores.filter((item) => interview.questions.find((question) => question.id === item.question_id)?.type === type);
  const technicalItems = [...byType("technical"), ...byType("coding")];
  const codingItems = byType("coding");
  const overallScore = clampScore(average(questionScores));
  return {
    dimensions: {
      communication: clampScore(average(questionScores.map((item) => ({ score: Math.min(100, item.score + 5) })))),
      technical_skill: clampScore(average(technicalItems.length ? technicalItems : questionScores)),
      problem_solving: clampScore(average(technicalItems.length ? technicalItems : questionScores)),
      coding_ability: clampScore(codingItems.length ? average(codingItems) : average(questionScores) * 0.7),
      confidence: clampScore(average(questionScores)),
      role_fit: clampScore((average(technicalItems.length ? technicalItems : questionScores) * 0.7) + (average(byType("behavioral")) * 0.3 || 0))
    },
    overallScore,
    recommendation: recommendationForScore(overallScore),
    questionScores,
    strengths: questionScores.filter((item) => item.score >= 75).slice(0, 3).map((item) => `${item.question_id}: ${item.feedback}`),
    weaknesses: questionScores.filter((item) => item.score < 55).slice(0, 3).map((item) => `${item.question_id}: ${item.feedback}`),
    riskAreas: questionScores.filter((item) => item.risk).map((item) => `${item.question_id}: ${item.risk}`),
    provider: "deterministic-fallback",
    policy: {
      dimensions: rubric.dimensions,
      scoring: "question_answer_quality"
    }
  };
}

function recommendationForScore(score) {
  if (score >= 80) return "Strong Hire";
  if (score >= 65) return "Hire";
  if (score >= 50) return "Hold";
  return "Reject";
}

async function evaluateInterview(interview) {
  const rubric = loadSpec("interview/evaluation-rubric.json");
  const fallback = deterministicEvaluation(interview, rubric);
  const compactQuestions = (interview.questions || []).map((question) => {
    const answer = (interview.answers || []).find((item) => item.question_id === question.id);
    return {
      id: question.id,
      type: question.type,
      prompt: question.prompt,
      expected_intent: question.coding_task || question.prompt,
      answer: answerText(answer),
      code: answer?.code || "",
      transcript_confidence: answer?.confidence_score ?? null
    };
  });
  const { provider, data } = await generateJsonWithFallback({
    system: [
      "You are a strict technical interview evaluator.",
      "Score only from the candidate answer and code evidence.",
      "Do not reward blank, generic, unrelated, or copied prompt text.",
      "Use 0-100 scores. Missing answer must be 0.",
      `Dimensions: ${rubric.dimensions.join(", ")}.`
    ].join(" "),
    user: JSON.stringify({
      role: interview.role,
      difficulty: interview.difficulty,
      scoring_policy: {
        strong_hire: "overallScore >= 80",
        hire: "overallScore >= 65",
        hold: "overallScore >= 50",
        reject: "overallScore < 50"
      },
      questions: compactQuestions,
      required_json_shape: {
        dimensions: Object.fromEntries(rubric.dimensions.map((dimension) => [dimension, "number 0-100"])),
        overallScore: "number 0-100",
        recommendation: "Strong Hire | Hire | Hold | Reject",
        questionScores: [{ question_id: "string", score: "number 0-100", feedback: "short string", evidence: ["short quotes or code facts"], risk: "short string or empty" }],
        strengths: ["short strings"],
        weaknesses: ["short strings"],
        riskAreas: ["short strings"]
      }
    }),
    fallback
  });
  const dimensions = Object.fromEntries(rubric.dimensions.map((dimension) => [dimension, clampScore(data.dimensions?.[dimension] ?? fallback.dimensions[dimension])]));
  const overallScore = clampScore(data.overallScore ?? Object.values(dimensions).reduce((sum, value) => sum + value, 0) / rubric.dimensions.length);
  const recommendation = ["Strong Hire", "Hire", "Hold", "Reject"].includes(data.recommendation) ? data.recommendation : recommendationForScore(overallScore);
  return {
    dimensions,
    overallScore,
    recommendation,
    questionScores: Array.isArray(data.questionScores) ? data.questionScores.map((item) => ({ ...item, score: clampScore(item.score) })) : fallback.questionScores,
    strengths: Array.isArray(data.strengths) ? data.strengths : fallback.strengths,
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : fallback.weaknesses,
    riskAreas: Array.isArray(data.riskAreas) ? data.riskAreas : fallback.riskAreas,
    provider,
    policy: {
      dimensions: rubric.dimensions,
      score_max: rubric.score_max,
      recommendation_thresholds: {
        strong_hire: 80,
        hire: 65,
        hold: 50,
        reject_below: 50
      }
    }
  };
}

function interviewMaterialFromSession(interview) {
  const questions = (interview.questions || [])
    .filter((question) => question.type !== "coding")
    .map((question) => question.prompt);
  const codingQuestion = (interview.questions || []).find((question) => question.type === "coding");
  return {
    rounds: 1,
    questions,
    coding_task: codingQuestion?.coding_task || codingQuestion?.prompt || "",
    rubric: loadSpec("prompts/interview-agent.json").rubric,
    provider: "interview-session"
  };
}

function markInterviewAgentComplete(workflow, interview) {
  const node = workflow.node_states.find((item) => item.name === "interview_agent");
  const output = workflow.context?.interview || interviewMaterialFromSession(interview);
  if (node && node.status !== "success") {
    node.status = "success";
    node.output = output;
    node.error = undefined;
    node.completed_at = new Date();
  }
  workflow.context = {
    ...workflow.context,
    interview: output
  };
}

export async function startInterview(user, applicationId, payload) {
  const candidate = await findOwnedCandidate(user, applicationId);
  const workflow = await Workflow.findOne({ candidate_id: candidate._id });
  if (!workflow) {
    const error = new Error("Workflow not found for this application");
    error.statusCode = 404;
    throw error;
  }
  const scheduledAt = workflow.interview_scheduled_at || workflow.context?.interviewScheduledAt;
  const endsAt = resolveInterviewEndsAt(workflow, scheduledAt);
  if (scheduledAt && new Date(scheduledAt).getTime() > Date.now()) {
    const error = new Error("Interview has not reached the scheduled time yet");
    error.statusCode = 403;
    throw error;
  }
  if (endsAt && new Date(endsAt).getTime() <= Date.now()) {
    const error = new Error("Interview time has ended.");
    error.statusCode = 403;
    throw error;
  }

  const existingInterview = await Interview.findOne({ candidate_id: candidate._id, workflow_id: workflow._id });
  if (existingInterview?.status === "completed") {
    const error = new Error("Interview is already completed. Only one attempt is allowed.");
    error.statusCode = 403;
    throw error;
  }
  if (existingInterview?.status === "in_progress") {
    assertInterviewOpen(existingInterview);
    return { interview: existingInterview };
  }

  const difficulty = normalizeDifficulty(workflow.interview_difficulty || workflow.context?.interviewDifficulty || "standard");
  const preferredLanguage = payload.preferred_language || workflow.context?.preferredLanguage || loadSpec("interview/coding-rules.json").default_language;
  const role = candidate.job_id?.title || workflow.context?.hiringSpec?.role || "Candidate";
  const retrieval = await retrieveInterviewContext({ workflow, candidate, job: candidate.job_id, difficulty });
  const questions = baseQuestions({
    material: workflow.context?.interview,
    role,
    difficulty,
    language: preferredLanguage,
    parsedResume: workflow.context?.parsedResume || candidate.parsed_resume_json,
    job: candidate.job_id,
    retrievedChunks: retrieval.chunks,
    questionCount: workflow.context?.interviewTechnicalQuestionCount || workflow.context?.interviewQuestionCount
  });
  const questionSource = Object.fromEntries(questions.map((question) => [question.id, {
    source: question.source,
    documentName: question.documentName || null,
    chunkId: question.chunkId || null,
    similarity: question.similarity || null
  }]));

  const interview = await Interview.findOneAndUpdate(
    { candidate_id: candidate._id, workflow_id: workflow._id },
    {
      $setOnInsert: {
        candidate_id: candidate._id,
        job_id: candidate.job_id?._id || workflow.job_id,
        workflow_id: workflow._id,
        scheduled_at: scheduledAt,
        ends_at: endsAt,
        role,
        questions,
        questionSource,
        documentReference: workflow.context?.interviewDocuments || null,
        retrievedChunks: retrieval.chunks,
        retrievalMetadata: retrieval.metadata
      },
      $set: {
        difficulty,
        preferred_language: preferredLanguage,
        status: "in_progress",
        started_at: new Date()
      }
    },
    { upsert: true, new: true }
  );

  return { interview };
}

export async function getInterview(user, interviewId) {
  const interview = await Interview.findById(interviewId).populate("candidate_id job_id");
  if (!interview) {
    const error = new Error("Interview not found");
    error.statusCode = 404;
    throw error;
  }
  const candidate = await findOwnedCandidate(user, interview.candidate_id._id || interview.candidate_id);
  if (!candidate) return null;
  return { interview };
}

export async function questionAudio(user, interviewId, questionId) {
  const { interview } = await getInterview(user, interviewId);
  assertInterviewOpen(interview);
  const question = interview.questions.find((item) => item.id === questionId);
  if (!question) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }
  if (question.audio_url || question.audio_fallback) {
    return { question };
  }
  const audio = await synthesizeQuestionAudio({ interviewId, questionId, text: question.prompt });
  question.audio_url = audio.audio_url;
  question.audio_provider = audio.provider;
  question.audio_fallback = audio.fallback;
  question.asked_at = new Date();
  await interview.save();
  return { question, audio };
}

export async function submitAnswer(user, interviewId, payload, file) {
  const { interview } = await getInterview(user, interviewId);
  assertInterviewOpen(interview);
  const question = interview.questions.find((item) => item.id === payload.question_id);
  if (!question) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }
  const recordingPath = persistRecording({ interviewId, questionId: payload.question_id, file });
  const transcript = await transcribeRecording(recordingPath, payload.manual_text || "");
  const answer = {
    question_id: payload.question_id,
    raw_transcript: transcript.rawTranscript,
    clean_transcript: transcript.cleanTranscript,
    confidence_score: transcript.confidenceScore,
    manual_text: payload.manual_text || "",
    code: payload.code || "",
    language: payload.language || question.language || interview.preferred_language,
    recording_path: recordingPath,
    answered_at: new Date(),
    duration: Number(payload.duration || 0),
    assembly_provider: transcript.provider,
    transcription_fallback: transcript.fallback
  };
  interview.answers = interview.answers.filter((item) => item.question_id !== payload.question_id);
  interview.answers.push(answer);
  interview.messages.push({
    role: "assistant",
    content: "Good explanation. Let's move to the next question.",
    created_at: new Date()
  });
  await interview.save();
  return { answer, next_question_index: interview.answers.length };
}

export async function completeInterview(user, interviewId) {
  const { interview } = await getInterview(user, interviewId);
  if (interview.status === "completed") return { interview };
  const evaluation = await evaluateInterview(interview);
  interview.status = "completed";
  interview.completed_at = new Date();
  interview.evaluation = evaluation;
  interview.overall_score = evaluation.overallScore;
  interview.recommendation = evaluation.recommendation;
  await interview.save();

  const workflow = await Workflow.findById(interview.workflow_id);
  if (workflow) {
    markInterviewAgentComplete(workflow, interview);
    workflow.current_state = "ai_interview_engine";
    workflow.context = {
      ...workflow.context,
      interviewSession: {
        _id: interview._id,
        status: interview.status,
        overall_score: interview.overall_score,
        recommendation: interview.recommendation,
        completed_at: interview.completed_at
      },
      interviewEvaluation: evaluation
    };
    await workflow.save();
    await runHiringWorkflow(workflow._id, { approved: true, interviewCompleted: true });
  }

  return { interview };
}
