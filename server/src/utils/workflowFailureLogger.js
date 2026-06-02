import fs from "fs";
import path from "path";

const logsDir = path.resolve(process.cwd(), "logs");

export function logWorkflowFailure({ agentName, state, error }) {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const entry = {
    agent_name: agentName,
    state,
    stack: error?.stack,
    message: error?.message,
    timestamp: new Date().toISOString()
  };
  fs.appendFileSync(path.join(logsDir, "workflow-failures.log"), `${JSON.stringify(entry)}\n`);
}
