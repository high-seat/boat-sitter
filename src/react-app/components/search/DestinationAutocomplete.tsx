import { useEffect, useMemo, useRef, useState } from "react";
import { Compass, MapPin, Pencil, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { countryIsoFromName } from "@/countryUtils";
import type { Destination } from "@/destinations";
import { queries } from "@/queries";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import { TOP_BOAT_SITTING_PORT_CITY_LIMIT } from "../../../shared/popularPortCities";

function DestinationSuggestionsSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-0.5 p-0.5">
      {[0, 1, 2, 3].map((row) => (
        <div
          aria-hidden="true"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5"
          key={row}
        >
          <ShimmerBlock className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <ShimmerBlock className={`h-4 ${row % 2 === 0 ? "w-[58%]" : "w-[72%]"}`} />
            <ShimmerBlock className={`h-3 ${row % 2 === 0 ? "w-24" : "w-16"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function selectedCountryCode(selected: string) {
  const parts = selected
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) return countryIsoFromName(parts.at(-1)!);
  return countryIsoFromName(selected);
}

export function DestinationAutocomplete({
  value,
  onChange,
  variant = "browse",
  cityOnly = false,
  countryOnly = false,
  includeCountry = false,
  multiple = false,
  requireSelection = false,
  onSelect,
  placeholder,
  testId,
}: {
  value: string;
  onChange: (value: string) => void;
  variant?: "home" | "browse" | "profile";
  cityOnly?: boolean;
  countryOnly?: boolean;
  includeCountry?: boolean;
  multiple?: boolean;
  /** When true, typing only filters suggestions; the value updates on pick. */
  requireSelection?: boolean;
  onSelect?: (destination: Destination) => void;
  placeholder?: string;
  testId?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [editing, setEditing] = useState(!value.trim());
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedDestinations = useMemo(
    () =>
      multiple
        ? value
            .split("|")
            .map((destination) => destination.trim())
            .filter(Boolean)
        : [],
    [multiple, value],
  );

  const usesDraft = multiple || requireSelection;
  const showSelectedPreview = requireSelection && !multiple && Boolean(value.trim()) && !editing;
  const inputValue = usesDraft ? draft : value;
  const liveQuery = (() => {
    if (multiple) return draft.trim();
    if (requireSelection) {
      if (showSelectedPreview) return "";
      // Keep browsing top ports until the user types a search query.
      return draft.trim();
    }
    return value.trim();
  })();

  useEffect(() => {
    // Multiple mode keeps draft as the live search query only; never mirror the
    // pipe-joined selection string into the input.
    if (multiple) {
      setDraft("");
      return;
    }
    if (requireSelection && !value.trim()) {
      setEditing(true);
      setDraft("");
    }
  }, [multiple, requireSelection, value]);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(liveQuery), 180);
    return () => window.clearTimeout(handle);
  }, [liveQuery]);

  let kind: "city" | "country" | "all" = "all";
  if (countryOnly) kind = "country";
  else if (cityOnly) kind = "city";
  const { data: remoteSuggestions = [], isFetching } = useQuery({
    ...queries.destinations.search(kind, debouncedQuery),
    placeholderData: keepPreviousData,
    enabled: !showSelectedPreview,
  });

  const suggestions = useMemo(() => {
    const maxVisible = liveQuery ? 8 : TOP_BOAT_SITTING_PORT_CITY_LIMIT;
    const filtered = remoteSuggestions.filter((destination) => {
      const selection =
        includeCountry && destination.kind === "City"
          ? `${destination.name}, ${destination.detail}`
          : destination.name;
      return !selectedDestinations.includes(selection);
    });
    // Typed searches keep countries ahead of cities; empty focus keeps API order
    // (top port cities for this market).
    if (!liveQuery) return filtered.slice(0, maxVisible);
    return filtered
      .slice()
      .sort((a, b) => {
        if (a.kind === b.kind) return 0;
        return a.kind === "Country" ? -1 : 1;
      })
      .slice(0, maxVisible);
  }, [includeCountry, liveQuery, remoteSuggestions, selectedDestinations]);

  // Avoid committing a previous list while a typed query is still pending.
  const queryPending = debouncedQuery !== liveQuery || isFetching;
  const staleWhileTyping = requireSelection && Boolean(liveQuery) && queryPending;
  const showSkeleton =
    !showSelectedPreview && open && ((isFetching && suggestions.length === 0) || staleWhileTyping);
  const showList = !showSelectedPreview && open && suggestions.length > 0 && !staleWhileTyping;

  function startEditing() {
    setEditing(true);
    setDraft("");
    setOpen(true);
    setActiveIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function finishEditing(nextValue = value) {
    setDraft("");
    setOpen(false);
    setActiveIndex(0);
    if (nextValue.trim()) setEditing(false);
    else setEditing(true);
  }

  function choose(destination: Destination) {
    onSelect?.(destination);
    const selection =
      includeCountry && destination.kind === "City"
        ? `${destination.name}, ${destination.detail}`
        : destination.name;
    if (multiple) {
      onChange([...selectedDestinations, selection].join("|"));
      setDraft("");
      setOpen(true);
      window.setTimeout(() => inputRef.current?.focus());
    } else {
      onChange(selection);
      if (requireSelection) finishEditing(selection);
      else setOpen(false);
    }
    setActiveIndex(0);
  }

  function removeSelection(selection: string) {
    onChange(selectedDestinations.filter((destination) => destination !== selection).join("|"));
    inputRef.current?.focus();
  }

  function suggestionCountryCode(destination: Destination) {
    if (destination.countryCode) return destination.countryCode;
    if (destination.kind === "City") return countryIsoFromName(destination.detail);
    if (destination.kind === "Country") return countryIsoFromName(destination.name);
    return undefined;
  }

  let containerClass = "relative flex flex-1 items-center gap-3 rounded-xl bg-cream px-4";
  if (variant === "home") {
    containerClass =
      "relative flex items-center gap-3 border-b border-line px-5 py-4 md:border-r md:border-b-0";
  } else if (variant === "profile") {
    containerClass =
      "relative flex flex-1 items-center gap-3 rounded-xl border border-line bg-cream px-4";
  }

  let placeholderText = t("boats.destination");
  if (placeholder) placeholderText = placeholder;
  else if (variant === "home") placeholderText = t("search.destination");
  else if (variant === "profile") placeholderText = t("profile.locationPlaceholder");

  const previewCode = value.trim() ? selectedCountryCode(value.trim()) : undefined;

  if (showSelectedPreview) {
    return (
      <div className={containerClass} data-testid={testId}>
        <span
          className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-cream text-teal"
          aria-hidden="true"
        >
          {previewCode ? (
            <img
              alt=""
              className="h-full w-full rounded-lg object-cover"
              src={`https://flagcdn.com/${previewCode.toLowerCase()}.svg`}
            />
          ) : (
            <MapPin size={16} />
          )}
        </span>
        <p
          className={`min-w-0 flex-1 truncate text-sm font-semibold text-navy ${
            variant === "home" ? "font-medium" : "py-3.5"
          }`}
          data-testid={testId ? `${testId}-selected` : undefined}
        >
          {value}
        </p>
        <button
          aria-label={t("common.edit")}
          className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-white text-slate shadow-sm transition hover:border-teal hover:text-navy"
          data-testid={testId ? `${testId}-edit` : undefined}
          onClick={startEditing}
          title={t("common.edit")}
          type="button"
        >
          <Pencil size={15} strokeWidth={2.25} />
        </button>
      </div>
    );
  }

  return (
    <div className={containerClass} data-testid={testId}>
      {variant === "home" ? (
        <MapPin className="shrink-0 text-coral" size={20} />
      ) : (
        <Search className="shrink-0 text-slate" size={18} />
      )}
      <label className="min-w-0 flex-1">
        {variant === "home" && (
          <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-slate">
            {t("search.where")}
          </span>
        )}
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          {selectedDestinations.map((destination) => (
            <span
              className="flex max-w-full items-center gap-1 rounded-full bg-seafoam px-2.5 py-1 text-xs font-semibold text-navy"
              key={destination}
            >
              <span className="truncate">{destination}</span>
              <button
                aria-label={t("destination.remove", { destination })}
                className="shrink-0 rounded-full p-0.5 text-slate hover:bg-white hover:text-navy"
                onClick={() => removeSelection(destination)}
                onMouseDown={(event) => event.preventDefault()}
                type="button"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            aria-autocomplete="list"
            aria-expanded={open}
            autoComplete="off"
            className={`min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-slate/70 ${
              value || draft ? "pr-8" : ""
            } ${variant === "home" ? "font-medium" : "py-3.5"}`}
            data-testid={testId ? `${testId}-input` : undefined}
            onBlur={() => {
              window.setTimeout(() => {
                setOpen(false);
                if (requireSelection && !multiple) {
                  setDraft("");
                  if (value.trim()) setEditing(false);
                }
              }, 120);
            }}
            onChange={(event) => {
              if (usesDraft) setDraft(event.target.value);
              else onChange(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => {
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                if (open && !staleWhileTyping && suggestions[activeIndex]) {
                  choose(suggestions[activeIndex]);
                }
              }
              if (event.key === "Backspace" && multiple && !draft && selectedDestinations.length) {
                removeSelection(selectedDestinations.at(-1)!);
              }
              if (event.key === "Escape") {
                setOpen(false);
                if (requireSelection && !multiple) {
                  setDraft("");
                  if (value.trim()) setEditing(false);
                }
              }
            }}
            placeholder={placeholderText}
            role="combobox"
            value={inputValue}
          />
        </span>
      </label>
      {(value || draft) && (
        <button
          aria-label={t("destination.clear")}
          className="absolute right-2 z-10 grid size-8 place-items-center rounded-full border border-line bg-white text-slate shadow-sm transition hover:border-teal hover:text-navy"
          data-testid={testId ? `${testId}-clear` : undefined}
          onClick={() => {
            onChange("");
            setDraft("");
            setEditing(true);
            setActiveIndex(0);
            setOpen(true);
            inputRef.current?.focus();
          }}
          onMouseDown={(event) => event.preventDefault()}
          title={t("destination.clear")}
          type="button"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
      {(showList || showSkeleton) && (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-float"
          data-testid="destination-suggestions"
          role="listbox"
        >
          {showSkeleton ? <DestinationSuggestionsSkeleton /> : null}
          {showList
            ? suggestions.map((destination, index) => {
                const code = suggestionCountryCode(destination);
                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                      activeIndex === index ? "bg-seafoam" : "hover:bg-cream"
                    }`}
                    data-testid={`destination-option-${destination.kind.toLowerCase()}`}
                    key={`${destination.kind}-${destination.name}-${destination.detail}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(destination)}
                    role="option"
                    type="button"
                  >
                    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-cream text-teal">
                      {code ? (
                        <img
                          alt=""
                          className="h-full w-full rounded-lg object-cover"
                          src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
                        />
                      ) : null}
                      {!code && destination.kind === "City" ? <MapPin size={16} /> : null}
                      {!code && destination.kind !== "City" ? <Compass size={16} /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">
                        {destination.name}
                      </span>
                      {destination.kind === "City" && (
                        <span className="block truncate text-xs text-slate">
                          {destination.detail}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            : null}
        </div>
      )}
    </div>
  );
}
