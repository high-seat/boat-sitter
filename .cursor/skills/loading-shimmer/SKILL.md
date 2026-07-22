---
name: loading-shimmer
description: >-
  Adds detailed shimmer skeletons for every loading state in Boatstead UI.
  Use automatically whenever introducing or changing async data fetches,
  page-level loading gates, or replacing generic pulse blocks with layout-aware
  placeholders.
---

# Loading Shimmer

Every loading state must use a **detailed shimmer skeleton** that mirrors the
real layout. Generic full-width pulse blocks are not acceptable for page or
section loads.

## Rules

1. Reuse `ShimmerBlock` from `src/react-app/components/ui/Shimmer.tsx` and the
   shared `.shimmer` animation in `index.css`.
2. Match the loaded UI structure: headings, cards, avatars, chips, buttons,
   sidebars, galleries, and list rows should each have their own placeholder.
3. Vary line widths (`w-[72%]`, `max-w-md`, etc.) so blocks feel natural, not
   like a flat rectangle.
4. Preserve page grid and spacing (`max-w-*`, `lg:grid-cols-*`, `sticky`,
   `border-b`, section padding) from the real component.
5. Set `aria-busy="true"` and `aria-live="polite"` on the skeleton root; mark
   decorative blocks `aria-hidden="true"`.
6. Respect `prefers-reduced-motion` via the existing `.shimmer` CSS fallback.
7. Name skeleton components after the view they represent
   (`SitDetailSkeleton`, `BoatCardSkeleton`, etc.) and colocate under
   `components/ui/` when shared.
8. When adding a new route or panel with `isLoading`, add or extend a skeleton
   in the same change. Do not ship a single `animate-pulse` div.

## Checklist per loading state

- Page chrome (back link, title row, actions)
- Media (hero image, gallery thumbs, map)
- Primary content sections with titles and body lines
- Lists, chips, badges, and icon rows
- Sidebar / sticky cards with CTA buttons
- Toolbar controls (filters, sort, counts)

## Visual balance

- Aim for **recognizable structure**, not pixel-perfect duplication.
- Use fewer placeholders on mobile when the loaded view collapses sections.
- Keep shimmer contrast soft (seafoam/aqua gradient); avoid harsh flashing.

## Related skills

- Follow `verify-ui-with-playwright` and briefly exercise the loading state
  (e.g. throttle network or catch the skeleton before data resolves).
