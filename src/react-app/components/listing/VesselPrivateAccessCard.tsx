import { KeyRound, Lock, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  hasVesselPrivateAccess,
  type VesselPrivateAccess,
} from "@/mockApi";

export function VesselPrivateAccessCard({
  details,
  variant = "sitter",
}: {
  details?: VesselPrivateAccess | null;
  variant?: "sitter" | "owner";
}) {
  const { t } = useTranslation();
  if (!hasVesselPrivateAccess(details)) return null;

  const rows: Array<{ key: string; label: string; value: string; multiline?: boolean }> = [];
  if (details?.wifiNetwork?.trim()) {
    rows.push({
      key: "wifiNetwork",
      label: t("privateAccess.wifiNetwork"),
      value: details.wifiNetwork.trim(),
    });
  }
  if (details?.wifiPassword?.trim()) {
    rows.push({
      key: "wifiPassword",
      label: t("privateAccess.wifiPassword"),
      value: details.wifiPassword.trim(),
    });
  }
  if (details?.accessCodes?.trim()) {
    rows.push({
      key: "accessCodes",
      label: t("privateAccess.accessCodes"),
      value: details.accessCodes.trim(),
      multiline: true,
    });
  }
  if (details?.otherNotes?.trim()) {
    rows.push({
      key: "otherNotes",
      label: t("privateAccess.otherNotes"),
      value: details.otherNotes.trim(),
      multiline: true,
    });
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-teal/35 bg-seafoam/60"
      aria-label={t("privateAccess.title")}
    >
      <div className="border-b border-teal/25 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-teal">
            <Lock aria-hidden="true" size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-navy">{t("privateAccess.title")}</h2>
            <p className="mt-1 text-sm leading-6 text-slate">
              {variant === "owner" ? t("privateAccess.introOwner") : t("privateAccess.intro")}
            </p>
          </div>
        </div>
      </div>
      <dl className="divide-y divide-teal/20">
        {rows.map((row) => (
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4" key={row.key}>
            <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal">
              {row.key.startsWith("wifi") ? (
                <Wifi aria-hidden="true" size={14} />
              ) : (
                <KeyRound aria-hidden="true" size={14} />
              )}
              {row.label}
            </dt>
            <dd
              className={`wrap-break-word font-semibold text-navy ${
                row.multiline ? "whitespace-pre-wrap leading-6" : ""
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
