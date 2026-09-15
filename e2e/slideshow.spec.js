import { test, expect } from "@playwright/test";

test("slideshow loads with 🙈 #B as the current slide", async ({ page }) => {
  await page.goto("/slideshow");

  // Current slide renders its caption as <b data-ref="bold-text">…</b>
  const current = page.locator(
    '[data-component="slideshow"] div[data-component="slide"] [data-ref="bold-text"]',
  );
  await expect(current).toHaveText("🙈 #B");
  await expect(current).toBeVisible();
});

test("slideshow next/prev arrows change the current slide", async ({
  page,
}) => {
  await page.goto("/slideshow");

  const current = page.locator(
    '[data-component="slideshow"] div[data-component="slide"] [data-ref="bold-text"]',
  );
  const prev = page.locator(
    '[data-component="slideshow"] button[data-ref="previous"]',
  );
  const next = page.locator(
    '[data-component="slideshow"] button[data-ref="next"]',
  );

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

test("slideshow manager flow: add/show/manage/delete/edit/navigate", async ({
  page,
}) => {
  await page.goto("/slideshow");

  const current = page.locator(
    '[data-component="slideshow"] div[data-component="slide"] [data-ref="bold-text"]',
  );
  const prev = page.locator(
    '[data-component="slideshow"] button[data-ref="previous"]',
  );
  const next = page.locator(
    '[data-component="slideshow"] button[data-ref="next"]',
  );

  const manager = page.locator('[data-component="slideshow-manager"]');
  const addSlide = manager.locator('button[data-ref="add-slide"]');
  const showSlides = manager.locator('button[data-ref="show-slides"]');
  const manageSlides = manager.locator('button[data-ref="manage-slides"]');

  // Initial setup: 🙈 #B is current (bold).
  await expect(current).toHaveText("🙈 #B");

  // 1) Add new slide
  await addSlide.click();

  // 2) Show slides -> there should be 5 visible slides
  await showSlides.click();
  await expect(
    page.locator(
      '[data-component="slideshow"] div[data-component="slide"]:visible',
    ),
  ).toHaveCount(5);
  // Ensure the newly added slide is the last slide.
  await expect(
    page
      .locator(
        '[data-component="slideshow"] div[data-component="slide"]:visible',
      )
      .last()
      .locator('[data-ref="caption"], [data-ref="bold-text"]'),
  ).toContainText("🐒 #5");

  // 3) Enable management
  await manageSlides.click();

  // 4) Delete slide 🙊 #D
  const slideD = page.locator(
    '[data-component="slideshow"] div[data-component="slide"]',
    {
      hasText: "🙊 #D",
    },
  );
  await slideD.locator('[data-ref="delete"]').click();
  await expect(slideD).toHaveCount(0);
  await expect(
    page.locator('[data-component="slideshow"] div[data-component="slide"]'),
  ).toHaveCount(4);

  // 5) Edit slide 🙉 #C -> 🙉 #CODE
  const slideC = page.locator(
    '[data-component="slideshow"] div[data-component="slide"]',
    {
      hasText: "🙉 #C",
    },
  );
  await expect(slideC.locator('[data-ref="delete"]')).toBeVisible();
  await expect(slideC.locator('[data-ref="caption"]')).toHaveCSS(
    "cursor",
    "pointer",
  );
  await slideC.locator('[data-ref="caption"]').click();
  // Once caption is removed, the slide's text no longer matches "🙉 #C",
  // so locate the edit input globally (only one slide can be edited at a time).
  const editInput = page.locator(
    '[data-component="slideshow"] [data-ref="edit"]',
  );
  await expect(editInput).toBeVisible();
  await editInput.fill("🙉 #CODE");
  await editInput.press("Enter");
  await expect(
    page.locator('[data-component="slideshow"] [data-ref="caption"]', {
      hasText: "🙉 #CODE",
    }),
  ).toBeVisible();

  // 6) Click next arrow 2 times to go to #CODE as current (bold).
  // The app starts on 🙈 #B; to make "next x2" land on 🙉 #CODE we first go to 🐵 #A.
  await prev.click();
  await expect(current).toHaveText("🐵 #A");
  await next.click();
  await next.click();
  await expect(current).toHaveText("🙉 #CODE");

  // 7) Disable management
  await manageSlides.click();
  await expect(
    page.locator(
      '[data-component="slideshow"] div[data-component="slide"] [data-ref="delete"]:not([hidden])',
    ),
  ).toHaveCount(0);

  // 8) Click next 2 times to have slide 🐵 #A as current
  await next.click();
  await next.click();
  await expect(current).toHaveText("🐵 #A");

  // Hide slides -> only the current slide should remain visible (🐵 #A).
  const hideSlides = manager.locator('button[data-ref="hide-slides"]');
  await hideSlides.click();
  await expect(
    page.locator(
      '[data-component="slideshow"] div[data-component="slide"]:visible',
    ),
  ).toHaveCount(1);
  await expect(current).toHaveText("🐵 #A");
});
