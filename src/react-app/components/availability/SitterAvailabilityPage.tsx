import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Plus, Ship, Trash2, X } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/apiClient";
import { destinations } from "@/destinations";
import { Select } from "@/components/ui/Select";
import { useAppStore } from "@/store";

/**
 * Sitter availability — the one new page.
 *
 * A signed-in sitter publishes windows (date range + optional regions) when
 * they're free, and for each window sees the existing sits in that region they
 * could apply to. Self-contained: talks only to /api/availability, so it does
 * not touch the existing owner → sit → application flow.
 */

type AvailabilityWindow = {
  id: string;
  dateStart: string;
  dateEnd: string;
  regions: string[];
  notes: string;
  status: string;
  phase: "open" | "booked" | "expired" | "completed" | "withdrawn";
};

type MatchingSit = {
  id: string;
  dateStart: string;
  duration: string;
  location: string;
  country: string;
  vesselName: string;
  vesselImage: string;
};

const COUNTRY_NAMES = destinations
  .filter((d) => d.kind === "Country")
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b));

function openAuth(mode: "login" | "signup") {
  window.dispatchEvent(new CustomEvent("open-auth", { detail: mode }));
}

const PHASE_BADGE: Record<AvailabilityWindow["phase"], { label: string; className: string }> = {
  open: { label: "Open", className: "bg-teal/10 text-teal" },
  booked: { label: "Booked", className: "bg-navy/10 text-navy" },
  completed: { label: "Completed", className: "bg-slate/10 text-slate" },
  expired: { label: "Expired", className: "bg-amber-100 text-amber-700" },
  withdrawn: { label: "Withdrawn", className: "bg-line text-slate" },
};

function formatRange(start: string, end: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const s = new Date(`${start}T00:00:00`).toLocaleDateString(undefined, opts);
  const e = new Date(`${end}T00:00:00`).toLocaleDateString(undefined, opts);
  return `${s} – ${e}`;
}

export function SitterAvailabilityPage() {
  const user = useAppStore((state) => state.user);
  const queryClient = useQueryClient();

  const { data: windows = [], isLoading } = useQuery({
    queryKey: ["availability", "mine"],
    queryFn: () => apiGet<AvailabilityWindow[]>("/api/availability/mine"),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-navy">Your availability</h1>
        <p className="mx-auto mt-3 max-w-md text-slate">
          Sign in to publish when you&rsquo;re free to sit, and we&rsquo;ll show you the boats
          needing a sitter in those places and dates.
        </p>
        <button
          className="mt-6 rounded-xl bg-navy px-6 py-3 font-bold text-white"
          onClick={() => openAuth("login")}
          type="button"
        >
          Sign in
        </button>
      </div>
    );
  }

  function renderWindows() {
    if (isLoading) return <p className="mt-4 text-slate">Loading…</p>;
    if (windows.length === 0) {
      return (
        <p className="mt-4 rounded-2xl border border-dashed border-line bg-cream/40 px-6 py-8 text-center text-slate">
          No windows yet. Add one above to start getting matched with sits.
        </p>
      );
    }
    return (
      <ul className="mt-4 space-y-4">
        {windows.map((w) => (
          <WindowCard key={w.id} window={w} />
        ))}
      </ul>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-navy">Your availability</h1>
        <p className="mt-2 text-slate">
          Share the dates and places you&rsquo;re free to sit. Each open window shows the boats you
          could apply to right now.
        </p>
      </header>

      <CreateWindowForm
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["availability", "mine"] })}
      />

      <section className="mt-10">
        <h2 className="font-display text-lg font-bold text-navy">Published windows</h2>
        {renderWindows()}
      </section>
    </div>
  );
}

