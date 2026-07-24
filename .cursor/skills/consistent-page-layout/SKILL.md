---
name: consistent-page-layout
description: >-
  Match Boatstead authenticated and list-page layout chrome. Use automatically
  whenever adding or editing pages, routes, screen headers, titles, subtitles,
  back links, empty states, or form shells in src/react-app. Prefer the shared
  section-title pattern and existing form/search components over one-off
  layouts. Empty-state actions must be buttons, never text links.
---

# Consistent Page Layout

New screens must look like existing Boatstead pages. Do not invent a smaller
title, different page padding, or a custom date/destination control when a
shared pattern already exists.

## Page chrome (list / settings / account pages)

Use this shell unless the screen is an editor card (vessel/sit editor) or a
marketing/landing surface:

```tsx
<main className="mx-auto max-w-* px-5 py-14 lg:px-8">
  <h1 className="section-title">{t("feature.title")}</h1>
  <p className="mt-3 text-slate">{t("feature.subtitle")}</p>
  {/* content */}
</main>
```

Rules:

1. Title uses the shared **`section-title`** class from `index.css`. Never
   substitute `font-display text-2xl` / `text-3xl` on list-style pages.
2. Subtitle is `mt-3 text-slate` (one short supporting sentence).
3. Horizontal padding is `px-5` with `lg:px-8`. Vertical padding is typically
   `py-12` or `py-14`.
4. Width follows peers: `max-w-3xl` for focused forms, `max-w-5xl` /
   `max-w-6xl` / `max-w-7xl` for wider dashboards. Match the closest existing
   page rather than inventing a new max-width.
5. Optional back control: `ArrowLeft` + `t("common.back")` (or a domain back
   key), placed above the title like Applications.

Reference peers: Settings, Saved, Owner boats/sits, Support, Availability.

## Editors (vessel / sit)

Editors keep their card-style `font-display text-3xl` title and explicit back
button (`data-testid="…-back"`). Do not force `section-title` onto those.

## Empty states

When putting an action for empty set, always use a button.

Do **not** use a text link or underline-only control as the empty-state CTA.
Match peer empty actions (solid pill button):

```tsx
<button
  className="mt-4 inline-flex rounded-full bg-teal px-6 py-3 font-bold text-white hover:bg-teal/90"
  data-testid="feature-empty-action"
  onClick={...}
  type="button"
>
  {t("feature.emptyAction")}
</button>
```

`Link` is fine when navigation is the action, but style it as the same button
(not `text-teal hover:underline`).

## Shared form and search controls

Before building a control, reuse the existing one:

| Need                             | Use                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Date range                       | `DateRangePicker` from `@/components/forms/DateRangePicker` (`variant="browse"` in forms; `"home"` only in the homepage search strip) |
| Country / city (single or multi) | `DestinationAutocomplete` from `@/components/search/DestinationAutocomplete` (`multiple` + `\|`-joined value like search/profile)     |
| Native select                    | `Select` from `@/components/ui/Select`                                                                                                |
| Disabled primary CTA reasons     | `IconTooltip` + `Intl.ListFormat` + a `*.publishBlocked` / blocked key (`Still needed: {{items}}`), same as vessel/sit publish        |
| Confirm / alert / prompt         | `ConfirmDialog` only (never `window.confirm`)                                                                                         |
| Loading                          | Layout-aware `ShimmerBlock` skeleton (see `loading-shimmer`)                                                                          |

Do **not** use raw `<input type="date">`, ad-hoc country `<Select>` + Plus chip
rows, or always-enabled publish buttons that only validate on submit when the
blocked-tooltip pattern fits.

## Checklist

- [ ] Header matches a peer page (`section-title` + subtitle, or editor card)
- [ ] Dates / destinations / selects / tooltips reuse shared components
- [ ] No parallel one-off implementation of an existing control
- [ ] Empty-state actions use a solid button, not a text link
- [ ] Copy goes through i18n; blocked CTA lists missing fields on hover
- [ ] Loading uses a detailed shimmer, not a single pulse line
