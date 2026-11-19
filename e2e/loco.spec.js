import { test, expect } from "@playwright/test";

// The /loco page needs the sibling loco-js-model build (see dev/server.js).
const card = (page, title) =>
  page.locator('[data-component="article-card"]', { hasText: title });

test("loco page renders the seeded articles from the API", async ({ page }) => {
  await page.goto("/loco");

  await expect(page.locator("#status")).toHaveText(/loaded \d+ from API/);
  await expect(card(page, "Simplicit is tiny")).toBeVisible();
  await expect(card(page, "Models drive views")).toBeVisible();
});

test("loco page rejects an invalid title before hitting the API", async ({
  page,
}) => {
  await page.goto("/loco");
  await expect(page.locator("#status")).toHaveText(/loaded \d+ from API/);

  const form = page.locator('[data-component="article-new"]');
  await form.locator('[data-ref="title"]').fill("ab");
  await form.locator("button", { hasText: "Create" }).click();

  await expect(form.locator('[data-ref="errors"]')).toContainText("Title");
  await expect(page.locator("#status")).toHaveText(/loaded \d+ from API/);
});

test("loco page does full CRUD through loco-js-model", async ({ page }) => {
  await page.goto("/loco");
  await expect(page.locator("#status")).toHaveText(/loaded \d+ from API/);

  const title = `E2E article ${Date.now()}`;
  const form = page.locator('[data-component="article-new"]');

  // CREATE
  await form.locator('[data-ref="title"]').fill(title);
  await form.locator('[data-ref="body"]').fill("created by playwright");
  await form.locator("button", { hasText: "Create" }).click();

  await expect(page.locator("#status")).toHaveText(/created #\d+/);
  const created = card(page, title);
  await expect(created).toBeVisible();
  await expect(created).toContainText("created by playwright");
  await expect(form.locator('[data-ref="title"]')).toHaveValue("");

  // UPDATE
  const renamed = `${title} (renamed)`;
  await created
    .locator('form[data-ref="rename"] [data-ref="title"]')
    .fill(renamed);
  await created.locator("button", { hasText: "Save (PUT)" }).click();

  await expect(page.locator("#status")).toHaveText(/updated #\d+/);
  await expect(card(page, renamed)).toBeVisible();

  // UPDATE is rejected when invalid — no PUT, model keeps its title
  const invalid = card(page, renamed);
  await invalid
    .locator('form[data-ref="rename"] [data-ref="title"]')
    .fill("ab");
  await invalid.locator("button", { hasText: "Save (PUT)" }).click();
  await expect(page.locator("#status")).toHaveText(/invalid: title/);
  await expect(card(page, renamed)).toBeVisible();

  // DELETE
  await card(page, renamed).locator('[data-ref="delete"]').click();
  await expect(page.locator("#status")).toHaveText(/deleted #\d+/);
  await expect(card(page, renamed)).toHaveCount(0);

  // …and it stays deleted on the server.
  await page
    .locator('[data-component="article-new"] [data-ref="refetch"]')
    .click();
  await expect(page.locator("#status")).toHaveText(/loaded \d+ from API/);
  await expect(card(page, renamed)).toHaveCount(0);
});
