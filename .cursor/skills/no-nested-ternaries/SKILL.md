---
name: no-nested-ternaries
description: >-
  Bans nested ternary expressions. Use automatically whenever writing or
  editing conditionals, JSX conditional rendering, className/style selection,
  status labels, or any `? :` expression that would nest another ternary.
---

# No Nested Ternaries

Never nest ternary expressions. One `? :` is fine. A ternary inside another
ternary is not.

Enforced by oxlint (`eslint/no-nested-ternary`). Do not disable the rule or
add ignore comments to ship nested ternaries.

## Rules

1. Do not write `a ? b : c ? d : e` or `a ? (b ? c : d) : e`.
2. Prefer `if` / `else`, early returns, a small helper, a lookup map, or
   separate variables before the return/JSX.
3. When editing code that already nests ternaries, flatten it in the same
   change instead of copying the pattern.

## Examples

```tsx
// Bad
const label = status === "open" ? t("open") : status === "closed" ? t("closed") : t("other");

// Good
function statusLabel(status: string) {
  if (status === "open") return t("open");
  if (status === "closed") return t("closed");
  return t("other");
}
```

```tsx
// Bad
{
  loading ? <Spinner /> : error ? <Error /> : <Content />;
}

// Good
{
  loading ? <Spinner /> : null;
}
{
  !loading && error ? <Error /> : null;
}
{
  !loading && !error ? <Content /> : null;
}

// Or extract:
function Body() {
  if (loading) return <Spinner />;
  if (error) return <Error />;
  return <Content />;
}
```
