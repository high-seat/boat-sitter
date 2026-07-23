import { queryOptions } from "@tanstack/react-query";
import { createQueryKeys, defineQueryOptions } from "@ocodio/query-key-manager";
import { listAdminAuditLog, listAdminUsers } from "@/adminApi";
import {
  getApplicationsForSit,
  getApplicationsForUser,
  getBoat,
  getBoats,
  getBoatsPage,
  getNotificationsForUser,
  getPublicMemberProfile,
  getReviewForApplication,
  getReviewsForSitter,
  getSavedListings,
  getSitPrivateAccessForViewer,
  getSits,
  getVessels,
  searchDestinations,
} from "@/mockApi";
import { getMemberVerificationChecks, getVerificationStatus } from "@/verificationService";
import type { ApplicationsListParams } from "../shared/applicationsSearch";
import type { BoatSearchParams } from "../shared/boatsSearch";

/**
 * Static query options + domain prefixes via `@ocodio/query-key-manager`.
 * Parameterized queries use TanStack `queryOptions` (see skill) so call sites
 * keep full queryFn typing under our TypeScript toolchain.
 */
const managed = createQueryKeys({
  boats: {
    all: defineQueryOptions({
      queryKey: ["boats"],
      queryFn: getBoats,
    }),
  },
  vessels: {
    all: defineQueryOptions({
      queryKey: ["vessels"],
      queryFn: getVessels,
    }),
  },
  sits: {
    all: defineQueryOptions({
      queryKey: ["sits"],
      queryFn: getSits,
    }),
  },
  applications: {
    root: defineQueryOptions({
      queryKey: ["applications"],
      // Prefix-only leaf for invalidation; never fetched directly.
      queryFn: async () => [] as const,
    }),
  },
  reviews: {
    root: defineQueryOptions({
      queryKey: ["reviews"],
      queryFn: async () => [] as const,
    }),
  },
  verification: {
    root: defineQueryOptions({
      queryKey: ["verification"],
      queryFn: async () => null,
    }),
  },
  verificationChecks: {
    root: defineQueryOptions({
      queryKey: ["verification-checks"],
      queryFn: async () => null,
    }),
  },
  destinations: {
    root: defineQueryOptions({
      queryKey: ["destinations"],
      queryFn: async () => [] as const,
    }),
  },
  savedListings: {
    root: defineQueryOptions({
      queryKey: ["saved-listings"],
      queryFn: async () => [] as const,
    }),
  },
  notifications: {
    root: defineQueryOptions({
      queryKey: ["notifications"],
      queryFn: async () => [] as const,
    }),
  },
  memberProfile: {
    root: defineQueryOptions({
      queryKey: ["member-profile"],
      queryFn: async () => null,
    }),
  },
  sitPrivateAccess: {
    root: defineQueryOptions({
      queryKey: ["sit-private-access"],
      queryFn: async () => null,
    }),
  },
  admin: {
    users: defineQueryOptions({
      queryKey: ["admin-users"],
      queryFn: listAdminUsers,
    }),
    audit: defineQueryOptions({
      queryKey: ["admin-audit"],
      queryFn: listAdminAuditLog,
    }),
  },
  boat: {
    root: defineQueryOptions({
      queryKey: ["boat"],
      queryFn: async () => null,
    }),
  },
});

/**
 * Central TanStack Query key + options schema.
 * Import `queries` everywhere instead of hardcoding queryKey arrays.
 */
