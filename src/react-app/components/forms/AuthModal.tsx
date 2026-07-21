import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loginMockAccount, signUpMockAccount } from "@/mockAuth";
import { useAppStore } from "@/store";

export function AuthModal() {
  const { t } = useTranslation();
  const loginAs = useAppStore((state) => state.loginAs);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      setMode((event as CustomEvent<"login" | "signup">).detail ?? "login");
      setError("");
      setOpen(true);
      window.setTimeout(() => emailRef.current?.focus());
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("open-auth", handleOpen);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("open-auth", handleOpen);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError(t("auth.emailInvalid"));
      return;
    }
    if (form.password.length < 8) {
      setError(t("auth.passwordInvalid"));
      return;
    }
    if (mode === "signup" && form.name.trim().length < 2) {
      setError(t("auth.nameInvalid"));
      return;
    }
    setPending(true);
    try {
      const account =
        mode === "signup"
          ? await signUpMockAccount(form)
          : await loginMockAccount(form.email, form.password);
      loginAs(account);
      setOpen(false);
      setForm({ email: "", name: "", password: "" });
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : "auth.failed"));
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-70 grid place-items-center bg-navy/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) setOpen(false);
      }}
    >
      <section
        aria-labelledby="auth-title"
        aria-modal="true"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-float md:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow">{t("auth.kicker")}</p>
            <h2 className="font-display text-2xl font-bold text-navy" id="auth-title">
              {mode === "login" ? t("auth.loginTitle") : t("auth.signupTitle")}
            </h2>
          </div>
          <button
            aria-label={t("common.close")}
            className="rounded-full p-2 hover:bg-cream"
            onClick={() => setOpen(false)}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 rounded-xl bg-cream p-1">
          {(["login", "signup"] as const).map((tab) => (
            <button
              aria-pressed={mode === tab}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold ${mode === tab ? "bg-white text-navy shadow-sm" : "text-slate"}`}
              key={tab}
              onClick={() => {
                setMode(tab);
                setError("");
              }}
              type="button"
            >
              {tab === "login" ? t("auth.loginTab") : t("auth.signupTab")}
            </button>
          ))}
        </div>
        <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
          {mode === "signup" && (
            <label className="block">
              <span className="form-label">{t("auth.name")}</span>
              <input
                className="form-input"
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                value={form.name}
              />
            </label>
          )}
          <label className="block">
            <span className="form-label">{t("auth.email")}</span>
            <input
              autoComplete="email"
              className="form-input"
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              ref={emailRef}
              type="email"
              value={form.email}
            />
          </label>
          <label className="block">
            <span className="form-label">{t("auth.password")}</span>
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="form-input"
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              type="password"
              value={form.password}
            />
            {mode === "signup" && (
              <span className="mt-1 block text-xs text-slate">{t("auth.passwordHint")}</span>
            )}
          </label>
          {error && (
            <p className="text-sm font-semibold text-coral" role="alert">
              {error}
            </p>
          )}
          <button
            className="w-full rounded-xl bg-coral py-3.5 font-bold text-white disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending
              ? t("auth.pending")
              : mode === "login"
                ? t("auth.loginSubmit")
                : t("auth.signupSubmit")}
          </button>
          <p className="text-center text-xs leading-5 text-slate">{t("auth.mockNotice")}</p>
        </form>
      </section>
    </div>
  );
}
