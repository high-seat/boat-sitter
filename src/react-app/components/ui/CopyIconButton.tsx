import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { IconTooltip } from "@/components/ui/IconTooltip";

export function CopyIconButton({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const tooltip = copied ? t("privateAccess.copied") : t("privateAccess.copy");

  return (
    <IconTooltip label={tooltip} side="top">
      <button
        aria-label={
          copied
            ? t("privateAccess.copied")
            : t("privateAccess.copyAria", { label })
        }
        className="grid size-8 shrink-0 place-items-center rounded-lg text-teal transition hover:bg-white/80 hover:text-navy"
        onClick={() => void copyValue()}
        type="button"
      >
        {copied ? <Check aria-hidden="true" size={15} /> : <Copy aria-hidden="true" size={15} />}
      </button>
    </IconTooltip>
  );
}
