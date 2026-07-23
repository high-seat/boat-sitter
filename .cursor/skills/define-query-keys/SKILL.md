---
name: define-query-keys
description: >-
  Define and consume TanStack Query keys with @ocodio/query-key-manager in
  Boatstead. Use automatically when adding useQuery, useMutation invalidation,
  fetchQuery, setQueryData, prefetchQuery, or any new server-state cache key.
---

# Define Query Keys

All TanStack Query keys live in `src/react-app/queries.ts` via
[`@ocodio/query-key-manager`](https://www.npmjs.com/package/@ocodio/query-key-manager).
Never hardcode `queryKey: ["…"]` arrays at call sites.

## Rules

1. **Add or extend entries in `src/react-app/queries.ts`** before wiring a new
   `useQuery` / `fetchQuery` / invalidation.
2. **Import `queries` from `@/queries`** in components, hooks, and helpers.
3. **Static lists** (no params): define with `defineQueryOptions` inside
   `createQueryKeys` (see `queries.boats.all`, `queries.vessels.all`).
4. **Parameterized queries**: add a factory on the matching domain that returns
   TanStack `queryOptions({ queryKey, queryFn, … })`. Keep the key prefix aligned
   with that domain’s `getQueryKey()` (e.g. `["applications", "user", name]` under
   `queries.applications`).
5. **Consume with spreads**:
   ```ts
   useQuery({
     ...queries.boats.search(params),
     enabled: Boolean(user),
     placeholderData: keepPreviousData,
   });
   ```
   or `useQuery(queries.boats.all)` when there are no overrides.
6. **Invalidate with helpers**, not string literals:
   ```ts
   queryClient.invalidateQueries({ queryKey: queries.boats.all.queryKey });
   queryClient.invalidateQueries({ queryKey: queries.applications.getQueryKey() });
   queryClient.invalidateQueries({
     queryKey: [...queries.verificationChecks.getQueryKey(), user.name],
   });
   ```
7. **Do not invent parallel key shapes.** If a key already exists, reuse it so
   caches stay shared (e.g. notifications under `queries.notifications.user`).
8. When migrating old call sites in the same change, replace every matching
   hardcoded array, including `setQueryData` / `setQueriesData` / `fetchQuery`.

## When to extend vs reuse

| Need                        | Do this                                           |
| --------------------------- | ------------------------------------------------- |
| New resource list           | Domain + `all` (or `list`) static option          |
| Detail by id                | Domain factory `detail(id)`                       |
| Filtered/paginated list     | Domain factory taking the params object           |
| Invalidate whole domain     | `queries.<domain>.getQueryKey()`                  |
| Invalidate one user’s slice | Prefix with `getQueryKey()` then the user segment |

## Example

```ts
// queries.ts
applications: {
  getQueryKey: managed.applications.getQueryKey,
  user: (userName: string | undefined) =>
    queryOptions({
      queryKey: ["applications", "user", userName] as const,
      queryFn: () => getApplicationsForUser(userName!),
    }),
},

// component
useQuery({
  ...queries.applications.user(user?.name),
  enabled: Boolean(user),
});
```

## Checklist

- [ ] Key defined once in `queries.ts`
- [ ] Call site uses `queries.*` (no raw arrays)
- [ ] Invalidations use `.queryKey` or `.getQueryKey()`
- [ ] Parameterized factories keep stable, serializable key segments
