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

test("slideshow next/prev arrows change the current slide", async ({
  page,
}) => {
  await page.goto("/slideshow");

  const current = page.locator(
    '#slideshow [data-component="slide"] [data-ref="bold-text"]',
  );
  const prev = page.locator('#slideshow button[data-ref="previous"]');
  const next = page.locator('#slideshow button[data-ref="next"]');

  await expect(current).toHaveText("🙈 #B");

  await next.click();
  await expect(current).toHaveText("🙉 #C");

  await prev.click();
  await expect(current).toHaveText("🙈 #B");

  await prev.click();
  await expect(current).toHaveText("🐵 #A");

  await prev.click();
  await expect(current).toHaveText("🙊 #D");

  await next.click();
  await expect(current).toHaveText("🐵 #A");
});
