import { expect, type Locator, type Page } from "@playwright/test";

export function sitEditorPage(page: Page) {
  return page.locator("main").filter({
    has: page.getByRole("heading", { name: /Create a boat sit|Edit boat sit/i }),
  });
}

/** @deprecated Prefer sitEditorPage — kept as alias while specs migrate. */
export function sitEditorModal(page: Page) {
  return sitEditorPage(page);
}

export async function openCreateSitModal(page: Page) {
  await page.goto("/owner/boats");
  await expect(page.getByRole("heading", { name: /Manage boats/i })).toBeVisible();

  // Wait until owned vessels are loaded so Create opens the sit editor, not Add a boat.
  const boatsTab = page.getByRole("button", { name: /^Boats/i });
  await expect(boatsTab).toBeVisible();
  await expect
    .poll(async () => {
      const label = await boatsTab.innerText();
      const match = label.match(/(\d+)/);
      return match ? Number(match[1]) : 0;
    })
    .toBeGreaterThan(0);

  const sitsTab = page.getByRole("button", { name: /^Sits/i });
  await sitsTab.click();
  await page.getByRole("button", { name: /Create a sit/i }).click();
  await expect(page).toHaveURL(/\/owner\/sits\/new/);
  const editor = sitEditorPage(page);
  await expect(editor.getByRole("heading", { name: /Create a boat sit/i })).toBeVisible({
    timeout: 10_000,
  });
  return editor;
}

/** Selects a future date range in the sit editor DateRangePicker. */
export async function pickFutureSitDates(modal: Locator, page: Page) {
  await modal.getByRole("button", { name: /Any dates/i }).click();
  await expect(page.getByText(/When can you boat sit/i)).toBeVisible();

  const calendar = page.locator(".boatstead-rdp");
  await expect(calendar).toBeVisible();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const toIso = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  async function selectDay(iso: string) {
    const cell = calendar.locator(`[data-day="${iso}"]:not([data-disabled])`);
    if ((await cell.count()) === 0) {
      await page.getByRole("button", { name: /Go to the Next Month|next month/i }).click();
    }
    await expect(calendar.locator(`[data-day="${iso}"]:not([data-disabled])`)).toBeVisible();
    await calendar.locator(`[data-day="${iso}"] button`).click();
  }

  await selectDay(toIso(start));
  await selectDay(toIso(end));

  await expect(modal.getByRole("button", { name: /Any dates/i })).toHaveCount(0);
}

export async function acceptSitTerms(modal: Locator) {
  const checkbox = modal.locator('label:has(a[href="/terms"]) input[type="checkbox"]');
  await checkbox.scrollIntoViewIfNeeded();
  await checkbox.check();
}

export async function fillMinimalCreateSitForm(
  modal: Locator,
  page: Page,
  options?: {
    sitType?: "liveaboard" | "daytimeChecks";
    responsibilities?: string;
    maxGuests?: number;
    fullAddress?: string;
  },
) {
  const sitType = options?.sitType ?? "liveaboard";
  if (sitType === "daytimeChecks") {
    await modal.getByRole("radio", { name: /Daytime checks/i }).check();
  } else {
    await modal.getByRole("radio", { name: /Accommodation/i }).check();
  }

  await pickFutureSitDates(modal, page);

  await modal
    .getByPlaceholder(/Street, marina berth|Straße|marina/i)
    .fill(options?.fullAddress ?? "Berth A4, Demo Marina, Harbor Road 12");

  const maxGuests = modal.locator('input[type="number"]');
  await maxGuests.fill(String(options?.maxGuests ?? 2));

  const responsibilities =
    options?.responsibilities ??
    "Daily bilge check\nBattery and shore power check\nLine and fender inspection";
  await modal
    .getByPlaceholder(/One task per line|Jeden Morgen|Eine Aufgabe/i)
    .fill(responsibilities);

  await acceptSitTerms(modal);
}

export async function publishSit(modal: Locator) {
  await modal.getByRole("button", { name: /Publish sit/i }).click();
}
