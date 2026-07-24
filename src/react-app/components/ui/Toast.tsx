import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { create } from "zustand";

export type ToastTone = "error" | "success" | "info";

type ToastEntry = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastStore = {
  toasts: ToastEntry[];
  push: (message: string, tone?: ToastTone) => string;
  dismiss: (id: string) => void;
};

const AUTO_DISMISS_MS = 5_000;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, message, tone }],
    }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));

/** Show an in-site toast. Defaults to info; use `error` for failures. */
export function showToast(message: string, tone: ToastTone = "info") {
  return useToastStore.getState().push(message, tone);
}

function toneClasses(tone: ToastTone) {
  if (tone === "error") {
    return {
      panel: "border-coral/40 bg-white",
      icon: "text-coral",
      Icon: AlertCircle,
    };
  }
  if (tone === "success") {
    return {
      panel: "border-teal/30 bg-white",
      icon: "text-teal",
      Icon: CheckCircle2,
    };
  }
  return {
    panel: "border-line bg-white",
    icon: "text-slate",
    Icon: Info,
  };
}

function ToastItem({ toast }: { toast: ToastEntry }) {
  const { t } = useTranslation();
  const dismiss = useToastStore((state) => state.dismiss);
  const { panel, icon, Icon } = toneClasses(toast.tone);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.id]);

  return (
    <div
      className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-float ${panel}`}
      data-testid={`toast-${toast.tone}`}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className={`mt-0.5 shrink-0 ${icon}`} size={20} />
      <p className="min-w-0 flex-1 text-sm font-semibold text-navy">{toast.message}</p>
      <button
        aria-label={t("toast.dismiss")}
        className="rounded-full p-1 text-slate transition hover:bg-cream hover:text-navy"
        data-testid="toast-dismiss"
        onClick={() => dismiss(toast.id)}
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4"
      data-testid="toast-host"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
