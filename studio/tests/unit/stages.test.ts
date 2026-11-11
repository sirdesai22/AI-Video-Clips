import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { parseStreamLine, progressAtStart, stageLabel, stageIndex } from "../../lib/stages";

const lines = fs.readFileSync(path.join(__dirname, "../fixtures/build-stream.jsonl"), "utf8").split("\n").filter(Boolean);

describe("parseStreamLine", () => {
  it("reads the session id from init", () => {
    expect(parseStreamLine(lines[0]).sessionId).toBe("fake-session");
  });

  it("reads STAGE markers, text and tool calls", () => {
    const p = parseStreamLine(lines[1]);
    expect(p.stage).toBe("voice");
    expect(p.texts[0]).toContain("Recording the narration");
    expect(p.tools[0]).toMatch(/^Bash: npx hyperframes tts/);
  });

  it("infers the check stage from a hyperframes check command", () => {
    expect(parseStreamLine(lines[6]).stage).toBe("check");
  });

  it("reads the final result", () => {
    expect(parseStreamLine(lines[8]).result).toEqual({ isError: false, text: "Rendered renders/v1.mp4" });
  });

  it("ignores lines that are not JSON", () => {
    expect(parseStreamLine("not json")).toEqual({ texts: [], tools: [] });
  });

  it("sees every stage across the fixture in order", () => {
    const seen = lines.map((l) => parseStreamLine(l).stage).filter(Boolean);
    expect(seen).toEqual(["voice", "music", "look", "scenes", "check", "render"]);
  });
});

describe("progress", () => {
  it("adds up earlier stage weights", () => {
    expect(progressAtStart("voice")).toBe(0);
    expect(progressAtStart("scenes")).toBe(25);
    expect(progressAtStart("render")).toBe(85);
    expect(stageLabel("scenes")).toBe("Building scenes");
    expect(stageIndex("check")).toBe(4);
    expect(stageIndex("unknown")).toBe(-1);
  });
});
