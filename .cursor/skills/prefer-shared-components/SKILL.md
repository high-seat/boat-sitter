---
name: prefer-shared-components
description: >-
  Prefer building a UI primitive once in a shared file and reusing it across
  the site. Use automatically when adding or fixing buttons, selects, inputs,
  date ranges, destination/country/city pickers, modals, confirm dialogs,
  badges, cards, skeletons, tooltips, disabled CTAs, or any control that
  already exists in components/ui, components/forms, or components/search, or
  that would otherwise be copy-pasted. Never use window.confirm, window.alert,
  or window.prompt. Pair with consistent-page-layout for page chrome.
---

# Prefer Shared Components

Favor **build once, share everywhere**. Do not fix a visual or behavior bug in
one call site while leaving the same pattern duplicated elsewhere.

Also follow **consistent-page-layout** for page headers, padding, and which
shared form controls belong on list/form screens.

## Rules

1. Before adding a new control, search `src/react-app/components/` for an
   existing shared component (`Select`, `ShimmerBlock`, `IconTooltip`,
   `DateRangePicker`, `DestinationAutocomplete`, `ConfirmDialog`, etc.).
2. If the control already exists, **import and reuse it**. Do not paste a
   one-off `<select>`, `<input type="date">`, button, modal shell, or caret
   style.
3. If it does not exist yet, create it under `components/ui/` (or the matching
   domain folder), then use that shared export at every call site in the same
   change.
4. When fixing a bug (caret, contrast, spacing, a11y), update the **shared
   component and CSS**, then migrate remaining raw usages in the same PR.
5. Never leave parallel implementations of the same control (e.g. raw
   `<select className="form-input">` beside `<Select variant="form">`).
6. Site-wide look-and-feel that depends on CSS (carets, focus rings, form
   chrome) belongs on the shared class or component, not ad-hoc per page.

## High-value shared controls

| Need                              | Import                                        |
| --------------------------------- | --------------------------------------------- |
| Select                            | `@/components/ui/Select`                      |
| Date range                        | `@/components/forms/DateRangePicker`          |
| Country / city autocomplete       | `@/components/search/DestinationAutocomplete` |
| Street / marina address search    | `@/components/search/AddressAutocomplete`     |
| Hover tooltip (incl. blocked CTA) | `@/components/ui/IconTooltip`                 |
| Confirm dialog                    | `@/components/ui/ConfirmDialog`               |
| Loading placeholder               | `@/components/ui/Shimmer` (`ShimmerBlock`)    |

### Select

```tsx
import { Select } from "@/components/ui/Select";

<Select variant="form" value={value} onChange={...}>
  <option value="a">A</option>
</Select>
```

Variants: `filter`, `sort`, `form`, `inline`. The shared `.select-control`
class owns the caret. Do not invent another chevron.

### Date range

```tsx
import { DateRangePicker } from "@/components/forms/DateRangePicker";

<DateRangePicker
  startDate={start}
  endDate={end}
  onChange={setRange}
  variant="browse"
  testId="feature-dates"
/>;
```

Use `variant="home"` only inside the homepage search strip. Forms and filters
use `browse`.

### Destination / country / city

```tsx
import { DestinationAutocomplete } from "@/components/search/DestinationAutocomplete";

<DestinationAutocomplete
  multiple
  value={regions.join("|")}
  onChange={(next) =>
    setRegions(
      next
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }
  variant="profile"
  testId="feature-destinations"
/>;
```

Multi-select values are `|`-joined (same as search and profile preferred
countries). Prefer this over a country `<Select>` plus manual chips.

### Disabled primary CTA + missing fields

Mirror vessel/sit publish: collect reason labels, disable the button, wrap with
`IconTooltip` (`side="top"`, `wrap`), format with `Intl.ListFormat` and a
`Still needed: {{items}}` translation key. Do not rely on submit-time-only
validation for required fields when this pattern applies.

## Confirmations

**Never use** `window.confirm`, `window.alert`, or `window.prompt`.

Always use the shared HTML/CSS dialog:

```tsx
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
```

For domain-specific confirms (close applications, accept applicant), reuse
`ConfirmDialog` or a thin wrapper around it. Do not ship browser chrome that
says `127.0.0.1 says…`.

## Checklist

- Search for duplicates of the control before shipping
- One shared file owns the look
- All call sites migrated in the same change when fixing a shared bug
- No `window.confirm` / `alert` / `prompt` left in production UI
- Page headers and shared form controls also satisfy `consistent-page-layout`
