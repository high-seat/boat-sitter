import type { SitPhase } from "@/dateUtils";

/** Owner sit overflow-menu actions, ordered for display. */
export type OwnerSitActionId = "viewListing" | "edit" | "endEarly" | "flag" | "cancel" | "delete";

/**
 * Actions available for a sit in the owner ellipsis menu.
 * Defined once per phase and shared by My sits cards and sit details.
 *
 * "View listing" is only offered while the sit is still public
 * (accepting applicants). Accepting a sitter unpublishes the listing.
 */
export function ownerSitActionsForPhase(
  phase: SitPhase,
  options: { exclude?: readonly OwnerSitActionId[] } = {},
): OwnerSitActionId[] {
  let actions: OwnerSitActionId[];
  if (phase === "stayUnderway") {
    actions = ["endEarly", "flag", "cancel"];
  } else if (phase === "stayCompleted") {
    actions = [];
  } else if (phase === "applicantChosen") {
    actions = ["edit", "delete"];
  } else {
    // acceptingApplicants — listing is still public
    actions = ["viewListing", "edit", "delete"];
  }

  if (!options.exclude?.length) return actions;
  const excluded = new Set(options.exclude);
  return actions.filter((action) => !excluded.has(action));
}
