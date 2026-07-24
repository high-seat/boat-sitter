import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  changeEmail,
  changePassword,
  listLinkedProviders,
  requestPasswordReset,
} from "@/authClient";
import { Modal } from "@/components/ui/Modal";

export function ChangeEmailModal({
  currentEmail,
  onClose,
}: {
  currentEmail: string;
  onClose: () => void;
  onSuccess?: (email: string) => void;
}) {
  const { t } = useTranslation();
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setError(t("auth.emailInvalid"));
      return;
    }
    setPending(true);
    try {
      const res = await changeEmail(newEmail.trim());
      if (res?.error) throw new Error(res.error.message ?? "auth.failed");
      setNotice(
        t(
          "settings.changeEmailSent",
          "Check your new inbox — we sent a link to confirm the change. Your email switches once you click it.",
        ),
      );
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : "auth.failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      pending={pending}
      title={t("settings.changeEmailTitle")}
      titleId="change-email-title"
    >
      {notice ? (
        <div>
          <p className="text-sm leading-6 text-navy">{notice}</p>
          <div className="flex justify-end pt-6">
            <button
              className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
              onClick={onClose}
              type="button"
            >
              {t("common.done")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm leading-6 text-slate">{t("settings.changeEmailHint")}</p>
          <form className="mt-8 space-y-4" onSubmit={(event) => void submit(event)}>
            <div>
              <span className="form-label">{t("settings.currentEmail")}</span>
              <p className="mt-1 wrap-break-word text-base font-semibold text-navy">
                {currentEmail}
              </p>
            </div>
            <label className="block">
              <span className="form-label">{t("settings.newEmail")}</span>
              <input
                autoComplete="email"
                className="form-input"
                onChange={(event) => setNewEmail(event.target.value)}
                required
                type="email"
                value={newEmail}
              />
            </label>
            {error ? (
              <p className="text-sm font-semibold text-coral" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3 pt-6">
              <button
                className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-navy disabled:opacity-60"
                disabled={pending}
                onClick={onClose}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <button
                className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? t("common.saving") : t("settings.changeEmail")}
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

export function ChangePasswordModal({
  email,
  onClose,
  onSuccess,
}: {
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  // null = still checking which providers the account has.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void listLinkedProviders()
      .then((providers) => {
        if (alive) setHasPassword(providers.includes("credential"));
      })
      .catch(() => {
        if (alive) setHasPassword(true); // fall back to the change form
      });
    return () => {
      alive = false;
    };
  }, []);

  // Google-only account: no password to change — offer to set one via email.
  async function sendSetPassword() {
    setError("");
    setPending(true);
    try {
      const res = await requestPasswordReset(email);
      if (res?.error) throw new Error(res.error.message ?? "auth.failed");
      setNotice(
        t(
          "settings.setPasswordSent",
          "You signed in with Google, so there's no password yet. We've emailed you a link to set one.",
        ),
      );
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : "auth.failed"));
    } finally {
      setPending(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (form.newPassword.length < 8) {
      setError(t("auth.passwordInvalid"));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(t("settings.passwordMismatch"));
      return;
    }
    setPending(true);
    try {
      const res = await changePassword(form.currentPassword, form.newPassword);
      if (res?.error) throw new Error(res.error.message ?? "auth.invalidCredentials");
      onSuccess();
      onClose();
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : "auth.failed"));
    } finally {
      setPending(false);
    }
  }

  if (notice) {
    return (
      <Modal
        onClose={onClose}
        pending={pending}
        title={t("settings.changePasswordTitle")}
        titleId="change-password-title"
      >
        <div>
          <p className="text-sm leading-6 text-navy">{notice}</p>
          <div className="flex justify-end pt-6">
            <button
              className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white"
              onClick={onClose}
              type="button"
            >
              {t("common.done")}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      onClose={onClose}
      pending={pending}
      title={t("settings.changePasswordTitle")}
      titleId="change-password-title"
    >
      {hasPassword === false ? (
        <div>
          <p className="text-sm leading-6 text-slate">
            {t(
              "settings.noPasswordYet",
              "You signed in with Google. To also use a password, we'll email you a link to set one.",
            )}
          </p>
          {error ? (
            <p className="mt-3 text-sm font-semibold text-coral" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3 pt-6">
            <button
              className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-navy disabled:opacity-60"
              disabled={pending}
              onClick={onClose}
              type="button"
            >
              {t("common.cancel")}
            </button>
            <button
              className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
              disabled={pending}
              onClick={() => void sendSetPassword()}
              type="button"
            >
              {pending
                ? t("common.saving")
                : t("settings.sendSetPasswordLink", "Email me a set-password link")}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm leading-6 text-slate">{t("settings.changePasswordHint")}</p>
          <form className="mt-8 space-y-4" onSubmit={(event) => void submit(event)}>
            <label className="block">
              <span className="form-label">{t("settings.currentPassword")}</span>
              <input
                autoComplete="current-password"
                className="form-input"
                onChange={(event) =>
                  setForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
                required
                type="password"
                value={form.currentPassword}
              />
            </label>
            <div>
              <label className="block">
                <span className="form-label">{t("settings.newPassword")}</span>
                <input
                  autoComplete="new-password"
                  className="form-input"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  required
                  type="password"
                  value={form.newPassword}
                />
              </label>
              <span className="mt-1 block text-xs text-slate">{t("auth.passwordHint")}</span>
            </div>
            <label className="block">
              <span className="form-label">{t("settings.confirmPassword")}</span>
              <input
                autoComplete="new-password"
                className="form-input"
                onChange={(event) =>
                  setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                required
                type="password"
                value={form.confirmPassword}
              />
            </label>
            {error ? (
              <p className="text-sm font-semibold text-coral" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-3 pt-6">
              <button
                className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-navy disabled:opacity-60"
                disabled={pending}
                onClick={onClose}
                type="button"
              >
                {t("common.cancel")}
              </button>
              <button
                className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                {pending ? t("common.saving") : t("settings.changePassword")}
              </button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}
