/**
 * Shared application-review filter / sort / pagination.
 * Used by the Worker `/api/applications?sitId=` route and the SPA localStorage fallback.
 */

export const APPLICATIONS_PAGE_SIZE = 20;

export type ApplicationListSort = "newest" | "experience" | "skillMatch" | "priorSits";

export type ApplicationExperienceFilter = "any" | "meetsMin" | "fivePlus" | "tenPlus";

export type ApplicationStatusFilter =
  | "all"
  | "new"
  | "shortlisted"
  | "accepted"
  | "declined"
  | "withdrawn";

export type ApplicationsListParams = {
  sitId: string;
  sort?: ApplicationListSort;
  status?: ApplicationStatusFilter;
  experience?: ApplicationExperienceFilter;
  page?: number;
  limit?: number;
};

export type ApplicationListItem = {
  id: string;
  status: string;
  createdAt: string;
  applicant: {
    skills: string[];
    certifications: string[];
    yearsExperience: number;
    completedSits?: number;
  };
};

export type ApplicationListSit = {
  minYearsExperience?: number | null;
  requiredSkills?: string[] | null;
  requiredCertifications?: string[] | null;
};

const SORTS = new Set<ApplicationListSort>(["newest", "experience", "skillMatch", "priorSits"]);
const EXPERIENCES = new Set<ApplicationExperienceFilter>([
  "any",
  "meetsMin",
  "fivePlus",
  "tenPlus",
]);
const STATUSES = new Set<ApplicationStatusFilter>([
  "all",
  "new",
  "shortlisted",
  "accepted",
  "declined",
  "withdrawn",
]);

export function parseApplicationListSort(value: string | null | undefined): ApplicationListSort {
  if (value && SORTS.has(value as ApplicationListSort)) return value as ApplicationListSort;
  return "newest";
}

export function parseApplicationExperienceFilter(
  value: string | null | undefined,
): ApplicationExperienceFilter {
  if (value && EXPERIENCES.has(value as ApplicationExperienceFilter)) {
    return value as ApplicationExperienceFilter;
  }
  return "any";
}

export function parseApplicationStatusFilter(
  value: string | null | undefined,
): ApplicationStatusFilter {
  if (value && STATUSES.has(value as ApplicationStatusFilter)) {
    return value as ApplicationStatusFilter;
  }
  return "all";
}

export function matchesExperienceFilter(
  years: number,
  filter: ApplicationExperienceFilter,
  minYears: number,
): boolean {
  if (filter === "any") return true;
  if (filter === "meetsMin") return minYears <= 0 || years >= minYears;
  if (filter === "fivePlus") return years >= 5;
  return years >= 10;
}

export function applicationSkillMatchCount(
  applicant: ApplicationListItem["applicant"],
  sit: ApplicationListSit | undefined,
): number {
  const requiredSkills = sit?.requiredSkills ?? [];
  const requiredCertifications = sit?.requiredCertifications ?? [];
  const minimumYears = sit?.minYearsExperience ?? 0;
  return (
    requiredSkills.filter((skill) => applicant.skills.includes(skill)).length +
    requiredCertifications.filter((certification) =>
      applicant.certifications.includes(certification),
    ).length +
    (minimumYears > 0 && applicant.yearsExperience >= minimumYears ? 1 : 0)
  );
}

function sortApplications<T extends ApplicationListItem>(
  items: T[],
  sort: ApplicationListSort,
  sit: ApplicationListSit | undefined,
): T[] {
  return [...items].sort((a, b) => {
    if (sort === "experience") {
      return (
        b.applicant.yearsExperience - a.applicant.yearsExperience ||
        b.createdAt.localeCompare(a.createdAt)
      );
    }
    if (sort === "skillMatch") {
      const aMatch = applicationSkillMatchCount(a.applicant, sit);
      const bMatch = applicationSkillMatchCount(b.applicant, sit);
      return bMatch - aMatch || b.applicant.yearsExperience - a.applicant.yearsExperience;
    }
    if (sort === "priorSits") {
      return (
        (b.applicant.completedSits ?? 0) - (a.applicant.completedSits ?? 0) ||
        b.applicant.yearsExperience - a.applicant.yearsExperience
      );
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/**
 * Split + filter applications for the owner review UI.
 * - `accepted`: experience-filtered accepted apps (hero / accepted status view)
 * - `list`: status + experience filtered pool to paginate (excludes accepted unless status=accepted)
 */
export function prepareApplicationReviewLists<T extends ApplicationListItem>(
  apps: T[],
  options: {
    status: ApplicationStatusFilter;
    experience: ApplicationExperienceFilter;
    sort: ApplicationListSort;
    sit: ApplicationListSit | undefined;
  },
): { list: T[]; accepted: T[] } {
  const minYears = options.sit?.minYearsExperience ?? 0;
  const matchesExperience = (app: T) =>
    matchesExperienceFilter(app.applicant.yearsExperience, options.experience, minYears);

  const accepted = apps
    .filter((app) => app.status === "accepted" && matchesExperience(app))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (options.status === "accepted") {
    return { list: sortApplications(accepted, options.sort, options.sit), accepted };
  }

  const list = sortApplications(
    apps.filter((app) => {
      if (app.status === "accepted") return false;
      if (options.status !== "all" && app.status !== options.status) return false;
      return matchesExperience(app);
    }),
    options.sort,
    options.sit,
  );

  return { list, accepted };
}

export function paginateApplicationList<T>(
  items: T[],
  pageInput: number | undefined,
  limitInput: number | undefined,
): { items: T[]; total: number; page: number; limit: number; totalPages: number } {
  const total = items.length;
  const returnAll = limitInput == null || limitInput <= 0;
  const limit = returnAll ? Math.max(total, 1) : Math.min(50, Math.max(1, Math.floor(limitInput)));
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = returnAll
    ? 0
    : Math.min(Math.max(0, Math.floor(pageInput ?? 0)), totalPages - 1);
  const offset = returnAll ? 0 : page * limit;
  return {
    items: returnAll ? items : items.slice(offset, offset + limit),
    total,
    page,
    limit: returnAll ? total || 1 : limit,
    totalPages: returnAll ? 1 : totalPages,
  };
}

export function applicationsListQueryString(params: ApplicationsListParams): string {
  const search = new URLSearchParams();
  search.set("sitId", params.sitId);
  if (params.sort && params.sort !== "newest") search.set("sort", params.sort);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.experience && params.experience !== "any") {
    search.set("experience", params.experience);
  }
  if (params.page != null && params.page > 0) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
