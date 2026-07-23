import { isAdminEmail, normalizeEmail, type UserRole } from "@/adminAccess";

export type AdminUserStatus = "active" | "disabled";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  image: string;
  location: string;
  bio: string;
  role: UserRole;
  status: AdminUserStatus;
  memberSince: number;
};

export type AdminUserPatch = Partial<
  Pick<
    AdminUser,
    "name" | "email" | "image" | "location" | "bio" | "role" | "status" | "memberSince"
  >
>;

export type AdminAuditAction =
  | "user.update"
  | "user.delete"
  | "user.disable"
  | "user.enable"
  | "role.change";

export type AdminAuditEntry = {
  id: string;
  at: string;
  actorEmail: string;
  actorName: string;
  action: AdminAuditAction;
  targetEmail: string;
  targetName: string;
  summary: string;
};

const USERS_KEY = "harbourly-admin-users";
const AUDIT_KEY = "harbourly-admin-audit";
const ACCOUNTS_KEY = "harbourly-mock-accounts";

type StoredUserOverride = AdminUserPatch & { id: string; deleted?: boolean };

function wait(ms = 220) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? "null") as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function readOverrides(): StoredUserOverride[] {
  return readJson<StoredUserOverride[]>(USERS_KEY, []);
}

function writeOverrides(overrides: StoredUserOverride[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(overrides));
}

function readAudit(): AdminAuditEntry[] {
  return readJson<AdminAuditEntry[]>(AUDIT_KEY, []);
}

function writeAudit(entries: AdminAuditEntry[]) {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, 500)));
}

function userIdFromEmail(email: string) {
  return normalizeEmail(email);
}

function fallbackEmail(name: string) {
  const local = name
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ".")
    .replaceAll(/^\.+|\.+$/g, "");
  return `${local || "member"}@boatstead.mock`;
}

function appendAudit(entry: Omit<AdminAuditEntry, "id" | "at">) {
  const next: AdminAuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
  };
  writeAudit([next, ...readAudit()]);
  return next;
}

function seededDirectory(): AdminUser[] {
  return [
    {
      id: userIdFromEmail("admin@boatstead.mock"),
      email: "admin@boatstead.mock",
      name: "Boatstead Admin",
      image: "https://api.dicebear.com/9.x/initials/svg?seed=Admin",
      location: "Remote",
      bio: "Platform super user for Boatstead operations.",
      role: "admin",
      status: "active",
      memberSince: 2024,
    },
    {
      id: userIdFromEmail("maya.finn@boatstead.mock"),
      email: "maya.finn@boatstead.mock",
      name: "Maya & Finn",
      image: "https://i.pravatar.cc/160?img=47",
      location: "Lefkada, Greece",
      bio: "Owners of Solstice.",
      role: "member",
      status: "active",
      memberSince: 2021,
    },
    {
      id: userIdFromEmail("alex.morgan@boatstead.mock"),
      email: "alex.morgan@boatstead.mock",
      name: "Alex Morgan",
      image: "https://i.pravatar.cc/160?img=11",
      location: "Brighton, United Kingdom",
      bio: "Experienced Mediterranean sitter.",
      role: "member",
      status: "active",
      memberSince: 2020,
    },
  ];
}

function collectDirectoryUsers(
  vessels: Array<{ owner: string; ownerImage?: string; homePort?: string }> = [],
): AdminUser[] {
  const byId = new Map<string, AdminUser>();

  for (const user of seededDirectory()) {
    byId.set(user.id, user);
  }

  const accounts = readJson<Array<{ email: string; name: string; image: string }>>(
    ACCOUNTS_KEY,
    [],
  );
  for (const account of accounts) {
    const email = normalizeEmail(account.email);
    const id = userIdFromEmail(email);
    const existing = byId.get(id);
    byId.set(id, {
      id,
      email,
      name: account.name,
      image: account.image,
      location: existing?.location ?? "",
      bio: existing?.bio ?? "",
      role: isAdminEmail(email) ? "admin" : (existing?.role ?? "member"),
      status: existing?.status ?? "active",
      memberSince: existing?.memberSince ?? new Date().getFullYear(),
    });
  }

  for (const vessel of vessels) {
    if (!vessel.owner) continue;
    const email = fallbackEmail(vessel.owner);
    const id = userIdFromEmail(email);
    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      email,
      name: vessel.owner,
      image:
        vessel.ownerImage ||
        `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(vessel.owner)}`,
      location: vessel.homePort || "",
      bio: "",
      role: "member",
      status: "active",
      memberSince: 2022,
    });
  }

  for (const override of readOverrides()) {
    if (override.deleted) {
      byId.delete(override.id);
      continue;
    }
    const existing = byId.get(override.id);
    if (!existing) {
      if (!override.email || !override.name) continue;
      byId.set(override.id, {
        id: override.id,
        email: normalizeEmail(override.email),
        name: override.name,
        image: override.image ?? "https://api.dicebear.com/9.x/initials/svg?seed=User",
        location: override.location ?? "",
        bio: override.bio ?? "",
        role: override.role ?? "member",
        status: override.status ?? "active",
        memberSince: override.memberSince ?? new Date().getFullYear(),
      });
      continue;
    }
    const email = normalizeEmail(override.email ?? existing.email);
    byId.set(override.id, {
      ...existing,
      ...override,
      email,
      role: isAdminEmail(email) ? "admin" : (override.role ?? existing.role),
    });
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  await wait();
  let vessels: Array<{ owner: string; ownerImage?: string; homePort?: string }> = [];
  try {
    const { getVessels } = await import("@/mockApi");
    vessels = await getVessels();
  } catch {
    vessels = [];
  }
  return collectDirectoryUsers(vessels);
}

