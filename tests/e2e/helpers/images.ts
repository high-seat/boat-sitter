import { expect, type Page } from "@playwright/test";

/** 1×1 PNG used for vessel cover uploads in e2e. */
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export async function uploadVesselCover(page: Page) {
  const input = page.getByTestId("vessel-cover-upload").locator('input[type="file"]');
  await input.setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: TINY_PNG,
  });
  await expect(page.getByTestId("vessel-cover-preview")).toBeVisible({ timeout: 20_000 });
}
