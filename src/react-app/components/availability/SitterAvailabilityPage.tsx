import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Ship, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { apiDelete, apiPost } from "@/apiClient";
import { DateRangePicker } from "@/components/forms/DateRangePicker";
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";
import { IconTooltip } from "@/components/ui/IconTooltip";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { getIntlLocale } from "@/i18n";
import { queries, type AvailabilityMatchingSit, type AvailabilityWindow } from "@/queries";
import { useAppStore } from "@/store";

/**
 * Sitter availability — the supply side of the marketplace.
 *
 * A signed-in sitter publishes windows (date range + optional regions) when
 * they're free, and for each window sees the existing sits in that region they
 * could apply to.
 */

function openAuth(mode: "login" | "signup") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
}

function formatRange(start: string, end: string, locale: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const s = new Date(`${start}T00:00:00`).toLocaleDateString(locale, opts);
  const e = new Date(`${end}T00:00:00`).toLocaleDateString(locale, opts);
  return `${s} – ${e}`;
}

function AvailabilityWindowsSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-live="polite"
      className="mt-4 space-y-4"
      data-testid="availability-windows-skeleton"
    >
      {[0, 1].map((row) => (
        <li
          aria-hidden="true"
          className="rounded-2xl border border-line bg-white p-5 shadow-float"
          key={row}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <ShimmerBlock className="size-5 rounded-md" />
                <ShimmerBlock className={`h-5 ${row === 0 ? "w-48" : "w-40"}`} />
                <ShimmerBlock className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <ShimmerBlock className="size-4 rounded-md" />
                <ShimmerBlock className={`h-4 ${row === 0 ? "w-36" : "w-28"}`} />
              </div>
              <ShimmerBlock
                className={`h-4 ${row === 0 ? "w-[72%] max-w-md" : "w-[55%] max-w-sm"}`}
              />
            </div>
            <ShimmerBlock className="h-10 w-28 rounded-xl" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SitterAvailabilityPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: windows = [], isLoading } = useQuery({
    ...queries.availability.mine(),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-14 text-center lg:px-8">
        <h1 className="section-title">{t("availability.title")}</h1>
        <p className="mx-auto mt-3 max-w-md text-slate">{t("availability.signInText")}</p>
        <button
          className="mt-6 rounded-xl bg-navy px-6 py-3 font-bold text-white"
          data-testid="availability-sign-in"
          onClick={() => openAuth("login")}
          type="button"
        >
          {t("nav.login")}
        </button>
      </main>
    );
  }

  function renderWindows() {
    if (isLoading) return <AvailabilityWindowsSkeleton />;
    if (windows.length === 0) {
      return (
        <p
          className="mt-4 rounded-2xl border border-dashed border-line bg-cream/40 px-6 py-8 text-center text-slate"
          data-testid="availability-empty"
        >
          {t("availability.empty")}
        </p>
      );
    }
    return (
      <ul className="mt-4 space-y-4" data-testid="availability-windows">
        {windows.map((w) => (
          <WindowCard key={w.id} window={w} />
        ))}
      </ul>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 lg:px-8" data-testid="availability-page">
      <header>
        <h1 className="section-title">{t("availability.title")}</h1>
        <p className="mt-3 text-slate">{t("availability.subtitle")}</p>
      </header>

      <CreateWindowForm
        onCreated={() =>
          queryClient.invalidateQueries({ queryKey: queries.availability.getQueryKey() })
        }
      />

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-navy">
          {t("availability.windowsTitle")}
        </h2>
        {renderWindows()}
      </section>
    </main>
  );
}

function CreateWindowForm({ onCreated }: { onCreated: () => void }) {
  const { i18n, t } = useTranslation();
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [regionsValue, setRegionsValue] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const regions = useMemo(
    () =>
      regionsValue
        .split("|")
        .map((region) => region.trim())
        .filter(Boolean),
    [regionsValue],
  );

  const create = useMutation({
    mutationFn: (body: { dateStart: string; dateEnd: string; regions: string[]; notes: string }) =>
      apiPost<AvailabilityWindow>("/api/availability", body),
    onSuccess: () => {
      setDateStart("");
      setDateEnd("");
      setRegionsValue("");
      setNotes("");
      setError("");
      onCreated();
    },
    onError: (e) => setError(e instanceof Error ? e.message : t("availability.saveFailed")),
  });

  const publishBlockedReasons = useMemo(() => {
    const reasons: string[] = [];
    if (!dateStart || !dateEnd) reasons.push(t("availability.dates"));
    return reasons;
  }, [dateEnd, dateStart, t]);

  const publishDisabled = create.isPending || publishBlockedReasons.length > 0;
  const publishBlockedTooltip =
    publishBlockedReasons.length > 0
      ? t("availability.publishBlocked", {
          items: new Intl.ListFormat(getIntlLocale(i18n.language), {
            style: "long",
            type: "conjunction",
          }).format(publishBlockedReasons),
        })
      : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (publishDisabled) return;
    setError("");
    create.mutate({ dateStart, dateEnd, regions, notes: notes.trim() });
  }

  return (
    <form
      className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-float"
      data-testid="availability-create-form"
      onSubmit={submit}
    >
      <div>
        <span className="form-label">{t("availability.dates")}</span>
        <div className="mt-1">
          <DateRangePicker
            endDate={dateEnd}
            onChange={(next) => {
              setDateStart(next.startDate);
              setDateEnd(next.endDate);
            }}
            startDate={dateStart}
            testId="availability-dates"
            variant="browse"
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="form-label">{t("availability.regions")}</span>
        <p className="mb-2 text-xs text-slate">{t("availability.regionsHint")}</p>
        <DestinationAutocomplete
          multiple
          onChange={setRegionsValue}
          placeholder={t("availability.regionsPlaceholder")}
          testId="availability-destinations"
          value={regionsValue}
          variant="profile"
        />
      </div>

      <label className="mt-4 block">
        <span className="form-label">
          {t("availability.notes")}{" "}
          <span className="font-normal text-slate">({t("common.optional")})</span>
        </span>
        <textarea
          className="form-input min-h-20"
          data-testid="availability-notes"
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("availability.notesPlaceholder")}
          value={notes}
        />
      </label>

      {error ? (
        <p className="mt-3 text-sm font-semibold text-coral" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <IconTooltip
          hidden={!publishBlockedTooltip || create.isPending}
          label={publishBlockedTooltip}
          side="top"
          wrap
        >
          <button
            className="rounded-xl bg-coral px-6 py-3 font-bold text-white disabled:opacity-60"
            data-testid="availability-publish"
            disabled={publishDisabled}
            type="submit"
          >
            {create.isPending ? t("availability.publishing") : t("availability.publish")}
          </button>
        </IconTooltip>
      </div>
    </form>
  );
}

function WindowCard({ window: w }: { window: AvailabilityWindow }) {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const [showSits, setShowSits] = useState(false);
  const active = w.phase === "open" || w.phase === "booked";

  const phaseClassName = (() => {
    if (w.phase === "open") return "bg-teal/10 text-teal";
    if (w.phase === "booked") return "bg-navy/10 text-navy";
    if (w.phase === "completed") return "bg-slate/10 text-slate";
    if (w.phase === "expired") return "bg-amber-100 text-amber-700";
    return "bg-line text-slate";
  })();

  const withdraw = useMutation({
    mutationFn: () => apiDelete(`/api/availability/${w.id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queries.availability.getQueryKey() }),
  });

  const { data: sits = [], isLoading: sitsLoading } = useQuery({
    ...queries.availability.sits(w.id),
    enabled: showSits && w.phase === "open",
  });

  function renderSits() {
    if (sitsLoading) {
      return (
        <div aria-busy="true" aria-live="polite" className="mt-3 space-y-2">
          {[0, 1].map((row) => (
            <div
              aria-hidden="true"
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2"
              key={row}
            >
              <ShimmerBlock className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <ShimmerBlock className={`h-4 ${row === 0 ? "w-[58%]" : "w-[72%]"}`} />
                <ShimmerBlock className={`h-3 ${row === 0 ? "w-24" : "w-16"}`} />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (sits.length === 0) {
      return <p className="mt-3 text-sm text-slate">{t("availability.noMatchingSits")}</p>;
    }
    return (
      <ul className="mt-3 space-y-2" data-testid={`availability-matching-sits-${w.id}`}>
        {sits.map((s: AvailabilityMatchingSit) => (
          <li key={s.id}>
            <Link
              className="flex items-center gap-3 rounded-xl border border-line px-3 py-2 hover:border-teal"
              to={`/boats/${s.id}`}
            >
              <img
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
                src={s.vesselImage}
              />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-navy">{s.vesselName}</span>
                <span className="block truncate text-xs text-slate">
                  {s.location}, {s.country}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <li
      className="rounded-2xl border border-line bg-white p-5 shadow-float"
      data-testid={`availability-window-${w.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="text-teal" size={18} />
            <span className="font-semibold text-navy">
              {formatRange(w.dateStart, w.dateEnd, getIntlLocale(i18n.language))}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${phaseClassName}`}>
              {t(`availability.phase.${w.phase}`)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate">
            <MapPin size={15} />
            {w.regions.length > 0 ? w.regions.join(", ") : t("availability.openAnywhere")}
          </div>
          {w.notes ? <p className="mt-2 max-w-prose text-sm text-slate">{w.notes}</p> : null}
        </div>
        {active ? (
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-bold text-navy hover:border-coral hover:text-coral disabled:opacity-50"
            data-testid={`availability-withdraw-${w.id}`}
            disabled={withdraw.isPending}
            onClick={() => withdraw.mutate()}
            type="button"
          >
            <Trash2 size={15} />
            {t("availability.withdraw")}
          </button>
        ) : null}
      </div>

      {w.phase === "open" ? (
        <div className="mt-4 border-t border-line pt-4">
          <button
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal hover:text-navy"
            data-testid={`availability-toggle-sits-${w.id}`}
            onClick={() => setShowSits((s) => !s)}
            type="button"
          >
            <Ship size={16} />
            {showSits ? t("availability.hideMatchingSits") : t("availability.showMatchingSits")}
          </button>

          {showSits ? renderSits() : null}
        </div>
      ) : null}
    </li>
  );
}
