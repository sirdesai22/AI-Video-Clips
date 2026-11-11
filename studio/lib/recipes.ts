import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { recipesDir } from "./paths";
import type { RecipeId } from "./types";

export const RECIPE_IDS = [
  "explainer", "product-launch", "motion-graphic", "data-story", "pr-video", "custom",
] as const satisfies readonly RecipeId[];

const KNOBS = ["angle", "palette", "voiceTone", "musicMood", "length", "audience", "exactWording", "cta", "voice"] as const;

export interface Recipe {
  id: RecipeId;
  label: string;               // "Explainer"
  tagline: string;             // one line for the picker card
  inputPlaceholder: string;    // textarea placeholder for this type
  narration: boolean;          // false → spoken lines may be empty; no voice stage
  scenes: { min: number; max: number };
  duration: { reel: string; landscape: string };
  angles: string[];            // may be empty
  knobs: Array<(typeof KNOBS)[number]>;
  skillRefs: string[];         // paths relative to the hyperframes skill dir
  needsUrl: boolean;           // product-launch and pr-video want a URL in the input
}

const RecipeSchema = z.object({
  id: z.enum(RECIPE_IDS),
  label: z.string().min(1),
  tagline: z.string().min(1),
  inputPlaceholder: z.string().min(1),
  narration: z.boolean(),
  scenes: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) })
    .refine((s) => s.min <= s.max, "scenes.min must be <= scenes.max"),
  duration: z.object({ reel: z.string().min(1), landscape: z.string().min(1) }),
  angles: z.array(z.string().min(1)),
  knobs: z.array(z.enum(KNOBS)),
  skillRefs: z.array(z.string().min(1)).min(1),
  needsUrl: z.boolean(),
}) satisfies z.ZodType<Recipe>;

const isRecipeId = (id: string): id is RecipeId => (RECIPE_IDS as readonly string[]).includes(id);

export function getRecipe(id: string): Recipe {
  if (!isRecipeId(id)) throw new Error(`unknown recipe: ${id}`);
  const raw: unknown = JSON.parse(fs.readFileSync(path.join(recipesDir(), id, "recipe.json"), "utf8"));
  const parsed = RecipeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`invalid recipe ${id}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  if (parsed.data.id !== id) throw new Error(`invalid recipe ${id}: id is "${parsed.data.id}"`);
  return parsed.data;
}

export function listRecipes(): Recipe[] {
  return RECIPE_IDS.map(getRecipe);
}

export function recipeText(id: RecipeId, part: "script" | "build"): string {
  if (!isRecipeId(id)) throw new Error(`unknown recipe: ${id}`);
  return fs.readFileSync(path.join(recipesDir(), id, `${part}.md`), "utf8");
}
