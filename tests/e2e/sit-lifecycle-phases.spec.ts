import { expect, type Locator, type Page, test } from "@playwright/test";
import { seedOwnerSession, seedVerifiedOwner } from "./helpers/auth";
import { LIFECYCLE_APPLICATION_ID, LIFECYCLE_SIT_ID, seedLifecycleSit } from "./helpers/fixtures";

const PHASE_LABEL = {
  accepting: /Accepting applicants/i,
  accepted: /Applicant accepted/i,
  underway: /Sit underway/i,
  completed: /Sit completed/i,
} as const;

const PHASE_SECTION = {
  accepting: "acceptingApplicants",
  accepted: "applicantChosen",
  underway: "stayUnderway",
  completed: "stayCompleted",
} as const;

const PHASE_BADGE = {
  accepting: /^Accepting applicants$/i,
  accepted: /^Applicant accepted$/i,
  underway: /^Sit underway$/i,
  completed: /^Sit completed$/i,
} as const;

function lifecycleOwnerCard(page: Page) {
  return page.getByTestId(`owner-sit-card-${LIFECYCLE_SIT_ID}`);
}

function lifecycleSitterCard(page: Page) {
  return page.getByTestId(`sitter-sit-card-${LIFECYCLE_SIT_ID}`);
}

async function expectOwnerPhaseSection(page: Page, phase: keyof typeof PHASE_SECTION) {
  const section = page.getByTestId(`owner-sits-phase-${PHASE_SECTION[phase]}`);
  await expect(section).toBeVisible();
  await expect(section.getByTestId(`owner-sit-card-${LIFECYCLE_SIT_ID}`)).toBeVisible();
  for (const [other, id] of Object.entries(PHASE_SECTION)) {
    if (other === phase) continue;
    await expect(
      page.getByTestId(`owner-sits-phase-${id}`).getByTestId(`owner-sit-card-${LIFECYCLE_SIT_ID}`),
    ).toHaveCount(0);
  }
}

async function expectSitterPhaseOn(locator: Locator, phase: keyof typeof PHASE_BADGE) {
  await expect(locator.getByText(PHASE_BADGE[phase])).toBeVisible();
  for (const [other, label] of Object.entries(PHASE_BADGE)) {
    if (other === phase) continue;
    await expect(locator.getByText(label)).toHaveCount(0);
  }
}

