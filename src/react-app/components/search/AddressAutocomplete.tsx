import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AddressSuggestion } from "../../../shared/addressSearch";
import { queries } from "@/queries";
import { CharacterCount } from "@/components/ui/CharacterCount";
import { ShimmerBlock } from "@/components/ui/Shimmer";

function AddressSuggestionsSkeleton() {
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
            <ShimmerBlock className={`h-4 ${row % 2 === 0 ? "w-[68%]" : "w-[52%]"}`} />
            <ShimmerBlock className={`h-3 ${row % 2 === 0 ? "w-36" : "w-28"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

function photonLangFromI18n(language: string) {
  const base = language.toLowerCase().split("-")[0] ?? "en";
  const supported = new Set(["en", "de", "fr", "it", "es", "nl", "pt", "pl", "ru", "zh"]);
  if (supported.has(base)) return base;
  return "default";
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  testId,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  testId?: string;
  maxLength?: number;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveQuery = value.trim();
  const searchEnabled = liveQuery.length >= 3;

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(liveQuery), 220);
    return () => window.clearTimeout(handle);
  }, [liveQuery]);

  const lang = photonLangFromI18n(i18n.language);
  const { data: suggestions = [], isFetching } = useQuery({
    ...queries.addresses.search(debouncedQuery, lang),
    placeholderData: keepPreviousData,
    enabled: searchEnabled && debouncedQuery.length >= 3,
  });

  const queryPending = debouncedQuery !== liveQuery || isFetching;
  const staleWhileTyping = searchEnabled && queryPending;
  const showSkeleton =
    open && searchEnabled && ((isFetching && suggestions.length === 0) || staleWhileTyping);
  const showList = open && searchEnabled && suggestions.length > 0 && !staleWhileTyping;
  const showEmpty =
    open && searchEnabled && !staleWhileTyping && !isFetching && suggestions.length === 0;

  function choose(suggestion: AddressSuggestion) {
    const label = maxLength != null ? suggestion.label.slice(0, maxLength) : suggestion.label;
    onChange(label);
    setOpen(false);
    setActiveIndex(0);
  }

  return (
    <div className="relative" data-testid={testId}>
      <div className="relative">
        <textarea
          ref={inputRef}
          aria-autocomplete="list"
          aria-expanded={open && searchEnabled}
          autoComplete="street-address"
          className="form-input mt-1 min-h-24 resize-y"
          data-testid={testId ? `${testId}-input` : undefined}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
          onChange={(event) => {
            onChange(event.target.value);
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
            if (event.key === "Enter" && open && !staleWhileTyping && suggestions[activeIndex]) {
              event.preventDefault();
              choose(suggestions[activeIndex]);
            }
            if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          role="combobox"
          rows={3}
          maxLength={maxLength}
          value={value}
        />
        {maxLength != null ? (
          <CharacterCount
            className="absolute right-3 bottom-2"
            current={value.length}
            max={maxLength}
          />
        ) : null}
        {value ? (
          <button
            aria-label={t("address.clear")}
            className="absolute top-2.5 right-2 z-10 grid size-8 place-items-center rounded-full border border-line bg-white text-slate shadow-sm transition hover:border-teal hover:text-navy"
            data-testid={testId ? `${testId}-clear` : undefined}
            onClick={() => {
              onChange("");
              setActiveIndex(0);
              setOpen(true);
              inputRef.current?.focus();
            }}
            onMouseDown={(event) => event.preventDefault()}
            title={t("address.clear")}
            type="button"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        ) : null}
      </div>
      {(showList || showSkeleton || showEmpty) && (
        <div
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-float"
          data-testid="address-suggestions"
          role="listbox"
        >
          {showSkeleton ? <AddressSuggestionsSkeleton /> : null}
          {showEmpty ? (
            <p className="px-3 py-2.5 text-sm text-slate" data-testid="address-suggestions-empty">
              {t("address.noResults")}
            </p>
          ) : null}
          {showList
            ? suggestions.map((suggestion, index) => (
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                    activeIndex === index ? "bg-seafoam" : "hover:bg-cream"
                  }`}
                  data-testid="address-option"
                  key={suggestion.id}
                  onClick={() => choose(suggestion)}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                  type="button"
                >
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-cream text-teal">
                    {suggestion.countryCode ? (
                      <img
                        alt=""
                        className="h-full w-full rounded-lg object-cover"
                        src={`https://flagcdn.com/${suggestion.countryCode.toLowerCase()}.svg`}
                      />
                    ) : (
                      <MapPin size={16} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-navy">
                      {suggestion.primary}
                    </span>
                    {suggestion.secondary ? (
                      <span className="block truncate text-xs text-slate">
                        {suggestion.secondary}
                      </span>
                    ) : null}
                  </span>
                </button>
              ))
            : null}
        </div>
      )}
    </div>
  );
}
