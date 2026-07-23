import { expect, test } from "@playwright/test";
import { seedOwnerSession } from "./helpers/auth";
import { seedDevFixture } from "./helpers/fixtures";

test.describe("saved listings filter", () => {
  test("show-all checkbox switches open vs all saved listings", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
    });

    // Mark Solstice accepted (hides from "open" filter) and save it for Alex.
    const maya = await page.context().browser()!.newContext();
    const mayaPage = await maya.newPage();
    await seedOwnerSession(mayaPage, {
      name: "Maya & Finn",
      email: "maya.finn@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=5",
      phoneNumber: "6912345678",
    });
    await seedDevFixture(mayaPage, "accept-solstice");
    await maya.close();

    await page.request.put("/api/prefs/saved/solstice");
    await page.goto("/saved");
    await expect(page.getByRole("heading", { name: /Saved boat sits/i })).toBeVisible();

    const checkbox = page.getByLabel(/Show all including sitter chosen/i);
    await expect(checkbox).not.toBeChecked();
    await expect(page.getByRole("heading", { name: /No open saved sits/i })).toBeVisible();

    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await expect(page.getByText(/^Solstice$/i).first()).toBeVisible();

    await checkbox.uncheck();
    await expect(page.getByRole("heading", { name: /No open saved sits/i })).toBeVisible();
  });
});
