import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";

test.describe("messages chat avatar", () => {
  test("shows profile photos in the conversation list and open thread", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();
    await expect(page.getByTestId("messages-conversation-list")).toBeVisible({ timeout: 15_000 });

    const list = page.getByTestId("messages-conversation-list");
    const firstRow = list.locator("[data-testid^='conversation-row-']").first();
    await expect(firstRow).toBeVisible();
    const applicationId = (await firstRow.getAttribute("data-testid"))!.replace(
      "conversation-row-",
      "",
    );
    const listAvatar = page.getByTestId(`conversation-row-avatar-${applicationId}`);
    await expect(listAvatar).toBeVisible();
    await expect(listAvatar).toHaveAttribute("src", /pravatar\.cc|unsplash|cloudflare|images\./i);
    await expect(listAvatar).not.toHaveAttribute("src", /dicebear.*initials/i);

    await firstRow.getByRole("button").first().click();
    await expect(page.getByTestId("conversation-messages")).toBeVisible();

    const headerAvatar = page
      .getByRole("link", { name: /View profile/i })
      .first()
      .locator("img");
    await expect(headerAvatar).toHaveAttribute("src", /pravatar\.cc|unsplash|cloudflare|images\./i);
    await expect(headerAvatar).not.toHaveAttribute("src", /dicebear.*initials/i);
  });

  test("shows the owner profile photo when the sitter opens the thread", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    await page.goto("/messages");
    await expect(page.getByRole("heading", { name: /Messages/i })).toBeVisible();
    await expect(page.getByTestId("messages-conversation-list")).toBeVisible({ timeout: 15_000 });

    const ownerRow = page.getByTestId("conversation-row-application-alex-solstice");
    await expect(ownerRow).toBeVisible();
    const listAvatar = page.getByTestId("conversation-row-avatar-application-alex-solstice");
    await expect(listAvatar).toBeVisible();
    await expect(listAvatar).toHaveAttribute("src", /pravatar\.cc|unsplash|cloudflare|images\./i);
    await expect(listAvatar).not.toHaveAttribute("src", /dicebear.*initials/i);

    await ownerRow.getByRole("button").first().click();
    await expect(page.getByRole("link", { name: /^Maya/i })).toBeVisible();

    const avatar = page
      .getByRole("link", { name: /View profile/i })
      .first()
      .locator("img");
    await expect(avatar).toHaveAttribute("src", /pravatar\.cc|unsplash|cloudflare|images\./i);
    await expect(avatar).not.toHaveAttribute("src", /dicebear.*initials/i);
  });
});
