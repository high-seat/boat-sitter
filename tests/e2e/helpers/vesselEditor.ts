import type { Page } from "@playwright/test";

/** Pick a concrete vessel type (required on create; default is Not specified). */
export async function selectVesselType(page: Page, type: string = "Sailing yacht") {
  await page.getByTestId("vessel-type").selectOption(type);
}
