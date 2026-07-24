import { ownerSitActionsForPhase } from "../../src/react-app/ownerSitActions";

describe("ownerSitActionsForPhase", () => {
  it("returns phase-specific action sets", () => {
    expect(ownerSitActionsForPhase("acceptingApplicants")).toEqual([
      "viewListing",
      "edit",
      "delete",
    ]);
    expect(ownerSitActionsForPhase("applicantChosen")).toEqual(["edit", "delete"]);
    expect(ownerSitActionsForPhase("stayUnderway")).toEqual(["endEarly", "flag", "cancel"]);
    expect(ownerSitActionsForPhase("stayCompleted")).toEqual([]);
  });

  it("supports exclude options", () => {
    expect(ownerSitActionsForPhase("stayUnderway", { exclude: ["flag", "cancel"] })).toEqual([
      "endEarly",
    ]);
  });
});
