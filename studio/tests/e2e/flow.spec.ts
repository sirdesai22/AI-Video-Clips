import { test, expect } from "@playwright/test";

test("reel: script → edit → approve → result → change", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("radio", { name: /Reel/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Audience", { exact: true })).toBeHidden();
  await expect(page.getByRole("radio", { name: /Explainer/ })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: /Explainer/ }).click();
  await page.getByText("More options").click();
  await expect(page.getByText("Audience", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: /about/ }).fill("https://www.highagency.com/");
  await page.getByRole("button", { name: "Write script" }).click();

  await expect(page.getByRole("heading", { name: "The 59 seconds that made flight" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Scene 1 · hook")).toBeVisible();
  await expect(page.getByRole("region", { name: "Look" }).getByTestId("swatch")).toHaveCount(3);

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Scene 5 on screen").fill("You can learn it");
  await page.getByLabel("Accent").fill("#112233");
  await page.getByRole("button", { name: "Save edits" }).click();
  await expect(page.getByText(/· v2$/)).toBeVisible();
  await expect(page.getByText("#112233", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Approve & make video" }).click();
  // The HeyGen auth check can take many seconds: wait for the warning card or the progress screen.
  const noMusic = page.getByRole("button", { name: "Build without music" });
  const progress = page.getByText(/Recording voice|Building scenes|Rendering|Waiting|Writing/).first();
  await expect(noMusic.or(progress)).toBeVisible({ timeout: 60_000 });
  if (await noMusic.isVisible()) {
    await noMusic.click();
    await expect(progress).toBeVisible({ timeout: 30_000 });
  }
  await expect(page.locator("video")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute("href", /\/api\/media\/\w+\/v1\.mp4/);

  await page.getByPlaceholder(/slower ending/).fill("slower ending");
  await page.getByRole("button", { name: "Make this change" }).click();
  await expect(page.getByRole("link", { name: "Download" })).toHaveAttribute("href", /v2\.mp4/, { timeout: 60_000 });
});
