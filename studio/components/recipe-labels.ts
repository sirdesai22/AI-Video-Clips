import type { RecipeId } from "@/lib/types";

/** Display names for the recent-videos list (the picker itself reads labels from /api/recipes). */
export const RECIPE_LABELS: Record<RecipeId, string> = {
  explainer: "Explainer",
  "product-launch": "Product launch",
  "motion-graphic": "Motion graphic",
  "data-story": "Data story",
  "pr-video": "PR video",
  custom: "Custom",
};
