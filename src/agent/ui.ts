/**
 * UI helpers — friendly, non-programmer visual style for the terminal.
 */

const R = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const ITALIC = "\x1b[3m";

// Palette
const LAVENDER = "\x1b[38;5;183m"; // soft purple
const MINT = "\x1b[38;5;115m"; // muted green
const PEACH = "\x1b[38;5;216m"; // warm orange
const ROSE = "\x1b[38;5;211m"; // pink-red
const SKY = "\x1b[38;5;153m"; // light blue
const GOLD = "\x1b[38;5;222m"; // warm yellow
const MUTED = "\x1b[38;5;245m"; // medium gray
const CHALK = "\x1b[38;5;252m"; // near-white

const BG_STRIP = "\x1b[48;5;236m"; // dark gray background strip

function terminalWidth(): number {
  return process.stdout.columns ?? 80;
}

function center(text: string, width: number, fill = " "): string {
  // strip ANSI for length calculation
  const plain = text.replace(/\x1b\[[^m]*m/g, "");
  const pad = Math.max(0, width - plain.length);
  const left = Math.floor(pad / 2);
  const right = pad - left;
  return fill.repeat(left) + text + fill.repeat(right);
}

function line(char = "─", width?: number): string {
  return MUTED + char.repeat(width ?? terminalWidth()) + R;
}

// ─── Welcome banner ──────────────────────────────────────────────────────────

export function renderWelcome(model: string): string {
  const w = terminalWidth();
  const rows: string[] = [];

  rows.push("");
  rows.push(line("─", w));
  rows.push(
    center(`${BOLD}${LAVENDER}  Billet ${MUTED}· AI coding agent${R}`, w),
  );
  rows.push(center(`${DIM}${CHALK}model: ${model}${R}`, w));
  rows.push(line("─", w));
  rows.push(
    `  ${MUTED}Type a message to get started.  ${SKY}/help${MUTED} · ${SKY}/plan${MUTED} · ${SKY}/agent${MUTED} · ${SKY}/exit${R}`,
  );
  rows.push("");

  return rows.join("\n");
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

export function promptString(mode: "agent" | "plan"): string {
  if (mode === "plan") {
    return `${GOLD}${BOLD} 📋 plan ${R}${MUTED}›${R} `;
  }
  return `${LAVENDER}${BOLD} ✦ billet ${R}${MUTED}›${R} `;
}

// ─── Mode change notifications ────────────────────────────────────────────────

export function renderModeChange(mode: "agent" | "plan"): string {
  if (mode === "plan") {
    return `\n${BG_STRIP}${GOLD}${BOLD}  📋  Plan mode  ${R}${MUTED}  Claude will only read and plan — no edits.${R}\n`;
  }
  return `\n${BG_STRIP}${MINT}${BOLD}  ✦  Agent mode  ${R}${MUTED}  Claude can read, write, and run commands.${R}\n`;
}

// ─── Help ────────────────────────────────────────────────────────────────────

export function renderHelp(): string {
  const rows: string[] = [];
  rows.push("");
  rows.push(`  ${BOLD}${LAVENDER}Available commands${R}`);
  rows.push(`  ${SKY}/plan${R}   ${MUTED}Switch to plan mode (read-only)${R}`);
  rows.push(
    `  ${SKY}/agent${R}  ${MUTED}Switch to agent mode (full access)${R}`,
  );
  rows.push(`  ${SKY}/help${R}   ${MUTED}Show this message${R}`);
  rows.push(`  ${SKY}/exit${R}   ${MUTED}Quit${R}`);
  rows.push("");
  return rows.join("\n");
}

// ─── Tool frame ──────────────────────────────────────────────────────────────

const TOOL_ICONS: Record<string, string> = {
  bash: "⚙",
  str_replace_based_edit_tool: "✎",
  exit_plan_mode: "🔓",
};

function toolIcon(name: string): string {
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (name.toLowerCase().includes(key)) return icon;
  }
  return "◆";
}

function friendlyToolName(name: string): string {
  if (name.includes("bash")) return "shell";
  if (name.includes("str_replace") || name.includes("edit")) return "editor";
  if (name.includes("exit_plan")) return "switching mode";
  return name.replace(/_/g, " ");
}

function renderInputSummary(input: unknown): string {
  if (typeof input === "object" && input !== null) {
    const obj = input as Record<string, unknown>;
    if (typeof obj.command === "string") {
      // bash command — show it verbatim, trimmed
      return obj.command.trim();
    }
    if (typeof obj.command === "string" && obj.command === "view") {
      return `view ${obj.path}`;
    }
    // editor tool
    const cmd = obj.command ?? "";
    const path = obj.path ?? "";
    if (cmd && path) return `${cmd} ${path}`;
  }
  if (typeof input === "string") return input.trim();
  return JSON.stringify(input);
}

export function renderToolFrame(
  name: string,
  input: unknown,
  result: string,
): string {
  const w = Math.min(terminalWidth(), 90);
  const icon = toolIcon(name);
  const label = friendlyToolName(name);
  const rows: string[] = [];

  // Header bar
  const header = ` ${icon}  ${BOLD}${CHALK}${label}${R}`;
  rows.push("");
  rows.push(MUTED + "╭" + "─".repeat(w - 2) + "╮" + R);
  rows.push(
    MUTED + "│" + R + BG_STRIP + center(header, w - 2) + R + MUTED + "│" + R,
  );
  rows.push(MUTED + "├" + "─".repeat(w - 2) + "┤" + R);

  // Input summary
  const inputSummary = renderInputSummary(input);
  for (const inputLine of inputSummary.split("\n").slice(0, 8)) {
    const truncated =
      inputLine.length > w - 6 ? inputLine.slice(0, w - 9) + "…" : inputLine;
    rows.push(
      MUTED +
        "│ " +
        R +
        PEACH +
        truncated +
        R +
        MUTED +
        " ".repeat(
          Math.max(0, w - 4 - truncated.replace(/\x1b\[[^m]*m/g, "").length),
        ) +
        "│" +
        R,
    );
  }

  // Result section
  rows.push(MUTED + "├" + "─".repeat(w - 2) + "┤" + R);

  const resultLines = result.split("\n");
  const MAX_LINES = 15;
  const displayLines = resultLines.slice(0, MAX_LINES);
  const hidden = resultLines.length - displayLines.length;

  for (const rLine of displayLines) {
    const truncated =
      rLine.length > w - 6 ? rLine.slice(0, w - 9) + "…" : rLine;
    rows.push(
      MUTED +
        "│ " +
        R +
        CHALK +
        truncated +
        R +
        " ".repeat(
          Math.max(0, w - 4 - truncated.replace(/\x1b\[[^m]*m/g, "").length),
        ) +
        MUTED +
        "│" +
        R,
    );
  }
  if (hidden > 0) {
    const moreText = `… ${hidden} more lines`;
    rows.push(
      MUTED +
        "│ " +
        R +
        MUTED +
        ITALIC +
        moreText +
        R +
        MUTED +
        " ".repeat(Math.max(0, w - 6 - moreText.length)) +
        "│" +
        R,
    );
  }

  rows.push(MUTED + "╰" + "─".repeat(w - 2) + "╯" + R);
  rows.push("");
  return rows.join("\n");
}

// ─── Status line ─────────────────────────────────────────────────────────────

export function renderStatus(tokens: number, model: string): string {
  const tokenStr = tokens.toLocaleString();
  return `\n${MUTED}${DIM}  tokens used: ${tokenStr}   model: ${model}${R}`;
}

// ─── Error / warning ─────────────────────────────────────────────────────────

export function renderError(msg: string): string {
  return `\n${ROSE}${BOLD}  ✗  ${msg}${R}\n`;
}

export function renderWarning(msg: string): string {
  return `\n${GOLD}  ⚠  ${msg}${R}\n`;
}
