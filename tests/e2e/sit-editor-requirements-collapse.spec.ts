import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { openCreateSitModal } from "./helpers/sitEditor";

test.describe("sit editor requirements collapse", () => {
  test("shows two rows of experience pills with a more badge that expands", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedVerifiedOwner(page);
    const editor = await openCreateSitModal(page);

    const experience = editor.getByTestId("sit-requirement-group-requiredExperience");
    await experience.scrollIntoViewIfNeeded();

    await expect(
      experience.getByRole("button", { name: "Sailing yacht", exact: true }),
    ).toBeVisible();
    await expect(
      experience.getByRole("button", { name: "Dinghy / outboard", exact: true }),
    ).toHaveCount(0);

    const more = experience.getByTestId("sit-requirement-group-more");
    await expect(more).toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(more).toHaveText(/\+\d+ more/);

    await more.click();
    await expect(
      experience.getByRole("button", { name: "Dinghy / outboard", exact: true }),
    ).toBeVisible();
    await expect(experience.getByTestId("sit-requirement-group-show-less")).toBeVisible();

    await experience.getByTestId("sit-requirement-group-show-less").click();
    await expect(
      experience.getByRole("button", { name: "Dinghy / outboard", exact: true }),
    ).toHaveCount(0);
    await expect(experience.getByTestId("sit-requirement-group-more")).toBeVisible();
  });

  test("collapses to two rows on mobile and expands practical skills", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedVerifiedOwner(page);
    const editor = await openCreateSitModal(page);

    const experience = editor.getByTestId("sit-requirement-group-requiredExperience");
    await experience.scrollIntoViewIfNeeded();

    const rowCount = await experience.evaluate((root) => {
      const visible = root.querySelector("[data-collapsible-pills-visible]");
      if (!visible) return -1;
      const buttons = [...visible.querySelectorAll("button")];
      const tops = new Set(buttons.map((btn) => Math.round(btn.getBoundingClientRect().top)));
      return tops.size;
    });
    expect(rowCount).toBeLessThanOrEqual(2);

    const skills = editor.getByTestId("sit-requirement-group-requiredSkills");
    await skills.scrollIntoViewIfNeeded();
    await expect(skills.getByTestId("sit-requirement-group-more")).toBeVisible();
    await skills.getByTestId("sit-requirement-group-more").click();
    await expect(skills.getByRole("button", { name: "Pet care", exact: true })).toBeVisible();
  });
});
