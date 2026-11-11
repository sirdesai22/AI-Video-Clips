import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validateScript as validate, extractScript, scriptJsonSchema } from "../../lib/script-schema";
import { getRecipe } from "../../lib/recipes";
import type { Format, RecipeId } from "../../lib/types";

const validateScript = (raw: unknown, format: Format, recipe: RecipeId = "explainer") =>
  validate(raw, { format, recipe: getRecipe(recipe) });

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
    expect(validateScript(s, "landscape").ok).toBe(true);
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

  it("validates look colours as hex", () => {
    const s = clone();
    s.look.accent = "orange";
    const r = validateScript(s, "reel");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/look\.accent/);
    s.look.accent = "#abc";
    expect(validateScript(s, "reel").ok).toBe(true);
  });

  it("requires a recipe angle", () => {
    const s = clone();
    s.angle = "bogus";
    expect(validateScript(s, "reel").ok).toBe(false);
  });

  it("motion-graphic needs empty spoken lines and 1-6 scenes", () => {
    const s = clone();
    s.angle = "kinetic-title";
    s.scenes = s.scenes.slice(0, 3);
    const bad = validateScript(s, "reel", "motion-graphic");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.join()).toMatch(/spoken: must be empty/);
    s.scenes.forEach((sc: { spoken: string }) => { sc.spoken = ""; });
    expect(validateScript(s, "reel", "motion-graphic").ok).toBe(true);
    s.scenes = [...s.scenes, ...s.scenes];
    s.scenes.push(s.scenes[0]);
    expect(validateScript(s, "reel", "motion-graphic").ok).toBe(false);
  });

  it("uses the recipe scene bounds", () => {
    const s = clone();
    s.scenes = s.scenes.slice(0, 3);
    s.angle = "trend";
    expect(validateScript(s, "reel", "data-story").ok).toBe(true);
    s.angle = "story";
    const r = validateScript(s, "reel", "explainer");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/scenes: need 4-12/);
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
      ["title", "idea", "angle", "voice", "look", "concept", "estSeconds", "scenes", "sources", "claims"],
    );
  });
});
