import { execFile } from "node:child_process";
import { promisify } from "node:util";
import dotenv from "dotenv";

dotenv.config();

const execFileAsync = promisify(execFile);
const port = Number(process.env.PORT || 5000);

async function windowsPidsForPort(targetPort) {
  const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "tcp"]);
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("LISTENING"))
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts[1]?.endsWith(`:${targetPort}`))
    .map((parts) => Number(parts.at(-1)))
    .filter(Boolean);
}

async function windowsBackendDevPids() {
  const command = [
    "$ErrorActionPreference='SilentlyContinue';",
    "Get-CimInstance Win32_Process |",
    "Where-Object {",
    "($_.CommandLine -match 'nodemon src/index.js' -or $_.CommandLine -match 'node.exe\"? src/index.js')",
    "-and $_.CommandLine -match 'AgentHire\\\\server|src/index.js'",
    "} |",
    "Select-Object -ExpandProperty ProcessId"
  ].join(" ");
  const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", command]);
  return stdout
    .split(/\r?\n/)
    .map((line) => Number(line.trim()))
    .filter(Boolean)
    .filter((pid) => pid !== process.pid);
}

async function killPid(pid) {
  try {
    await execFileAsync("taskkill", ["/PID", String(pid), "/T", "/F"]);
    console.log(`[dev] Freed port ${port} by stopping process ${pid}.`);
  } catch (error) {
    console.warn(`[dev] Could not stop process ${pid}: ${error.message}`);
  }
}

async function main() {
  if (process.platform !== "win32") return;
  const pids = [...new Set([
    ...(await windowsBackendDevPids()),
    ...(await windowsPidsForPort(port))
  ])];
  await Promise.all(pids.map(killPid));
}

main().catch((error) => {
  console.warn(`[dev] Port cleanup skipped: ${error.message}`);
});
