import { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeMockAccountEmail, changeMockAccountPassword } from "@/mockAuth";
import { Modal } from "@/components/ui/Modal";

export function ChangeEmailModal({
  currentEmail,
  onClose,
  onSuccess,
}: {
  currentEmail: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ newEmail: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.newEmail.trim())) {
      setError(t("auth.emailInvalid"));
      setPending(false);
      return;
    }
    try {
      const account = await changeMockAccountEmail({
        currentEmail,
        newEmail: form.newEmail,
        password: form.password,
      });
      onSuccess(account.email);
      onClose();
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : "auth.failed"));
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
      <p className="text-sm leading-6 text-slate">{t("settings.changeEmailHint")}</p>
      <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
        <label>
          <span className="form-label">{t("settings.currentEmail")}</span>
          <input
            className="form-input bg-cream/80 text-slate"
            readOnly
            type="email"
            value={currentEmail}
          />
        </label>
        <label>
          <span className="form-label">{t("settings.newEmail")}</span>
          <input
            autoComplete="email"
            className="form-input"
            onChange={(event) =>
              setForm((current) => ({ ...current, newEmail: event.target.value }))
            }
            required
            type="email"
            value={form.newEmail}
          />
        </label>
        <label>
          <span className="form-label">{t("settings.currentPassword")}</span>
          <input
            autoComplete="current-password"
            className="form-input"
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required
            type="password"
            value={form.password}
          />
        </label>
        {error ? (
          <p className="text-sm font-semibold text-coral" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-3 pt-2">
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
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    if (form.newPassword.length < 8) {
      setError(t("auth.passwordInvalid"));
      setPending(false);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(t("settings.passwordMismatch"));
      setPending(false);
      return;
    }
    try {
      await changeMockAccountPassword({
        email,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      onSuccess();
      onClose();
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : "auth.failed"));
      setPending(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      pending={pending}
      title={t("settings.changePasswordTitle")}
      titleId="change-password-title"
    >
      <p className="text-sm leading-6 text-slate">{t("settings.changePasswordHint")}</p>
      <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
        <label>
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
          <label>
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
        <label>
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
        <div className="flex flex-wrap justify-end gap-3 pt-2">
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
    </Modal>
  );
}
