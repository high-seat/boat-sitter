import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("i18nextLng", "en-US");
    localStorage.setItem(
      "harbourly",
      JSON.stringify({
        state: {
          saved: [],
          user: {
            name: "Alex Morgan",
            image: "https://i.pravatar.cc/160?img=11",
            bio: "Experienced boat sitter",
            location: "Brighton, United Kingdom",
            languages: ["English"],
            preferredCountries: [],
            skills: ["Line handling"],
            preferredLanguage: "en-US",
            measurementSystem: "metric",
            timeFormat: "24h",
          },
        },
        version: 3,
      }),
    );
  });
});

test("listing modal stays above the map", async ({ page }) => {
  // Use an open listing this seeded sitter has not already applied to.
  await page.goto("/boats/little-wren");

  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible();
  await map.scrollIntoViewIfNeeded();

  await page
    .getByRole("button", { name: "Apply to boat sit" })
    .evaluate((button: HTMLButtonElement) => button.click());

  const modalHeading = page.getByRole("heading", { name: "Apply for Little Wren" });
  await expect(modalHeading).toBeVisible();

  const stacking = await page.evaluate(() => {
    const mapElement = document.querySelector<HTMLElement>(".leaflet-container");
    const modal = [...document.querySelectorAll<HTMLElement>("div.fixed.inset-0")].find((element) =>
      element.textContent?.includes("Apply for Little Wren"),
    );

    if (!mapElement || !modal) {
      return { modalOnTop: false, mapOnTop: false, topElement: "missing test element" };
    }

    const mapBounds = mapElement.getBoundingClientRect();
    const x = Math.max(1, Math.min(window.innerWidth - 2, mapBounds.left + 24));
    const y = Math.max(1, Math.min(window.innerHeight - 2, mapBounds.top + 24));
    const topElement = document.elementFromPoint(x, y);

    return {
      modalOnTop: Boolean(topElement && modal.contains(topElement)),
      mapOnTop: Boolean(topElement && mapElement.contains(topElement)),
      topElement:
        topElement instanceof HTMLElement
          ? `${topElement.tagName.toLowerCase()}.${topElement.className}`
          : String(topElement),
    };
  });

  expect(
    stacking.modalOnTop,
    `Expected the modal backdrop above the map, but the top element was ${stacking.topElement}`,
  ).toBe(true);
  expect(stacking.mapOnTop, "The Leaflet map must not cover an open modal").toBe(false);
});