function CreateWindowForm({ onCreated }: { onCreated: () => void }) {
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [regions, setRegions] = useState<string[]>([]);
  const [regionToAdd, setRegionToAdd] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const create = useMutation({
    mutationFn: (body: { dateStart: string; dateEnd: string; regions: string[]; notes: string }) =>
      apiPost<AvailabilityWindow>("/api/availability", body),
    onSuccess: () => {
      setDateStart("");
      setDateEnd("");
      setRegions([]);
      setRegionToAdd("");
      setNotes("");
      setError("");
      onCreated();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Couldn't save. Try again."),
  });

  const availableToAdd = useMemo(
    () => COUNTRY_NAMES.filter((c) => !regions.includes(c)),
    [regions],
  );

  function addRegion() {
    if (regionToAdd && !regions.includes(regionToAdd)) {
      setRegions((r) => [...r, regionToAdd]);
      setRegionToAdd("");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!dateStart || !dateEnd) {
      setError("Pick a start and end date.");
      return;
    }
    if (dateEnd < dateStart) {
      setError("End date must be on or after the start date.");
      return;
    }
    create.mutate({ dateStart, dateEnd, regions, notes: notes.trim() });
  }

  return (
    <form className="rounded-2xl border border-line bg-white p-6 shadow-float" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="form-label">Available from</span>
          <input
            className="form-input"
            onChange={(e) => setDateStart(e.target.value)}
            type="date"
            value={dateStart}
          />
        </label>
        <label className="block">
          <span className="form-label">Available until</span>
          <input
            className="form-input"
            onChange={(e) => setDateEnd(e.target.value)}
            type="date"
            value={dateEnd}
          />
        </label>
      </div>

      <div className="mt-4">
        <span className="form-label">Regions</span>
        <p className="mb-2 text-xs text-slate">
          Leave empty to be open to anywhere, or add specific countries.
        </p>
        {regions.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {regions.map((r) => (
              <span
                key={r}
                className="inline-flex items-center gap-1 rounded-full bg-cream px-3 py-1 text-sm font-semibold text-navy"
              >
                {r}
                <button
                  aria-label={`Remove ${r}`}
                  className="text-slate hover:text-coral"
                  onClick={() => setRegions((cur) => cur.filter((x) => x !== r))}
                  type="button"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Select
            aria-label="Add a country"
            className="flex-1"
            onChange={(e) => setRegionToAdd(e.target.value)}
            value={regionToAdd}
            variant="form"
          >
            <option value="">Add a country…</option>
            {availableToAdd.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <button
            className="shrink-0 rounded-xl border border-line px-4 py-3 font-bold text-navy disabled:opacity-50"
            disabled={!regionToAdd}
            onClick={addRegion}
            type="button"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <label className="mt-4 block">
        <span className="form-label">Notes (optional)</span>
        <textarea
          className="form-input min-h-20"
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything owners should know — experience, flexibility, pets you love…"
          value={notes}
        />
      </label>

      {error && (
        <p className="mt-3 text-sm font-semibold text-coral" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          className="rounded-xl bg-coral px-6 py-3 font-bold text-white disabled:opacity-60"
          disabled={create.isPending}
          type="submit"
        >
          {create.isPending ? "Publishing…" : "Publish availability"}
        </button>
      </div>
    </form>
  );
}

function WindowCard({ window: w }: { window: AvailabilityWindow }) {
  const queryClient = useQueryClient();
  const [showSits, setShowSits] = useState(false);
  const badge = PHASE_BADGE[w.phase];
  const active = w.phase === "open" || w.phase === "booked";

  const withdraw = useMutation({
    mutationFn: () => apiDelete(`/api/availability/${w.id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability", "mine"] }),
  });

  const { data: sits = [], isLoading: sitsLoading } = useQuery({
    queryKey: ["availability", w.id, "sits"],
    queryFn: () => apiGet<MatchingSit[]>(`/api/availability/${w.id}/sits`),
    enabled: showSits && w.phase === "open",
  });

  function renderSits() {
    if (sitsLoading) return <p className="mt-3 text-sm text-slate">Finding sits…</p>;
    if (sits.length === 0) {
      return (
        <p className="mt-3 text-sm text-slate">
          No open sits match this window yet. Check back — new sits appear as owners post them.
        </p>
      );
    }
    return (
      <ul className="mt-3 space-y-2">
        {sits.map((s) => (
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
    <li className="rounded-2xl border border-line bg-white p-5 shadow-float">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="text-teal" size={18} />
            <span className="font-semibold text-navy">{formatRange(w.dateStart, w.dateEnd)}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate">
            <MapPin size={15} />
            {w.regions.length > 0 ? w.regions.join(", ") : "Open to anywhere"}
          </div>
          {w.notes && <p className="mt-2 max-w-prose text-sm text-slate">{w.notes}</p>}
        </div>
        {active && (
          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-bold text-navy hover:border-coral hover:text-coral disabled:opacity-50"
            disabled={withdraw.isPending}
            onClick={() => withdraw.mutate()}
            type="button"
          >
            <Trash2 size={15} />
            Withdraw
          </button>
        )}
      </div>

      {w.phase === "open" && (
        <div className="mt-4 border-t border-line pt-4">
          <button
            className="inline-flex items-center gap-1.5 text-sm font-bold text-teal hover:text-navy"
            onClick={() => setShowSits((s) => !s)}
            type="button"
          >
            <Ship size={16} />
            {showSits ? "Hide matching sits" : "Show matching sits"}
          </button>

          {showSits && renderSits()}
        </div>
      )}
    </li>
  );
}
