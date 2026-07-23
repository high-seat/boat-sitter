---
name: translate-user-facing-strings
description: Enforces complete Boatstead internationalization. Use automatically whenever adding or changing UI components, routes, forms, validation, notifications, accessibility labels, metadata, or any text a user can see or hear.
---

# Translate User-Facing Strings

Every user-facing string shipped to users must be translated through i18next. Dev-only strings are the sole exception and must follow rule 11.

## Rules

1. Never hardcode visible text in React, HTML, validation messages, dialogs, placeholders, labels, buttons, empty states, loading states, errors, accessibility labels, or document metadata.
2. Add a semantic English key to `src/react-app/i18n.ts`, then add a natural translation for every language in `SUPPORTED_LANGUAGES`.
3. Use `t("key")` in components. For interpolated values, use i18next variables rather than string concatenation.
4. **Use i18next pluralization whenever `count` changes noun or verb form.** Do not bake English plurals into a single string like `"{{count}} reviews"`.
   - Pass a numeric `count` in `t("key", { count })`.
   - Define separate keys with plural suffixes: `key_one`, `key_other` (English). Example:
     ```ts
     "member.reviews_one": "1 review",
     "member.reviews_other": "{{count}} reviews",
     ```
   - Call `t("member.reviews", { count: n })`. i18next selects the correct form.
   - Croatian (`hr`) also needs `key_few` where grammar requires it.
   - Audit with `count` values `0`, `1`, and `2` during verification. Never ship strings that read `1 reviews` or `1 nights`.
   - `{{count}}` inside `_other` only; use literal `1` in `_one` when the sentence needs it.
5. Translate option labels even when stored model values remain stable English identifiers.
6. Keep names, vessel names, locations, certification names, and user-provided content unchanged unless a localized display label is explicitly defined.
7. Before completing any UI task, search every changed file for newly introduced user-facing literals and fix them.
8. Exercise the changed flow in at least two languages during Playwright verification.
9. Never use an em dash (`—`) in any user-facing string. Rewrite the sentence with punctuation or wording that reads naturally without one.
10. Use US English spelling for the default source copy and translation keys. Keep UK English as a separate complete locale, never as the default.
11. Never translate a string that is exclusively shown in development builds behind a compile-time `import.meta.env.DEV` guard. Keep it as hardcoded US English and do not add it to translation catalogs or wrap it in `t()`. This exception does not apply to production UI whose content merely varies by environment.
12. Follow the Boatstead glossary (`.cursor/skills/boatstead-glossary/SKILL.md`): use **sit** for the product noun, not **stay**.

## Audit checklist

- Headings, paragraphs, links, buttons, tabs, chips, and badges
- Form labels, placeholders, options, helper text, errors, and pending text
- Modal, confirmation, success, empty, loading, and access-denied states
- `aria-label`, `alt`, `title`, and other assistive text
- Number, date, duration, and list formatting through the active locale
- Plural strings: search for `{{count}}` followed by a plural noun (`reviews`, `nights`, `people`, `sits`, etc.) and convert to `_one` / `_other` forms
- Page title and metadata when changed dynamically

Do not call a UI change complete while untranslated production-facing literals remain.
