import { useEffect, useMemo, useRef, useState } from "react";
import { getCode } from "country-list";
import { Compass, MapPin, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { destinations, type Destination } from "@/destinations";

const COUNTRY_CODE_OVERRIDES: Record<string, string> = {
  "Ivory Coast": "CI",
  "North Korea": "KP",
  "South Korea": "KR",
  Türkiye: "TR",
  "United Kingdom": "GB",
  "United States": "US",
  "Vatican City": "VA",
};

function countryCode(name: string) {
  return COUNTRY_CODE_OVERRIDES[name] ?? getCode(name);
}

export function DestinationAutocomplete({
  value,
  onChange,
  variant = "browse",
  cityOnly = false,
  countryOnly = false,
  includeCountry = false,
  multiple = false,
  onSelect,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  variant?: "home" | "browse" | "profile";
  cityOnly?: boolean;
  countryOnly?: boolean;
  includeCountry?: boolean;
  multiple?: boolean;
  onSelect?: (destination: Destination) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState("");
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

  useEffect(() => {
    if (!multiple) setDraft(value);
  }, [multiple, value]);

  const suggestions = useMemo(() => {
    const source = countryOnly
      ? destinations.filter((destination) => destination.kind === "Country")
      : cityOnly
        ? destinations.filter((destination) => destination.kind === "City")
        : destinations;
    const query = (multiple ? draft : value).trim().toLowerCase();
    const matches = query
      ? source
          .filter(
            (destination) =>
              destination.name.toLowerCase().includes(query) ||
              destination.detail.toLowerCase().includes(query) ||
              `${destination.name}, ${destination.detail}`.toLowerCase().includes(query),
          )
          .sort((a, b) => {
            const aStarts = a.name.toLowerCase().startsWith(query) ? 0 : 1;
            const bStarts = b.name.toLowerCase().startsWith(query) ? 0 : 1;
            return aStarts - bStarts || a.name.localeCompare(b.name);
          })
      : source.filter((destination) =>
          ["Greece", "Spain", "United Kingdom", "Grenada", "Canada", "United States"].includes(
            destination.name,
          ),
        );
    return matches
      .filter((destination) => {
        const selection =
          includeCountry && destination.kind === "City"
            ? `${destination.name}, ${destination.detail}`
            : destination.name;
        return !selectedDestinations.includes(selection);
      })
      .slice(0, 8);
  }, [cityOnly, countryOnly, draft, includeCountry, multiple, selectedDestinations, value]);

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
      setOpen(false);
    }
    setActiveIndex(0);
  }

  function removeSelection(selection: string) {
    onChange(selectedDestinations.filter((destination) => destination !== selection).join("|"));
    inputRef.current?.focus();
  }

  return (
    <div
      className={
        variant === "home"
          ? "relative flex items-center gap-3 border-b border-line px-5 py-4 md:border-r md:border-b-0"
          : variant === "profile"
            ? "relative flex flex-1 items-center gap-3 rounded-xl border border-line bg-white px-4"
            : "relative flex flex-1 items-center gap-3 rounded-xl bg-cream px-4"
      }
    >
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
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              if (multiple) setDraft(event.target.value);
              else onChange(event.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
              if (event.key === "Enter" && open && suggestions[activeIndex]) {
                event.preventDefault();
                choose(suggestions[activeIndex]);
              }
              if (event.key === "Backspace" && multiple && !draft && selectedDestinations.length) {
                removeSelection(selectedDestinations.at(-1)!);
              }
              if (event.key === "Escape") setOpen(false);
            }}
            placeholder={
              placeholder ??
              (variant === "home"
                ? t("search.destination")
                : variant === "profile"
                  ? t("profile.locationPlaceholder")
                  : t("boats.destination"))
            }
            role="combobox"
            value={multiple ? draft : value}
          />
        </span>
      </label>
      {(value || draft) && (
        <button
          aria-label={t("destination.clear")}
          className="absolute right-2 z-10 grid size-8 place-items-center rounded-full border border-line bg-white text-slate shadow-sm transition hover:border-teal hover:text-navy"
          onClick={() => {
            onChange("");
            setDraft("");
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
      {open && suggestions.length > 0 && (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-float"
          role="listbox"
        >
          {suggestions.map((destination, index) => (
            <button
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                activeIndex === index ? "bg-seafoam" : "hover:bg-cream"
              }`}
              key={`${destination.kind}-${destination.name}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(destination)}
              role="option"
              type="button"
            >
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-cream text-teal">
                {countryCode(
                  destination.kind === "City" ? destination.detail : destination.name,
                ) ? (
                  <img
                    alt=""
                    className="h-full w-full rounded-lg object-cover"
                    src={`https://flagcdn.com/${countryCode(
                      destination.kind === "City" ? destination.detail : destination.name,
                    )!.toLowerCase()}.svg`}
                  />
                ) : destination.kind === "City" ? (
                  <MapPin size={16} />
                ) : (
                  <Compass size={16} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy">
                  {destination.name}
                </span>
                {destination.kind === "City" && (
                  <span className="block truncate text-xs text-slate">{destination.detail}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
