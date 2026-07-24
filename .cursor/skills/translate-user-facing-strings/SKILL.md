---
name: translate-user-facing-strings
description: >-
  Enforces complete Boatstead internationalization and i18next pluralization.
  Use automatically whenever adding or changing UI copy, counts, summaries,
  routes, forms, validation, notifications, accessibility labels, metadata,
  or any text a user can see or hear — including fixes for wrong singular/plural
  forms (e.g. "1 applicants", "1 nights").
---

# Translate User-Facing Strings

Every user-facing string shipped to users must be translated through i18next. Dev-only strings are the sole exception and must follow rule 11.

## Rules

1. Never hardcode visible text in React, HTML, validation messages, dialogs, placeholders, labels, buttons, empty states, loading states, errors, accessibility labels, or document metadata.
2. Add a semantic English key to `src/react-app/i18n.ts` or `src/react-app/localeExtras.ts` (and `applicationTranslations.ts` when applicable), then add a natural translation for every language in `SUPPORTED_LANGUAGES`.
3. Use `t("key")` in components. For interpolated values, use i18next variables rather than string concatenation.
4. **Use i18next pluralization whenever a number changes noun or verb form.** Do not bake English plurals into a single string like `"{{count}} reviews"` or `"{{n}} applicants"`.
   - Pass a numeric `count` in `t("key", { count })`.
   - Define separate keys with plural suffixes: `key_one`, `key_other` (English). Example:
     ```ts
     "member.reviews_one": "1 review",
     "member.reviews_other": "{{count}} reviews",
     ```
   - Call `t("member.reviews", { count: n })`. i18next selects the correct form.
   - Croatian (`hr`) also needs `key_few` where grammar requires it. Extra `_few` keys may exist only on `hr`; keep `en-US` as `_one` / `_other`.
   - Audit with `count` values `0`, `1`, and `2` during verification. Never ship strings that read `1 reviews`, `1 nights`, or `1 applicants`.
   - `{{count}}` inside `_other` (and `_few`) only; use literal `1` in `_one` when the sentence needs it.
5. **Multi-count summaries:** when one line joins several countable nouns (e.g. duration · applicants · care tasks), do **not** put those nouns in one template with raw numbers. Pluralize each piece, then compose:
   ```ts
   // Keys
   "owner.sitSummary": "{{duration}} · {{applicants}} · {{tasks}}",
   "owner.sitApplicants_one": "1 applicant",
   "owner.sitApplicants_other": "{{count}} applicants",
   "owner.sitCareTasks_one": "1 care task",
   "owner.sitCareTasks_other": "{{count}} care tasks",

   // Usage
   t("owner.sitSummary", {
     duration: sit.duration, // or t("duration.nights", { count: nights })
     applicants: t("owner.sitApplicants", { count: applicationCount }),
     tasks: t("owner.sitCareTasks", { count: taskCount }),
   })
   ```
   Bad: `"{{duration}} · {{applicants}} applicants · {{tasks}} care tasks"` (always plural).
6. Translate option labels even when stored model values remain stable English identifiers.
7. Keep names, vessel names, locations, certification names, and user-provided content unchanged unless a localized display label is explicitly defined.
8. Before completing any UI task, search every changed file for newly introduced user-facing literals and fix them.
9. Exercise the changed flow in at least two languages during Playwright verification. For plural fixes, assert both singular (`1 …`) and plural (`2 …`) in e2e when a count is shown.
10. Never use an em dash (`—`) in any user-facing string. Rewrite the sentence with punctuation or wording that reads naturally without one.
11. Use US English spelling for the default source copy and translation keys. Keep UK English as a separate complete locale, never as the default.
12. Never translate a string that is exclusively shown in development builds behind a compile-time `import.meta.env.DEV` guard. Keep it as hardcoded US English and do not add it to translation catalogs or wrap it in `t()`. This exception does not apply to production UI whose content merely varies by environment.
13. Follow the Boatstead glossary (`.cursor/skills/boatstead-glossary/SKILL.md`): use **sit** for the product noun, not **stay**.

## Audit checklist

- Headings, paragraphs, links, buttons, tabs, chips, and badges
- Form labels, placeholders, options, helper text, errors, and pending text
- Modal, confirmation, success, empty, loading, and access-denied states
- `aria-label`, `alt`, `title`, and other assistive text
- Number, date, duration, and list formatting through the active locale
- Plural strings: search for `{{count}}` / `{{n}}` / interpolated numbers followed by a plural noun (`reviews`, `nights`, `people`, `sits`, `applicants`, `tasks`, etc.) and convert to `_one` / `_other` (plus `hr` `_few` when needed)
- Multi-count templates that hardcode English plurals around several variables — split into composed plural keys
- Page title and metadata when changed dynamically

Do not call a UI change complete while untranslated production-facing literals or wrong singular/plural forms remain.
