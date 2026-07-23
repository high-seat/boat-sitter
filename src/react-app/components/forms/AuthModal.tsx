import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  AppleLoginButton,
  FacebookLoginButton,
  GoogleLoginButton,
} from "react-social-login-buttons";
import { TermsAgreementCheckbox } from "@/components/forms/TermsAgreementCheckbox";
import { continueWithSocialProvider, type SocialProvider } from "@/mockAuth";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/authClient";
import { hydrateSession } from "@/session";
import { useFeatureFlag } from "@/featureFlags";
import { useAppStore } from "@/store";

const socialButtonStyle = {
  background: "#ffffff",
  border: "1px solid #dce3df",
  borderRadius: "0.75rem",
  boxShadow: "none",
  color: "#092c3e",
  fontFamily: "inherit",
  fontSize: "0.875rem",
  fontWeight: 700,
  height: "2.75rem",
  margin: "0 0 0.5rem",
  width: "100%",
} as const;

const socialButtonActiveStyle = {
  background: "#f5f7f6",
} as const;

export function AuthModal() {
  const { t } = useTranslation();
  const loginAs = useAppStore((state) => state.loginAs);
  const loginWithApple = useFeatureFlag("loginWithApple");
  const loginWithFacebook = useFeatureFlag("loginWithFacebook");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      setMode((event as CustomEvent<"login" | "signup">).detail ?? "login");
      setError("");
      setAcceptedTerms(false);
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

  function finishLogin(account: {
    email?: string;
    emailConfirmed?: boolean;
    image: string;
    name: string;
  }) {
    void (async () => {
      if (import.meta.env.DEV) {
        try {
          const email =
            account.email?.trim() ||
            `${account.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, ".")}@boatstead.mock`;
          await fetch("/api/dev/login", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              name: account.name,
              image: account.image,
            }),
          });
          await hydrateSession();
          setOpen(false);
          setForm({ email: "", name: "", password: "" });
          setAcceptedTerms(false);
          setError("");
          return;
        } catch {
          // Fall through to local-only mock social login.
        }
      }
      loginAs(account);
      setOpen(false);
      setForm({ email: "", name: "", password: "" });
      setAcceptedTerms(false);
      setError("");
    })();
  }

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
    if (mode === "signup" && !acceptedTerms) {
      setError(t("auth.termsRequired"));
      return;
    }
    setPending(true);
    try {
      const result =
        mode === "signup"
          ? await signUpWithEmail({
              email: form.email,
              password: form.password,
              name: form.name.trim(),
            })
          : await signInWithEmail(form.email, form.password);
      if (result.error) {
        throw new Error(result.error.message ?? "auth.failed");
      }
      // Real Better Auth session cookie is now set — populate the store from it.
      await hydrateSession();
      setOpen(false);
      setForm({ email: "", name: "", password: "" });
      setAcceptedTerms(false);
      setError("");
    } catch (caught) {
      setError(t(caught instanceof Error ? caught.message : "auth.failed"));
    } finally {
      setPending(false);
    }
  }

  async function continueWith(provider: SocialProvider) {
    setError("");
    setPending(true);
    try {
      const account = await continueWithSocialProvider(provider, { acceptedTerms });
      finishLogin(account);
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
        className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-float md:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between">
          <div>
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

        <div className="mt-5 space-y-0">
          <GoogleLoginButton
            activeStyle={socialButtonActiveStyle}
            disabled={pending}
            onClick={() => {
              // Real Google OAuth: redirects to Google, returns to the app with
              // a Better Auth session cookie set.
              setPending(true);
              void signInWithGoogle().catch(() => setPending(false));
            }}
            style={socialButtonStyle}
            text={t("auth.continueWithGoogle")}
            type="button"
          />
          {loginWithApple && (
            <AppleLoginButton
              activeStyle={socialButtonActiveStyle}
              disabled={pending}
              onClick={() => void continueWith("apple")}
              style={socialButtonStyle}
              text={t("auth.continueWithApple")}
              type="button"
            />
          )}
          {loginWithFacebook && (
            <FacebookLoginButton
              activeStyle={socialButtonActiveStyle}
              disabled={pending}
              iconColor="#3b5998"
              onClick={() => void continueWith("facebook")}
              style={socialButtonStyle}
              text={t("auth.continueWithFacebook")}
              type="button"
            />
          )}
        </div>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate">
            {t("auth.orEmail")}
          </span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
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
          {mode === "signup" && (
            <TermsAgreementCheckbox
              checked={acceptedTerms}
              i18nKey="auth.termsAgreement"
              onChange={(checked) => {
                setAcceptedTerms(checked);
                if (checked && error === t("auth.termsRequired")) setError("");
              }}
            />
          )}
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
            {(() => {
              if (pending) return t("auth.pending");
              if (mode === "login") return t("auth.loginSubmit");
              return t("auth.signupSubmit");
            })()}
          </button>
        </form>
      </section>
    </div>
  );
}
