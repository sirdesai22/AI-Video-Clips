import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { RECIPE_IDS, listRecipes, getRecipe, recipeText } from "../../lib/recipes";
import { skillsSource } from "../../lib/paths";

describe("recipes", () => {
  it("loads and validates all six, in RECIPE_IDS order", () => {
    expect(RECIPE_IDS).toEqual(["explainer", "product-launch", "motion-graphic", "data-story", "pr-video", "custom"]);
    const recipes = listRecipes();
    expect(recipes.map((r) => r.id)).toEqual([...RECIPE_IDS]);
    for (const r of recipes) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.scenes.min).toBeLessThanOrEqual(r.scenes.max);
      expect(r.skillRefs.length).toBeGreaterThan(0);
    }
  });

  it("gets a recipe by id and throws on an unknown id", () => {
    expect(getRecipe("data-story").id).toBe("data-story");
    expect(() => getRecipe("nope")).toThrow(/unknown recipe/i);
  });

  it("has the type-specific settings", () => {
    const mg = getRecipe("motion-graphic");
    expect(mg.narration).toBe(false);
    expect(mg.scenes).toEqual({ min: 1, max: 6 });
    expect(getRecipe("data-story")).toMatchObject({ narration: true, scenes: { min: 2, max: 8 } });
    expect(getRecipe("product-launch").needsUrl).toBe(true);
    expect(getRecipe("pr-video").needsUrl).toBe(true);
    expect(getRecipe("explainer").needsUrl).toBe(false);
    expect(getRecipe("pr-video").knobs).not.toContain("cta");
  });

  it("explains the cta and exactWording knobs in script.md wherever a recipe exposes them", () => {
    for (const r of listRecipes()) {
      const text = recipeText(r.id, "script").toLowerCase();
      if (r.knobs.includes("cta")) expect(text, r.id).toContain("call to action goes");
      if (r.knobs.includes("exactWording")) expect(text, r.id).toContain("exact wording goes");
    }
  });

  it("returns non-empty script and build text for each recipe", () => {
    for (const id of RECIPE_IDS) {
      expect(recipeText(id, "script").trim().length).toBeGreaterThan(200);
      expect(recipeText(id, "build").trim().length).toBeGreaterThan(200);
    }
  });

  it("points every skillRef at a file in the hyperframes skill", () => {
    const skillDir = path.join(skillsSource(), "hyperframes");
    for (const r of listRecipes()) {
      for (const ref of r.skillRefs) {
        expect(fs.existsSync(path.join(skillDir, ref)), `${r.id}: ${ref}`).toBe(true);
      }
    }
  });
});