async function expectOwnerApplicationsPhase(page: Page, phase: keyof typeof PHASE_LABEL) {
  await page.goto(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`);
  if (phase === "underway" || phase === "completed") {
    await expect(page.getByRole("heading", { name: /Sit with Alex Morgan/i })).toBeVisible();
    await expect(page.getByTestId("active-sit-chat")).toBeVisible();
    await expect(page.getByTestId("application-applicant-list")).toHaveCount(0);
  } else {
    await expect(page.getByRole("heading", { name: /Applications for/i })).toBeVisible();
  }
  const currentStep = page.getByRole("listitem").filter({ hasText: PHASE_LABEL[phase] });
  await expect(currentStep).toBeVisible();
  await expect(currentStep).toHaveClass(/bg-seafoam/);
}

test.describe("sit lifecycle phase transitions", () => {
  test("owner and sitter see every phase as the sit advances", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    await seedVerifiedOwner(ownerPage);
    await seedLifecycleSit(ownerPage, "accepting");

    const sitterContext = await browser.newContext();
    const sitterPage = await sitterContext.newPage();
    await seedOwnerSession(sitterPage, {
      name: "Alex Morgan",
      email: "alex.morgan@boatstead.mock",
      image: "https://i.pravatar.cc/160?img=11",
      phoneNumber: "7700900123",
      verified: true,
    });

    // 1) Accepting applicants
    await ownerPage.goto("/my-sits");
    await expectOwnerPhaseSection(ownerPage, "accepting");
    await expectOwnerApplicationsPhase(ownerPage, "accepting");

    await sitterPage.goto("/my-sits");
    const sitterAccepting = lifecycleSitterCard(sitterPage);
    await expect(sitterPage.getByTestId("sitter-sits-phase-acceptingApplicants")).toBeVisible();
    await expect(
      sitterPage
        .getByTestId("sitter-sits-phase-acceptingApplicants")
        .getByTestId(`sitter-sit-card-${LIFECYCLE_SIT_ID}`),
    ).toBeVisible();
    await expectSitterPhaseOn(sitterAccepting, "accepting");
    await expect(sitterAccepting.getByText(/^New$/i)).toBeVisible();

    // 2) Owner accepts → Applicant accepted
    await ownerPage.goto(`/owner/sits/${LIFECYCLE_SIT_ID}/applications`);
    await ownerPage
      .getByRole("button", { name: /Alex Morgan/i })
      .first()
      .click();
    await expect(ownerPage.getByRole("heading", { name: "Alex Morgan" })).toBeVisible();
    await ownerPage.getByRole("button", { name: /^Accept$/i }).click();
    const dialog = ownerPage.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Accept Alex/i })).toBeVisible();
    await dialog.getByRole("button", { name: /Yes, accept/i }).click();
    await expect(ownerPage.getByText(PHASE_LABEL.accepted).first()).toBeVisible();

    await ownerPage.goto("/my-sits");
    await expectOwnerPhaseSection(ownerPage, "accepted");

    await sitterPage.goto("/my-sits");
    const sitterAccepted = lifecycleSitterCard(sitterPage);
    await expect(
      sitterPage
        .getByTestId("sitter-sits-phase-applicantChosen")
        .getByTestId(`sitter-sit-card-${LIFECYCLE_SIT_ID}`),
    ).toBeVisible();
    await expectSitterPhaseOn(sitterAccepted, "accepted");
    await expect(sitterAccepted.getByText(/^Accepted$/i)).toBeVisible();

    await expectOwnerApplicationsPhase(ownerPage, "accepted");

    // 3) Dates advance → Sit underway
    await seedLifecycleSit(ownerPage, "underway");
    await ownerPage.goto("/my-sits");
    await expectOwnerPhaseSection(ownerPage, "underway");
    await expect(lifecycleOwnerCard(ownerPage).getByTestId("sit-emergency-help")).toBeVisible();

    await sitterPage.goto("/my-sits");
    const sitterUnderway = lifecycleSitterCard(sitterPage);
    await expect(
      sitterPage
        .getByTestId("sitter-sits-phase-stayUnderway")
        .getByTestId(`sitter-sit-card-${LIFECYCLE_SIT_ID}`),
    ).toBeVisible();
    await expectSitterPhaseOn(sitterUnderway, "underway");
    await expect(sitterUnderway.getByTestId("sit-emergency-help")).toBeVisible();
    await expect(sitterUnderway.getByTestId(`sitter-sit-withdraw-${LIFECYCLE_SIT_ID}`)).toHaveCount(
      0,
    );

    await expectOwnerApplicationsPhase(ownerPage, "underway");
    await sitterPage.goto(`/messages?application=${LIFECYCLE_APPLICATION_ID}`);
    await expect(sitterPage.getByTestId("conversation-messages")).toBeVisible();
    await expect(sitterPage.getByTestId("sit-emergency-help")).toHaveCount(0);

    // 4) Dates advance → Sit completed
    await seedLifecycleSit(ownerPage, "completed");
    await ownerPage.goto("/my-sits");
    await expectOwnerPhaseSection(ownerPage, "completed");

    await sitterPage.goto("/my-sits");
    const sitterCompleted = lifecycleSitterCard(sitterPage);
    await expect(
      sitterPage
        .getByTestId("sitter-sits-phase-stayCompleted")
        .getByTestId(`sitter-sit-card-${LIFECYCLE_SIT_ID}`),
    ).toBeVisible();
    await expectSitterPhaseOn(sitterCompleted, "completed");
    await expect(sitterCompleted.getByTestId("sit-emergency-help")).toHaveCount(0);

    await expectOwnerApplicationsPhase(ownerPage, "completed");

    await ownerContext.close();
    await sitterContext.close();
  });
});
