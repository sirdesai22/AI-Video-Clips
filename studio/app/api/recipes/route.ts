import { listRecipes } from "@/lib/recipes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The recipes for the type picker. Story and build text stay on the server. */
export function GET() {
  return Response.json({ recipes: listRecipes() });
}