export const queries = {
  boats: {
    all: managed.boats.all,
    getQueryKey: managed.boats.getQueryKey,
    search: (params: BoatSearchParams) =>
      queryOptions({
        queryKey: ["boats", "search", params] as const,
        queryFn: () => getBoatsPage(params),
      }),
  },

  boat: {
    getQueryKey: managed.boat.getQueryKey,
    detail: (id: string | undefined) =>
      queryOptions({
        queryKey: ["boat", id] as const,
        queryFn: () => getBoat(id!),
      }),
  },

  vessels: {
    all: managed.vessels.all,
    getQueryKey: managed.vessels.getQueryKey,
  },

  sits: {
    all: managed.sits.all,
    getQueryKey: managed.sits.getQueryKey,
  },

  applications: {
    getQueryKey: managed.applications.getQueryKey,
    user: (userName: string | undefined) =>
      queryOptions({
        queryKey: ["applications", "user", userName] as const,
        queryFn: () => getApplicationsForUser(userName!),
      }),
    sit: (sitId: string, listParams: Omit<ApplicationsListParams, "sitId">) =>
      queryOptions({
        queryKey: ["applications", "sit", sitId, listParams] as const,
        queryFn: () => getApplicationsForSit(sitId, listParams),
      }),
  },

  reviews: {
    getQueryKey: managed.reviews.getQueryKey,
    application: (applicationId: string) =>
      queryOptions({
        queryKey: ["reviews", "application", applicationId] as const,
        queryFn: () => getReviewForApplication(applicationId),
      }),
    sitter: (sitterName: string) =>
      queryOptions({
        queryKey: ["reviews", "sitter", sitterName] as const,
        queryFn: () => getReviewsForSitter(sitterName),
      }),
  },

  verification: {
    getQueryKey: managed.verification.getQueryKey,
    status: (userName: string | undefined) =>
      queryOptions({
        queryKey: ["verification", userName] as const,
        queryFn: () => getVerificationStatus(userName!),
      }),
  },

  verificationChecks: {
    getQueryKey: managed.verificationChecks.getQueryKey,
    profile: (name: string, email: string, phoneNumber: string) =>
      queryOptions({
        queryKey: ["verification-checks", name, email, phoneNumber] as const,
        queryFn: () =>
          getMemberVerificationChecks(name, {
            isSelf: true,
            email,
            phoneNumber,
          }),
      }),
    applyGate: (
      name: string | undefined,
      email: string | undefined,
      phoneNumber: string | undefined,
    ) =>
      queryOptions({
        queryKey: ["verification-checks", name, email, phoneNumber, "apply-gate"] as const,
        queryFn: () =>
          getMemberVerificationChecks(name!, {
            isSelf: true,
            email,
            phoneNumber,
          }),
      }),
    owner: (ownerName: string | undefined) =>
      queryOptions({
        queryKey: ["verification-checks", ownerName] as const,
        queryFn: () => getMemberVerificationChecks(ownerName!),
      }),
    member: (
      profileName: string,
      isMe: boolean,
      email: string,
      phoneNumber: string,
      verificationStatus: string | undefined,
    ) =>
      queryOptions({
        queryKey: [
          "verification-checks",
          profileName,
          isMe,
          email,
          phoneNumber,
          verificationStatus,
        ] as const,
        queryFn: () =>
          getMemberVerificationChecks(profileName, {
            isSelf: isMe,
            email,
            phoneNumber,
          }),
      }),
    sitCreate: (
      name: string | undefined,
      email: string | undefined,
      phoneNumber: string | undefined,
    ) =>
      queryOptions({
        queryKey: ["verification-checks", name, email, phoneNumber, "sit-create"] as const,
        queryFn: () =>
          getMemberVerificationChecks(name!, {
            isSelf: true,
            email,
            phoneNumber,
          }),
      }),
    ownerCreateSit: (
      name: string | undefined,
      email: string | undefined,
      phoneNumber: string | undefined,
    ) =>
      queryOptions({
        queryKey: ["verification-checks", name, email, phoneNumber, "owner-create-sit"] as const,
        queryFn: () =>
          getMemberVerificationChecks(name!, {
            isSelf: true,
            email,
            phoneNumber,
          }),
      }),
  },

  destinations: {
    getQueryKey: managed.destinations.getQueryKey,
    search: (kind: "city" | "country" | "all", q: string) =>
      queryOptions({
        queryKey: ["destinations", kind, q] as const,
        queryFn: () =>
          searchDestinations({
            q,
            kind,
            limit: q.trim() ? 12 : 5,
          }),
        staleTime: 30_000,
      }),
  },

  savedListings: {
    getQueryKey: managed.savedListings.getQueryKey,
    list: (availability: "open" | "all", savedIds: string[]) =>
      queryOptions({
        queryKey: ["saved-listings", availability, savedIds] as const,
        queryFn: () => getSavedListings({ availability, savedIds }),
      }),
  },

  notifications: {
    getQueryKey: managed.notifications.getQueryKey,
    user: (userName: string | undefined) =>
      queryOptions({
        queryKey: ["notifications", userName] as const,
        queryFn: () => getNotificationsForUser(userName!),
      }),
  },

  memberProfile: {
    getQueryKey: managed.memberProfile.getQueryKey,
    detail: (memberKey: string) =>
      queryOptions({
        queryKey: ["member-profile", memberKey] as const,
        queryFn: () => getPublicMemberProfile(memberKey),
      }),
  },

  sitPrivateAccess: {
    getQueryKey: managed.sitPrivateAccess.getQueryKey,
    forViewer: (sitId: string | undefined, viewerName: string | undefined) =>
      queryOptions({
        queryKey: ["sit-private-access", sitId, viewerName] as const,
        queryFn: () => getSitPrivateAccessForViewer(sitId!, viewerName!),
      }),
  },

  admin: {
    users: managed.admin.users,
    audit: managed.admin.audit,
    getQueryKey: managed.admin.getQueryKey,
  },
};
