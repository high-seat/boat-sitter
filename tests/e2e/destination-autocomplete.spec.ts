import { expect, test } from "@playwright/test";
import { TOP_BOAT_SITTING_PORT_CITIES } from "../../src/shared/popularPortCities";

test.describe("destination autocomplete gazetteer", () => {
  test("searches world cities from the destinations API", async ({ page }) => {
    const api = await page.request.get("/api/destinations?q=Lefkada&kind=city&limit=5");
    expect(api.ok()).toBeTruthy();
    const body = await api.json();
    expect(body.data?.some((row: { name: string }) => row.name === "Lefkada")).toBeTruthy();

    await page.goto("/boats");
    const input = page.getByPlaceholder(/City or country/i).first();
    await expect(input).toBeVisible();
    await input.fill("Lefk");
    await expect(page.getByRole("option", { name: /Lefkada/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("lists countries from the destinations API", async ({ page }) => {
    const api = await page.request.get("/api/destinations?q=Croatia&kind=country&limit=5");
    expect(api.ok()).toBeTruthy();
    const body = await api.json();
    expect(
      body.data?.some((row: { name: string; kind: string }) => row.name === "Croatia"),
    ).toBeTruthy();

    await page.goto("/");
    const input = page.getByPlaceholder(/City or country/i).first();
    await expect(input).toBeVisible();
    await input.fill("Croa");
    await expect(page.getByRole("option", { name: /Croatia/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("opens with top port cities before typing", async ({ page }) => {
    const api = await page.request.get("/api/destinations?kind=all&limit=5");
    expect(api.ok()).toBeTruthy();
    const body = (await api.json()) as {
      data: Array<{ name: string; kind: string; detail: string }>;
    };
    expect(body.data).toHaveLength(TOP_BOAT_SITTING_PORT_CITIES.length);
    expect(body.data.every((row) => row.kind === "City")).toBeTruthy();
    expect(body.data.map((row) => row.name)).toEqual(
      TOP_BOAT_SITTING_PORT_CITIES.map((city) => city.name),
    );

    await page.goto("/boats");
    const input = page.getByPlaceholder(/City or country/i).first();
    await input.click();
    const list = page.getByTestId("destination-suggestions");
    await expect(list).toBeVisible({ timeout: 10_000 });
    for (const city of TOP_BOAT_SITTING_PORT_CITIES) {
      await expect(list.getByRole("option", { name: new RegExp(city.name, "i") })).toBeVisible();
    }
    const names = await list
      .getByTestId("destination-option-city")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.textContent?.replace(/\s+/g, " ").trim() ?? ""),
      );
    expect(names).toHaveLength(TOP_BOAT_SITTING_PORT_CITIES.length);
    expect(names[0]).toMatch(new RegExp(`^${TOP_BOAT_SITTING_PORT_CITIES[0].name}`));
  });

  test("returns countries before cities for mixed searches", async ({ page }) => {
    const api = await page.request.get("/api/destinations?q=Portu&kind=all&limit=12");
    expect(api.ok()).toBeTruthy();
    const body = (await api.json()) as {
      data: Array<{ name: string; kind: "City" | "Country" }>;
    };
    const kinds = body.data.map((row) => row.kind);
    const firstCity = kinds.indexOf("City");
    const lastCountry = kinds.lastIndexOf("Country");
    expect(kinds.includes("Country")).toBeTruthy();
    expect(kinds.includes("City")).toBeTruthy();
    expect(lastCountry).toBeLessThan(firstCity);

    await page.goto("/boats");
    const input = page.getByPlaceholder(/City or country/i).first();
    await input.click();
    await input.fill("Portu");
    const list = page.getByTestId("destination-suggestions");
    await expect(list).toBeVisible({ timeout: 10_000 });
    await expect(list.getByTestId("destination-option-country").first()).toBeVisible();
    await expect(list.getByTestId("destination-option-city").first()).toBeVisible();

    const optionKinds = await list
      .locator("[data-testid^='destination-option-']")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-testid")));
    const firstCityOption = optionKinds.findIndex((id) => id === "destination-option-city");
    const lastCountryOption = optionKinds.findLastIndex(
      (id) => id === "destination-option-country",
    );
    expect(lastCountryOption).toBeLessThan(firstCityOption);
  });

  test("keeps multi-select chips out of the text input", async ({ page }) => {
    await page.goto("/");
    const field = page.getByTestId("home-destination");
    const input = page.getByTestId("home-destination-input");
    await expect(input).toBeVisible();

    await input.click();
    await input.fill("Aust");
    await expect(page.getByRole("option", { name: /^Austria/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await page
      .getByRole("option", { name: /^Austria/i })
      .first()
      .click();
    const austriaChip = field.getByTestId("destination-chip").filter({ hasText: /^Austria$/ });
    await expect(austriaChip).toBeVisible();
    await expect(austriaChip).toHaveAttribute("data-destination-kind", "country");
    await expect(austriaChip.getByTestId("destination-chip-flag")).toBeVisible();
    await expect(austriaChip.getByTestId("destination-chip-flag")).toHaveAttribute(
      "src",
      /flagcdn\.com\/at\.svg/i,
    );
    await expect(input).toHaveValue("");

    await input.fill("Vien");
    await expect(page.getByRole("option", { name: /^Vienna/i }).first()).toBeVisible({
      timeout: 10_000,
    });
    await page
      .getByRole("option", { name: /^Vienna/i })
      .first()
      .click();
    const viennaChip = field.getByTestId("destination-chip").filter({ hasText: /^Vienna$/ });
    await expect(viennaChip).toBeVisible();
    await expect(viennaChip).toHaveAttribute("data-destination-kind", "city");
    await expect(viennaChip.getByTestId("destination-chip-flag")).toBeVisible();
    await expect(viennaChip.getByTestId("destination-chip-flag")).toHaveAttribute(
      "src",
      /flagcdn\.com\/at\.svg/i,
    );
    await expect(input).toHaveValue("");
    await expect(input).not.toHaveValue(/\|/);
  });

  test("shows country flags on city chips from the empty-state ports", async ({ page }) => {
    await page.goto("/");
    const field = page.getByTestId("home-destination");
    const input = page.getByTestId("home-destination-input");
    await input.click();
    const list = page.getByTestId("destination-suggestions");
    await expect(list).toBeVisible({ timeout: 10_000 });
    await list.getByRole("option", { name: /Lefkada/i }).click();
    await list.getByRole("option", { name: /Split/i }).click();

    const lefkada = field.getByTestId("destination-chip").filter({ hasText: /^Lefkada$/ });
    const split = field.getByTestId("destination-chip").filter({ hasText: /^Split$/ });
    await expect(lefkada.getByTestId("destination-chip-flag")).toHaveAttribute(
      "src",
      /flagcdn\.com\/gr\.svg/i,
    );
    await expect(split.getByTestId("destination-chip-flag")).toHaveAttribute(
      "src",
      /flagcdn\.com\/hr\.svg/i,
    );
  });
});
