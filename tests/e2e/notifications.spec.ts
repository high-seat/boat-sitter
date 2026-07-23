import { expect, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";

test.describe("notifications menu", () => {
  test("shows a shimmer while notifications load", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.addInitScript(() => {
      localStorage.setItem("boatstead-e2e-notification-delay-ms", "8000");
    });

    await page.goto("/");
    // Open before the delayed notifications query settles (also started by the messages badge).
    await page.getByTestId("notifications-open").first().click();

    const menu = page.getByTestId("notifications-menu");
    await expect(menu).toBeVisible();
    const skeleton = menu.locator('[aria-busy="true"]');
    await expect(skeleton).toBeVisible();
    await expect.poll(async () => skeleton.locator(".shimmer").count()).toBeGreaterThanOrEqual(8);

    await expect(menu.getByRole("menuitem").first()).toBeVisible({ timeout: 15_000 });
    await expect(skeleton).toHaveCount(0);
  });

  test("lists notifications and marks them read", async ({ page }) => {
    // Fresh account so the unread welcome notification is deterministic.
    await seedOwnerSession(page, {
      name: "Notify Reader",
      email: "notify.reader@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=15",
      phoneNumber: "6911112244",
      verified: true,
    });
    await page.goto("/");

    const open = page.getByTestId("notifications-open").first();
    await expect(open).toBeVisible();
    await expect(page.getByTestId("notifications-unread-count").first()).toBeVisible();
    await open.click();

    const menu = page.getByTestId("notifications-menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitem").first()).toBeVisible();

    await menu.getByRole("button", { name: /Mark all as read/i }).click();
    await expect(page.getByTestId("notifications-unread-count")).toHaveCount(0);
  });

  test("welcome notification opens the edit profile screen", async ({ page }) => {
    await seedOwnerSession(page, {
      name: "Casey Newmember",
      email: "casey.newmember@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=12",
      phoneNumber: "6911112233",
      verified: true,
    });
    await page.goto("/");

    await page.getByTestId("notifications-open").first().click();
    const menu = page.getByTestId("notifications-menu");
    await expect(menu).toBeVisible();

    const welcome = menu.getByRole("menuitem", {
      name: /Welcome to Boatstead\. Complete your profile/i,
    });
    await expect(welcome).toBeVisible();
    await welcome.click();

    await expect(page).toHaveURL(/\/members\/me\?edit=1/);
    await expect(page.getByRole("heading", { name: /^Edit profile$/i })).toBeVisible();
  });

  test("stays fully inside the viewport on mobile", async ({ page }) => {
    await seedVerifiedOwner(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Mobile header mounts the second notifications control; desktop one is hidden.
    await page.getByTestId("notifications-open").last().click();
    const menu = page.getByTestId("notifications-menu");
    await expect(menu).toBeVisible();

    const box = await menu.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
  });
});
