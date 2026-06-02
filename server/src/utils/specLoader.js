import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd(), "..", "specs");

export function loadSpec(relativePath) {
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(root)) {
    throw new Error("Invalid spec path");
  }
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

export function loadHiringSpec(specId = "frontend-developer") {
  return loadSpec(`hiring/${specId}.json`);
}

export function loadWorkflowSpec(specId = "default-hiring-workflow") {
  return loadSpec(`workflow/${specId}.json`);
}
