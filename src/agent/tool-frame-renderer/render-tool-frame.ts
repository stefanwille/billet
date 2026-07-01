import { RESET, DIM, YELLOW, GRAY } from "../ansi-colors";

function renderLabeledBorder(
  label: string,
  width: number,
  left: string,
  right: string,
): string {
  const pad = Math.max(0, width - 2 - label.length);
  return DIM + left + label + "─".repeat(pad) + right + RESET;
}

function renderFrameResultLines(result: string, maxLines: number): string[] {
  const resultLines = result.split("\n");
  const truncated = resultLines.length > maxLines;
  const displayLines = truncated ? resultLines.slice(0, maxLines) : resultLines;

  const output = displayLines.map((line) => DIM + "│ " + RESET + line);
  if (truncated) {
    output.push(
      DIM +
        "│ " +
        RESET +
        GRAY +
        `... (${resultLines.length - maxLines} more lines)` +
        RESET,
    );
  }
  return output;
}

export function renderToolFrame(
  name: string,
  input: unknown,
  result: string,
): string {
  const width = 50;
  const output: string[] = [];

  output.push(renderLabeledBorder(` ${name} `, width, "┌─", "┐"));

  const inputStr =
    typeof input === "string" ? input : JSON.stringify(input, null, 2);
  for (const line of inputStr.split("\n")) {
    output.push(DIM + "│ " + RESET + YELLOW + line + RESET);
  }

  output.push(renderLabeledBorder(" result ", width, "├─", "┤"));
  output.push(...renderFrameResultLines(result, 20));

  output.push(renderLabeledBorder("", width, "└─", "┘"));
  return output.join("\n");
}
