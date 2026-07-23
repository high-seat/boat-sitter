import { expect, test } from "@playwright/test";
import { seedVerifiedOwner } from "./helpers/auth";
import { openCreateSitModal } from "./helpers/sitEditor";

test.describe("sit editor character limits", () => {
  test("caps free-text fields and shows remaining count", async ({ page }) => {
    await seedVerifiedOwner(page);
    const editor = await openCreateSitModal(page);

    await editor.getByTestId("sit-use-normal-port-input").uncheck();
    const address = editor.getByTestId("sit-full-address-input");
    await address.fill("A".repeat(320));
    await expect(address).toHaveValue("A".repeat(300));
    await expect(editor.getByTestId("character-count").first()).toContainText(
      /0 characters? left/i,
    );

    const responsibilities = editor.getByTestId("sit-editor-responsibilities").locator("textarea");
    await responsibilities.fill("B".repeat(2001));
    await expect(responsibilities).toHaveValue("B".repeat(2000));

    const additional = editor.getByTestId("sit-editor-additional").locator("textarea");
    await additional.fill("C".repeat(1501));
    await expect(additional).toHaveValue("C".repeat(1500));

    const pets = editor.getByTestId("sit-editor-pets").locator("input");
    await pets.fill("D".repeat(201));
    await expect(pets).toHaveValue("D".repeat(200));
    await expect(
      editor.getByTestId("sit-editor-pets").getByTestId("character-count"),
    ).toContainText(/0 characters? left/i);
  });
});
