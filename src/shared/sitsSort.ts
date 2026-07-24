/**
 * Sort options for accepting-applicants sits on GET /api/sits.
 * Other sit phases stay chronological by start date in the owner list UI.
 */

export const SIT_LIST_SORTS = ["soonest", "mostApplicants", "latest"] as const;

export type SitListSort = (typeof SIT_LIST_SORTS)[number];

export const DEFAULT_SIT_LIST_SORT: SitListSort = "soonest";

export function parseSitListSort(raw: string | undefined | null): SitListSort {
  if (raw === "soonest" || raw === "mostApplicants" || raw === "latest") {
    return raw;
  }
  return DEFAULT_SIT_LIST_SORT;
}
