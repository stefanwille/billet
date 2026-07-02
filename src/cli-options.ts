import type Anthropic from "@anthropic-ai/sdk";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { DEFAULT_MODEL } from "./agent/agent-session";

type ModelAlias = "haiku" | "sonnet" | "opus";

const MODEL_MAP: Record<ModelAlias, Anthropic.Messages.Model> = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-5",
  opus: "claude-opus-4-6",
};


export interface CliOptions {
  model?: Anthropic.Messages.Model;
  cwd?: string;
}

export function getCliOptions(): CliOptions {
  const { values } = parseArgs({
    options: {
      model: { type: "string", short: "m" },
      cwd: { type: "string" },
    },
    allowPositionals: true,
  });

  const model: Anthropic.Messages.Model =
    MODEL_MAP[(values.model as ModelAlias) ?? "--"] ?? DEFAULT_MODEL;

  const cwd = values.cwd ? resolve(values.cwd) : undefined;

  return { model, cwd };
}
