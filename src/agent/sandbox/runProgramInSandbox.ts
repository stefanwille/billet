import {
  SandboxManager,
  SandboxRuntimeConfigSchema,
  type SandboxRuntimeConfig,
} from "@anthropic-ai/sandbox-runtime";
import { type ChildProcess, spawn } from "child_process";

export type Program = () => Promise<void>;

export async function runInSandbox(program: Program, cwd?: string) {
  if (Bun.env.SRT_SANDBOXED) {
    // Child: Run the actual agent
    await program();
  } else {
    // Parent
    await relaunchProgramInSandbox(cwd);
  }
}

async function relaunchProgramInSandbox(cwd?: string) {
  // Parent: re-launch ourselves inside the sandbox

  const config = await loadSandboxRuntimeConfig();

  if (cwd) {
    config.filesystem.allowWrite = [
      ...(config.filesystem.allowWrite ?? []),
      cwd,
    ];
  }

  await SandboxManager.initialize(config);
  const cmd = await SandboxManager.wrapWithSandbox(createRelaunchCommand());
  const child = spawn(cmd, { shell: true, stdio: "inherit" });
  const { code, signal } = await waitForChild(child);

  SandboxManager.cleanupAfterCommand();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
}

async function loadSandboxRuntimeConfig(): Promise<SandboxRuntimeConfig> {
  const POLICY_FILE = new URL("sandbox-settings.json", import.meta.url);
  const SANDBOX_POLICY = await Bun.file(POLICY_FILE).json();
  return SandboxRuntimeConfigSchema.parse(SANDBOX_POLICY);
}

function createRelaunchCommand(): string {
  return ["env", "SRT_SANDBOXED=1", process.execPath, ...process.argv.slice(1)]
    .map(shellQuote)
    .join(" ");
}

function shellQuote(value: string): string {
  if (value === "") {
    return "''";
  }
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function waitForChild(
  child: ChildProcess,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });
}