export async function updateAdminUser(
  id: string,
  patch: AdminUserPatch,
  actor: { email: string; name: string },
): Promise<AdminUser> {
  await wait(320);
  const users = await listAdminUsers();
  const current = users.find((user) => user.id === id);
  if (!current) throw new Error("ADMIN_USER_NOT_FOUND");

  const nextEmail = patch.email ? normalizeEmail(patch.email) : current.email;
  const nextRole: UserRole = isAdminEmail(nextEmail) ? "admin" : (patch.role ?? current.role);

  if (normalizeEmail(actor.email) === current.email && nextRole !== "admin") {
    throw new Error("ADMIN_CANNOT_DEMOTE_SELF");
  }

  const nextId = userIdFromEmail(nextEmail);
  const overrides = readOverrides().filter((item) => item.id !== id && item.id !== nextId);
  const merged: StoredUserOverride = {
    id: nextId,
    name: patch.name ?? current.name,
    email: nextEmail,
    image: patch.image ?? current.image,
    location: patch.location ?? current.location,
    bio: patch.bio ?? current.bio,
    role: nextRole,
    status: patch.status ?? current.status,
    memberSince: patch.memberSince ?? current.memberSince,
  };
  writeOverrides([merged, ...overrides]);

  if (current.role !== nextRole) {
    appendAudit({
      actorEmail: actor.email,
      actorName: actor.name,
      action: "role.change",
      targetEmail: nextEmail,
      targetName: merged.name ?? current.name,
      summary: `Changed role from ${current.role} to ${nextRole}`,
    });
  }
  if (current.status !== merged.status) {
    appendAudit({
      actorEmail: actor.email,
      actorName: actor.name,
      action: merged.status === "disabled" ? "user.disable" : "user.enable",
      targetEmail: nextEmail,
      targetName: merged.name ?? current.name,
      summary: merged.status === "disabled" ? "Disabled user account" : "Re-enabled user account",
    });
  }
  appendAudit({
    actorEmail: actor.email,
    actorName: actor.name,
    action: "user.update",
    targetEmail: nextEmail,
    targetName: merged.name ?? current.name,
    summary: "Updated user profile",
  });

  const updated = (await listAdminUsers()).find((user) => user.id === nextId);
  if (!updated) throw new Error("ADMIN_USER_NOT_FOUND");
  return updated;
}

export async function deleteAdminUser(
  id: string,
  actor: { email: string; name: string },
): Promise<void> {
  await wait(320);
  const users = await listAdminUsers();
  const current = users.find((user) => user.id === id);
  if (!current) throw new Error("ADMIN_USER_NOT_FOUND");
  if (normalizeEmail(actor.email) === current.email) {
    throw new Error("ADMIN_CANNOT_DELETE_SELF");
  }

  const overrides = readOverrides().filter((item) => item.id !== id);
  writeOverrides([{ id, deleted: true }, ...overrides]);
  appendAudit({
    actorEmail: actor.email,
    actorName: actor.name,
    action: "user.delete",
    targetEmail: current.email,
    targetName: current.name,
    summary: "Deleted user from admin directory",
  });
}

export async function listAdminAuditLog(): Promise<AdminAuditEntry[]> {
  await wait(160);
  return readAudit();
}
