import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { renderPrompt } from "../../lib/prompts";

afterEach(() => { delete process.env.STUDIO_ROOT; });

describe("renderPrompt", () => {
  it("replaces known keys and leaves unknown and inherited keys literal", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rs-prompts-"));
    fs.mkdirSync(path.join(root, "prompts"));
    fs.writeFileSync(path.join(root, "prompts", "t.md"), "{{a}} {{nope}} {{constructor}}");
    process.env.STUDIO_ROOT = root;
    expect(renderPrompt("t", { a: "1" })).toBe("1 {{nope}} {{constructor}}");
  });
});
