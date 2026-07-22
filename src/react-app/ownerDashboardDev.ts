export type OwnerDashboardTab = "boats" | "sits";

const STORAGE_KEY = "boatstead-owner-dashboard-tab";

export function getOwnerDashboardTab(): OwnerDashboardTab {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "boats" ? "boats" : "sits";
  } catch {
    return "sits";
  }
}

export function setOwnerDashboardTab(tab: OwnerDashboardTab) {
  try {
    sessionStorage.setItem(STORAGE_KEY, tab);
  } catch {
    // Ignore storage failures in private browsing.
  }
  window.dispatchEvent(new CustomEvent("owner-dashboard-tab", { detail: tab }));
}
