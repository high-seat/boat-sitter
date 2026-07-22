import { useAppStore } from "@/store";

/**
 * On app load, ask the Worker who the current session belongs to (/api/me) and,
 * if there is one, populate the store so the UI shows the user as logged in.
 *
 * This bridges the real Better Auth session to the existing store. It runs once
 * at startup; the Google button + callback set the session cookie, and this
 * reads it back on the next load.
 */
export async function hydrateSession(): Promise<void> {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) return;
    const { user } = (await res.json()) as {
      user: { name: string; email: string; image?: string | null } | null;
    };
    if (user) {
      useAppStore.getState().loginAs({
        name: user.name,
        image:
          user.image ??
          `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
        email: user.email,
      });
    }
  } catch {
    // Offline or auth not migrated — stay logged out.
  }
}
