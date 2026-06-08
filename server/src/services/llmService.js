import { env } from "../config/env.js";
import { loadSpec } from "../utils/specLoader.js";

async function postJson(url, headers, body, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function parseGeminiJson(json) {
  const content = json.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n") || "";
  const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return parseJsonContent(cleaned);
}

export async function generateJsonWithFallback({ system, user, fallback }) {
  const policy = loadSpec("system/llm-policy.json");
  const body = {
    messages: [
      { role: "system", content: `${system}\nReturn valid JSON only.` },
      { role: "user", content: user }
    ],
    temperature: policy.temperature
  };

  if (env.GEMINI_API_KEY) {
    try {
      const json = await postJson(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
        {},
        {
          contents: [
            {
              role: "user",
              parts: [{ text: `${system}\nReturn valid JSON only.\n\n${user}` }]
            }
          ],
          generationConfig: {
            temperature: policy.temperature,
            responseMimeType: "application/json"
          }
        },
        policy.timeout_ms
      );
      const parsed = parseGeminiJson(json);
      if (parsed) return { provider: "gemini", data: parsed };
    } catch {
      // Fall through to Groq, OpenRouter, or deterministic fallback.
    }
  }

  if (env.GROQ_API_KEY) {
    try {
      const json = await postJson(
        "https://api.groq.com/openai/v1/chat/completions",
        { Authorization: `Bearer ${env.GROQ_API_KEY}` },
        { ...body, model: policy.groq_model },
        policy.timeout_ms
      );
      const parsed = parseJsonContent(json.choices?.[0]?.message?.content || "");
      if (parsed) return { provider: "groq", data: parsed };
    } catch {
      // Fall through to OpenRouter or deterministic fallback.
    }
  }

  if (env.OPENROUTER_API_KEY) {
    try {
      const json = await postJson(
        "https://openrouter.ai/api/v1/chat/completions",
        { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "HTTP-Referer": "http://localhost:3000", "X-Title": "AgentHire" },
        { ...body, model: policy.openrouter_model },
        policy.timeout_ms
      );
      const parsed = parseJsonContent(json.choices?.[0]?.message?.content || "");
      if (parsed) return { provider: "openrouter", data: parsed };
    } catch {
      // Fall through to deterministic fallback.
    }
  }

  return { provider: "deterministic-fallback", data: fallback };
}
