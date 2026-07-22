export type UserRole = "member" | "admin";

/** Emails that always receive admin (super-user) privileges in this prototype. */
export const ADMIN_EMAILS = ["admin@boatstead.mock", "harbourly.admin@boatstead.mock"] as const;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return (ADMIN_EMAILS as readonly string[]).includes(normalizeEmail(email));
}

export function roleForEmail(email?: string | null): UserRole {
  return isAdminEmail(email) ? "admin" : "member";
}

export function isAdminUser(user?: { email?: string; role?: UserRole } | null) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isAdminEmail(user.email);
}
