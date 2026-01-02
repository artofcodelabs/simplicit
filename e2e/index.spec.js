import { test, expect } from "@playwright/test";

test("clock interval is cleaned up when the clock element is removed", async ({
  page,
}) => {
  // Track active intervals in the page so we can assert they get cleared.
  await page.addInitScript(() => {
    const originalSetInterval = window.setInterval;
    const originalClearInterval = window.clearInterval;

    window.__intervalIds = new Set();

    window.setInterval = (handler, timeout, ...args) => {
      const id = originalSetInterval(handler, timeout, ...args);
      window.__intervalIds.add(id);
      return id;
    };

    window.clearInterval = (id) => {
      window.__intervalIds.delete(id);
      return originalClearInterval(id);
    };
  });

  await page.goto("/");

  const clock = page.locator('[data-component="clock"]').first();
  await expect(clock).toBeVisible();

  const before = await page.evaluate(() => window.__intervalIds.size);
  // One interval should be registered by the Clock component.
  expect(before).toBeGreaterThan(0);

  // Remove the clock element (Loco should disconnect and clear the interval).
  await clock.evaluate((el) => el.remove());

  // Give mutation observers / cleanup a tick.
  await page.waitForTimeout(50);

  const after = await page.evaluate(() => window.__intervalIds.size);
  expect(after).toBe(before - 1);
});

test("adding 2 clocks updates the clock count to 3", async ({ page }) => {
  await page.goto("/");

  const clocksCount = page.locator('[data-ref="clocks"]');
  const addClock = page.locator(
    '[data-component="clock-factory"] [data-ref="add-clock"]',
  );

  await addClock.click();
  await addClock.click();

  await expect(clocksCount).toHaveText("3");
});
