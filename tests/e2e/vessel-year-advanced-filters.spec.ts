import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";

test.describe("vessel year built and advanced boat filters", () => {
  test("owner can set year of manufacture or choose I don’t know", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/owner/boats/solstice/edit");

    await expect(page.getByText(/Year of manufacture/i)).toBeVisible();
    const yearInput = page.getByPlaceholder(/e\.g\. 2012/i);
    await yearInput.fill("1800");
    await page.getByRole("button", { name: /Save/i }).click();
    await expect(page.getByRole("alert")).toContainText(/between 1850/i);

    await page.getByLabel(/I don’t know|I don't know/i).check();
    await expect(yearInput).toBeDisabled();
    await page.getByRole("button", { name: /Save/i }).click();
    await expect(page).toHaveURL(/\/my-boats|\/owner\/boats/);
  });

  test("advanced filters narrow boats by length and year", async ({ page }) => {
    await page.goto("/boats");
    await page.getByRole("button", { name: /Advanced filters/i }).click();

    await page.getByLabel(/Min length/i).fill("20");
    await page.getByLabel(/Built from/i).fill("2000");
    await expect(page).toHaveURL(/minLength=/);
    await expect(page).toHaveURL(/yearFrom=2000/);

    await expect(page.getByText(/sit(s)? found/i).first()).toBeVisible();
    const empty = page.getByRole("heading", { name: /No boats on this tide/i });
    const cards = page.locator("article").filter({ has: page.getByRole("heading") });
    await expect(empty.or(cards.first())).toBeVisible();
  });

  test("pets and availability live under advanced filters", async ({ page }) => {
    await page.goto("/boats");

    await expect(page.getByRole("checkbox", { name: /Pets aboard/i })).toHaveCount(0);
    await expect(page.getByLabel(/Sit availability/i)).toHaveCount(0);

    await page.getByRole("button", { name: /Advanced filters/i }).click();
    const advanced = page.locator("#boats-advanced-filters");
    await expect(advanced.getByRole("checkbox", { name: /Pets aboard/i })).toBeVisible();
    await expect(advanced.getByLabel(/Sit availability/i)).toBeVisible();

    await advanced.getByRole("checkbox", { name: /Pets aboard/i }).check();
    await expect(page).toHaveURL(/pet=1|pet=true/);

    await advanced.getByLabel(/Sit availability/i).selectOption("open");
    await expect(page).toHaveURL(/availability=open/);
  });
});
