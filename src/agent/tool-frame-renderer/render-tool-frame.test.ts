import { describe, it, expect } from "bun:test";
import { renderToolFrame } from "./render-tool-frame";

const YELLOW = "\x1b[33m";

describe("renderToolFrame", () => {
  it("renders tool name in top border", () => {
    const result = renderToolFrame("bash", { command: "ls" }, "file.ts");
    expect(result).toContain("┌─ bash ");
    expect(result).toContain("┐");
  });

  it("renders input as YELLOW", () => {
    const result = renderToolFrame("bash", { command: "ls" }, "output");
    expect(result).toContain(YELLOW);
    expect(result).toContain("command");
  });

  it("renders result separator", () => {
    const result = renderToolFrame("test", "input", "output");
    expect(result).toContain("├─ result ");
    expect(result).toContain("┤");
  });

  it("renders result content", () => {
    const result = renderToolFrame("test", "in", "hello world");
    expect(result).toContain("hello world");
  });

  it("renders bottom border", () => {
    const result = renderToolFrame("test", "in", "out");
    expect(result).toContain("└");
    expect(result).toContain("┘");
  });

  it("truncates long results", () => {
    const longResult = Array(30).fill("line").join("\n");
    const result = renderToolFrame("test", "in", longResult);
    expect(result).toContain("more lines");
  });

  it("renders object input as JSON", () => {
    const result = renderToolFrame(
      "bash",
      { command: "ls", timeout: 5000 },
      "out",
    );
    expect(result).toContain('"command": "ls"');
    expect(result).toContain('"timeout": 5000');
  });

  it("renders string input directly", () => {
    const result = renderToolFrame("test", "raw input", "out");
    expect(result).toContain("raw input");
  });
});
