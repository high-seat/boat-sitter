---
name: boatstead-glossary
description: >-
  Boatstead product glossary and preferred terminology. Use automatically
  whenever writing or editing user-facing copy, i18n keys, feature-flag labels,
  notifications, emails, tests that assert visible text, or docs that describe
  product concepts (sit, sitter, owner, vessel, listing).
---

# Boatstead Glossary

Use these terms consistently in US English source copy and keep other locales
aligned to the same meaning.

## Sit (not stay)

**Sit** is the product noun for a boat-sitting arrangement (the listing, dates,
and care period).

| Prefer         | Avoid (product noun) |
| -------------- | -------------------- |
| sit / sits     | stay / stays         |
| create a sit   | create a stay        |
| during the sit | during the stay      |
| sit underway   | stay underway        |
| sit completed  | stay completed       |
| shortest sit   | shortest stay        |
| sit details    | stay details         |
| sit issue      | stay issue           |

**OK to keep** when `stay` is an English **verb** meaning remain or lodge, not
the product noun:

- “does not stay overnight”
- “conversations stay available”
- “Reviews stay open for 7 days”
- “How many people will stay?” (party size aboard)

When unsure, rewrite so the product noun is **sit**.

## Related terms

| Term           | Meaning                                |
| -------------- | -------------------------------------- |
| sit            | One boat-sitting arrangement / listing |
| sitter         | Member who applies to care for a boat  |
| owner          | Member who lists a vessel / sit        |
| vessel / boat  | The physical craft                     |
| applicant      | Sitter who applied to a specific sit   |
| liveaboard     | Sit type: sitter sleeps aboard         |
| daytime checks | Sit type: daily visits, no overnight   |

## Checklist

When adding or changing copy:

1. Search for product-noun `stay` / `stays` in the new English string.
2. Replace with `sit` / `sits` unless it is clearly a verb.
3. Update every locale for that key in the same change.
4. Update e2e assertions that match the old wording.
