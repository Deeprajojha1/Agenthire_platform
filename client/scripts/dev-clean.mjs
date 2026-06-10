import { execFile } from "node:child_process";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ports = [3000, 3001];

async function windowsPidsForPorts(targetPorts) {
  const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "tcp"]);
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("LISTENING"))
    .map((line) => line.split(/\s+/))
    .filter((parts) => targetPorts.some((port) => parts[1]?.endsWith(`:${port}`)))
    .map((parts) => Number(parts.at(-1)))
    .filter(Boolean);
}

async function windowsNextDevPids() {
  const command = [
    "$ErrorActionPreference='SilentlyContinue';",
    "Get-CimInstance Win32_Process |",
    "Where-Object {",
    "$_.CommandLine -match 'next dev|next\\\\dist' -and $_.CommandLine -match 'AgentHire\\\\client'",
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
    console.log(`[dev] Stopped old client dev process ${pid}.`);
  } catch {
    // Process may have already exited.
  }
}

async function cleanNextCache() {
  await rm(join(process.cwd(), ".next-dev"), { recursive: true, force: true });
  console.log("[dev] Cleared client .next-dev cache.");
}

async function main() {
  if (process.platform === "win32") {
    const pids = [...new Set([...(await windowsNextDevPids()), ...(await windowsPidsForPorts(ports))])];
    await Promise.all(pids.map(killPid));
  }
  await cleanNextCache();
}

main().catch((error) => {
  console.warn(`[dev] Client cleanup skipped: ${error.message}`);
});
