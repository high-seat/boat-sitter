---
name: translate-user-facing-strings
description: Enforces complete Boatstead internationalization. Use automatically whenever adding or changing UI components, routes, forms, validation, notifications, accessibility labels, metadata, or any text a user can see or hear.
---

# Translate User-Facing Strings

Every user-facing string shipped to users must be translated through i18next. Dev-only strings are the sole exception and must follow rule 10.

## Rules

1. Never hardcode visible text in React, HTML, validation messages, dialogs, placeholders, labels, buttons, empty states, loading states, errors, accessibility labels, or document metadata.
2. Add a semantic English key to `src/react-app/i18n.ts`, then add a natural translation for every language in `SUPPORTED_LANGUAGES`.
3. Use `t("key")` in components. For interpolated values, use i18next variables rather than string concatenation.
4. Translate option labels even when stored model values remain stable English identifiers.
5. Keep names, vessel names, locations, certification names, and user-provided content unchanged unless a localized display label is explicitly defined.
6. Before completing any UI task, search every changed file for newly introduced user-facing literals and fix them.
7. Exercise the changed flow in at least two languages during Playwright verification.
8. Never use an em dash (`—`) in any user-facing string. Rewrite the sentence with punctuation or wording that reads naturally without one.
9. Use US English spelling for the default source copy and translation keys. Keep UK English as a separate complete locale, never as the default.
10. Never translate a string that is exclusively shown in development builds behind a compile-time `import.meta.env.DEV` guard. Keep it as hardcoded US English and do not add it to translation catalogs or wrap it in `t()`. This exception does not apply to production UI whose content merely varies by environment.

## Audit checklist

- Headings, paragraphs, links, buttons, tabs, chips, and badges
- Form labels, placeholders, options, helper text, errors, and pending text
- Modal, confirmation, success, empty, loading, and access-denied states
- `aria-label`, `alt`, `title`, and other assistive text
- Number, date, duration, and list formatting through the active locale
- Page title and metadata when changed dynamically

Do not call a UI change complete while untranslated production-facing literals remain.
