import { test, expect } from "@playwright/test";

test("slideshow loads with 🙈 #B as the current slide", async ({ page }) => {
  await page.goto("/slideshow");

  // Current slide renders its caption as <b data-ref="bold-text">…</b>
  const current = page.locator(
    '#slideshow [data-component="slide"] [data-ref="bold-text"]',
  );
  await expect(current).toHaveText("🙈 #B");
  await expect(current).toBeVisible();
});
