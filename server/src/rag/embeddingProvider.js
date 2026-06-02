import { pipeline } from "@huggingface/transformers";

let extractorPromise;

function runtimeModelName(modelName) {
  return modelName;
}

export async function embedText(text, modelName) {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", runtimeModelName(modelName));
  }
  const extractor = await extractorPromise;
  const output = await extractor(String(text || ""), {
    pooling: "mean",
    normalize: true
  });
  return Array.from(output.data);
}

export function getEmbeddingRuntime(modelName) {
  return {
    requested_model: modelName,
    runtime_model: runtimeModelName(modelName),
    dimensions: 384
  };
}
