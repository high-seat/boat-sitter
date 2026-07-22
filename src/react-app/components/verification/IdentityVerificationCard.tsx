import { Check, ShieldCheck, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFeatureFlag } from "@/featureFlags";
import type { MemberVerificationChecks } from "@/verificationService";

export function IdentityVerificationCard({
  checks,
  isSelf = false,
  onStartVerification,
  verifying = false,
}: {
  checks: MemberVerificationChecks;
  isSelf?: boolean;
  onStartVerification?: () => void;
  verifying?: boolean;
}) {
  const identityVerificationEnabled = useFeatureFlag("identityVerification");
  const { t } = useTranslation();
  if (!identityVerificationEnabled) return null;

  const items = [
    { key: "governmentId" as const, label: t("verification.governmentId") },
    { key: "email" as const, label: t("verification.email") },
    { key: "phone" as const, label: t("verification.phone") },
  ];
  const verifiedCount = items.filter((item) => checks[item.key]).length;
  const allVerified = verifiedCount === items.length;

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${
            allVerified ? "bg-seafoam text-teal" : "bg-cream text-slate"
          }`}
        >
          <ShieldCheck size={22} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-navy">
            {allVerified ? t("verification.identityVerified") : t("verification.confirmIdentity")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate">
            {(() => {
              if (allVerified) return t("verification.verifiedHint");
              if (isSelf) return t("verification.selfHint");
              return t("verification.partialHint", {
                count: verifiedCount,
                total: items.length,
              });
            })()}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((item) => {
          const done = checks[item.key];
          return (
            <li className="flex items-center gap-3 text-sm font-semibold text-navy" key={item.key}>
              <span
                aria-hidden="true"
                className={`grid size-6 place-items-center rounded-full ${
                  done ? "bg-seafoam text-teal" : "bg-cream text-slate"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
              </span>
              <span className={done ? "" : "text-slate"}>
                {item.label}
                <span className="sr-only">
                  {done ? t("verification.statusVerified") : t("verification.statusMissing")}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {isSelf && !checks.governmentId && onStartVerification && (
        <div className="mt-5 border-t border-line pt-5">
          <button
            className="w-full rounded-xl bg-navy py-3 text-sm font-bold text-white disabled:opacity-60"
            disabled={verifying}
            onClick={onStartVerification}
            type="button"
          >
            {verifying ? t("member.checking") : t("verification.verifyGovernmentId")}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate">{t("member.providerDemo")}</p>
        </div>
      )}
      {isSelf && checks.governmentId && (!checks.email || !checks.phone) && (
        <p className="mt-5 border-t border-line pt-4 text-sm leading-6 text-slate">
          {(() => {
            if (!checks.phone && !checks.email) return t("verification.addEmailAndPhone");
            if (!checks.phone) return t("verification.addPhone");
            return t("verification.addEmail");
          })()}
        </p>
      )}
    </section>
  );
}

export function IdentityVerificationBadge({ checks }: { checks: MemberVerificationChecks }) {
  const identityVerificationEnabled = useFeatureFlag("identityVerification");
  const { t } = useTranslation();
  if (!identityVerificationEnabled) return null;

  const allVerified = checks.governmentId && checks.email && checks.phone;
  return (
    <span
      className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ${
        allVerified ? "bg-seafoam text-teal" : "bg-cream text-slate"
      }`}
    >
      <ShieldCheck size={17} />{" "}
      {allVerified ? t("verification.identityVerified") : t("member.verificationNeeded")}
    </span>
  );
}
