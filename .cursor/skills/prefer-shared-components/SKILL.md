---
name: prefer-shared-components
description: >-
  Prefer building a UI primitive once in a shared file and reusing it across
  the site. Use automatically when adding or fixing buttons, selects, inputs,
  modals, confirm dialogs, badges, cards, skeletons, or any control that already
  exists in components/ui or would otherwise be copy-pasted. Never use
  window.confirm, window.alert, or window.prompt.
---

# Prefer Shared Components

Favor **build once, share everywhere**. Do not fix a visual or behavior bug in
one call site while leaving the same pattern duplicated elsewhere.

## Rules

1. Before adding a new control, search `src/react-app/components/` for an
   existing shared component (`Select`, `ShimmerBlock`, `IconTooltip`, etc.).
2. If the control already exists, **import and reuse it**. Do not paste a
   one-off `<select>`, button, modal shell, or caret style.
3. If it does not exist yet, create it under `components/ui/` (or the matching
   domain folder), then use that shared export at every call site in the same
   change.
4. When fixing a bug (caret, contrast, spacing, a11y), update the **shared
   component and CSS**, then migrate remaining raw usages in the same PR.
5. Never leave parallel implementations of the same control (e.g. raw
   `<select className="form-input">` beside `<Select variant="form">`).
6. Site-wide look-and-feel that depends on CSS (carets, focus rings, form
   chrome) belongs on the shared class or component, not ad-hoc per page.

## Select example

Always use:

```tsx
import { Select } from "@/components/ui/Select";

<Select variant="form" value={value} onChange={...}>
  <option value="a">A</option>
</Select>
```

Variants: `filter`, `sort`, `form`, `inline`. The shared `.select-control`
class owns the caret. Do not invent another chevron.

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
