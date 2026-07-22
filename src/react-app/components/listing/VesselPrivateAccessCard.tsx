import { type ReactNode } from "react";
import { KeyRound, Lock, MapPinned, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  hasSitPrivateDetails,
  type SitPrivateDetails,
} from "@/mockApi";
import { mapsAddressSearchUrl } from "@/mapUtils";
import { CopyIconButton } from "@/components/ui/CopyIconButton";

function RowIcon({ icon }: { icon: "map" | "wifi" | "key" }) {
  if (icon === "wifi") return <Wifi aria-hidden="true" size={14} />;
  if (icon === "map") return <MapPinned aria-hidden="true" size={14} />;
  return <KeyRound aria-hidden="true" size={14} />;
}

export function VesselPrivateAccessCard({
  details,
  variant = "sitter",
}: {
  details?: SitPrivateDetails | null;
  variant?: "sitter" | "owner";
}) {
  const { t } = useTranslation();
  if (!hasSitPrivateDetails(details)) return null;

  const rows: Array<{
    key: string;
    label: string;
    value: string;
    multiline?: boolean;
    icon: "map" | "wifi" | "key";
    mapsLink?: boolean;
  }> = [];
  if (details?.fullAddress?.trim()) {
    rows.push({
      key: "fullAddress",
      label: t("privateAccess.fullAddress"),
      value: details.fullAddress.trim(),
      multiline: true,
      icon: "map",
      mapsLink: true,
    });
  }
  if (details?.wifiNetwork?.trim()) {
    rows.push({
      key: "wifiNetwork",
      label: t("privateAccess.wifiNetwork"),
      value: details.wifiNetwork.trim(),
      icon: "wifi",
    });
  }
  if (details?.wifiPassword?.trim()) {
    rows.push({
      key: "wifiPassword",
      label: t("privateAccess.wifiPassword"),
      value: details.wifiPassword.trim(),
      icon: "wifi",
    });
  }
  if (details?.accessCodes?.trim()) {
    rows.push({
      key: "accessCodes",
      label: t("privateAccess.accessCodes"),
      value: details.accessCodes.trim(),
      multiline: true,
      icon: "key",
    });
  }
  if (details?.otherNotes?.trim()) {
    rows.push({
      key: "otherNotes",
      label: t("privateAccess.otherNotes"),
      value: details.otherNotes.trim(),
      multiline: true,
      icon: "key",
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
        {rows.map((row) => {
          let valueNode: ReactNode = row.value;
          if (row.mapsLink) {
            valueNode = (
              <a
                aria-label={t("privateAccess.openInMapsAria", { address: row.value })}
                className="text-navy underline decoration-teal/50 underline-offset-2 transition hover:text-teal"
                href={mapsAddressSearchUrl(row.value)}
                rel="noreferrer"
                target="_blank"
                title={t("privateAccess.openInMaps")}
              >
                {row.value}
              </a>
            );
          }

          return (
            <div
              className="grid gap-1 px-5 py-4 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4"
              key={row.key}
            >
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal">
                <RowIcon icon={row.icon} />
                {row.label}
              </dt>
              <dd className="flex items-start gap-2">
                <div
                  className={`min-w-0 flex-1 wrap-break-word font-semibold text-navy ${
                    row.multiline ? "whitespace-pre-wrap leading-6" : ""
                  }`}
                >
                  {valueNode}
                </div>
                <CopyIconButton label={row.label} value={row.value} />
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
