import { test, expect } from "@playwright/test";

const card = (page, id) =>
  page.locator(`[data-component="article-card"][data-key="${id}"]`);

const comment = (card, id) => card.locator(`li[data-key="${id}"]`);

test("nested comments keep their own state across parent re-renders", async ({
  page,
}) => {
  await page.goto("/nested");
  const first = card(page, 1);
  const c1 = comment(first, 1);

  // Child-owned state, and child → parent via this.parent.
  await c1.locator('[data-ref="like"]').click();
  await c1.locator('[data-ref="like"]').click();
  await expect(c1.locator('[data-ref="like"]')).toHaveText("👍 2");
  await expect(first.locator('[data-ref="last-liked"]')).toHaveText(
    "Last liked: Love how small it is.",
  );

  // Parent re-render keeps the child's likes.
  await first.locator('[data-ref="title"]').fill("Renamed");
  await first.locator("button", { hasText: "Rename" }).click();
  await expect(first.locator("h4")).toHaveText("Renamed");
  await expect(c1.locator('[data-ref="like"]')).toHaveText("👍 2");

  // Parent props flow down through toHTML; likes still kept.
  await first.locator('[data-ref="loud"]').check();
  await expect(c1).toContainText("LOVE HOW SMALL IT IS.");
  await expect(c1.locator('[data-ref="like"]')).toHaveText("👍 2");
});

test("adding a comment mounts a new nested child", async ({ page }) => {
  await page.goto("/nested");
  const third = card(page, 3);

  await third.locator('[data-ref="add-comment"]').click();
  const added = comment(third, 1);
  await expect(added).toContainText("New comment.");

  // Bound as a live instance: its own like button works.
  await added.locator('[data-ref="like"]').click();
  await expect(added.locator('[data-ref="like"]')).toHaveText("👍 1");
});

test("deleting swaps the row to a different component", async ({ page }) => {
  await page.goto("/nested");
  const first = card(page, 1);

  await comment(first, 2).locator('[data-ref="delete"]').click();

  const row = comment(first, 2);
  await expect(row).toHaveAttribute("data-component", "deleted-comment");
  await expect(row).toHaveText("comment deleted");
  expect(await row.evaluate((el) => el.instance?.constructor.name)).toBe(
    "deleted-comment",
  );
});
