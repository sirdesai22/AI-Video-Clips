import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validateScript, extractScript, scriptJsonSchema } from "../../lib/script-schema";

const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "../fixtures/script.json"), "utf8"));
const clone = () => JSON.parse(JSON.stringify(fixture));

describe("validateScript", () => {
  it("accepts the fixture as a reel", () => {
    const r = validateScript(fixture, "reel");
    expect(r.ok).toBe(true);
  });

  it("rejects a spoken line over 19 words", () => {
    const s = clone();
    s.scenes[0].spoken = Array(20).fill("word").join(" ");
    const r = validateScript(s, "reel");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/scenes\.0\.spoken: 20 words, max 19/);
  });

  it("limits on-screen words by format", () => {
    const s = clone();
    s.scenes[1].onScreen = "one two three four five six seven";
    expect(validateScript(s, "reel").ok).toBe(false);
    expect(validateScript(s, "explainer").ok).toBe(true);
  });

  it("rejects on-screen text that repeats the spoken line", () => {
    const s = clone();
    s.scenes[4].onScreen = "That is high agency.";
    s.scenes[4].spoken = "That is high agency";
    const r = validateScript(s, "reel");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/must not repeat/);
  });

  it("enforces the scene count range", () => {
    const s = clone();
    s.scenes = s.scenes.slice(0, 3);
    expect(validateScript(s, "reel").ok).toBe(false);
  });

  it("reports schema errors with paths", () => {
    const r = validateScript({ title: "x" }, "reel");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.some((e) => e.startsWith("scenes"))).toBe(true);
  });
});

describe("extractScript", () => {
  it("prefers structured_output", () => {
    expect(extractScript({ structured_output: { a: 1 }, result: "{\"a\":2}" })).toEqual({ a: 1 });
  });
  it("falls back to the JSON inside result text", () => {
    expect(extractScript({ result: "Here it is:\n{\"a\":2}\nDone." })).toEqual({ a: 2 });
  });
  it("returns null when nothing parses", () => {
    expect(extractScript({ result: "no json" })).toBeNull();
    expect(extractScript(null)).toBeNull();
  });
});

describe("scriptJsonSchema", () => {
  it("requires the same top-level keys as the zod schema", () => {
    expect(scriptJsonSchema.required).toEqual(
      ["title", "idea", "angle", "voice", "estSeconds", "scenes", "sources", "claims"],
    );
  });
});
