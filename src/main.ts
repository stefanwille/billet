import { text } from "node:stream/consumers";
import { agentRequest } from "./agent/agent-request";
import { createAgentSession } from "./agent/agent-session";
import { createReadlineSession } from "./agent/readline/readline";
import {
  loadReadlineHistory,
  saveReadlineHistory,
} from "./agent/readline/readline-history";
import { runInSandbox } from "./agent/sandbox/runProgramInSandbox";
import { getCliOptions, type CliOptions } from "./cli-options";
import {
  renderWelcome,
  promptString,
  renderModeChange,
  renderHelp,
} from "./agent/ui";

async function repl(model: string | undefined): Promise<void> {
  const history = await loadReadlineHistory();
  const readlineSession = createReadlineSession(history);
  const agentSession = await createAgentSession({ model });
  console.log(renderWelcome(agentSession.model));

  for (;;) {
    const prompt = promptString(agentSession.mode);
    let input = await readlineSession.promptUser(prompt);
    if (input === null) {
      break;
    }
    input = input.trim();
    if (input === "exit" || input === "quit" || input === "/exit") {
      break;
    }
    if (!input) continue;
    if (input === "/help") {
      console.log(renderHelp());
      continue;
    }
    if (input === "/plan") {
      agentSession.mode = "plan";
      console.log(renderModeChange("plan"));
      continue;
    }
    if (input === "/agent") {
      agentSession.mode = "agent";
      console.log(renderModeChange("agent"));
      continue;
    }
    await saveReadlineHistory(readlineSession.getHistory());
    await agentRequest(input, agentSession);
  }
  process.exit(0);
}

async function batchMode(model: string | undefined) {
  const input = await text(process.stdin);
  const agentSession = await createAgentSession({ model });
  await agentRequest(input, agentSession);
  process.exit(0);
}

async function sandboxedMain(cliOptions: CliOptions) {
  const { model, cwd } = cliOptions;
  if (cwd) {
    process.chdir(cwd);
  }
  if (process.stdin.isTTY) {
    await repl(model);
  } else {
    await batchMode(model);
  }
}

function checkAnthropicApiKey() {
  if (!Bun.env.ANTHROPIC_API_KEY) {
    console.log(
      "ANTHROPIC_API_KEY is not set. Please copy .env.local.example to .env.local and add your API key there.",
    );
    process.exit(1);
  }
  if (!Bun.env.ANTHROPIC_API_KEY?.startsWith("sk-")) {
    console.log("ANTHROPIC_API_KEY is not a valid API key.");
    process.exit(1);
  }
}

async function main() {
  checkAnthropicApiKey();
  const cliOptions = getCliOptions();
  const program = async () => {
    await sandboxedMain(cliOptions);
  };
  await runInSandbox(program, cliOptions.cwd);
}

main().catch(console.error);
