# Server State Cheatsheet

Copy-pasteable templates for React Query (TanStack Query v5) and SWR 2. Working versions of every pattern live in this repo — file references included.

---

## useQuery template

```tsx
import { useQuery, keepPreviousData } from '@tanstack/react-query';

const {
  data,          // TData | undefined
  isPending,     // no cached data yet (first load) → show skeleton
  isFetching,    // ANY fetch in flight, incl. background revalidation → subtle indicator
  isError,
  error,
  refetch,
  dataUpdatedAt, // timestamp of last confirmed server data
} = useQuery({
  queryKey: ['tasks', 'list', { page }],  // cache identity + fetch deps + invalidation target
  queryFn: () => fetchTasks(page),        // must return a promise; throw on error
  staleTime: 30_000,                      // fresh for 30s → no requests at all
  gcTime: 5 * 60_000,                     // evict 5 min after last observer unmounts
  enabled: !!userId,                      // conditional fetching
  placeholderData: keepPreviousData,      // keep old data visible on key change
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000), // exponential backoff
  select: (data) => data.items,           // transform without touching the cache
});
```

**Loading-state rule of thumb:** `isPending` = "I have nothing to show" (skeleton); `isFetching && !isPending` = "showing stale data, refreshing behind the scenes" (tiny spinner at most).
Working example: `src/react-query/RQTaskBoard.tsx`.

## useMutation template

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const createTask = useMutation({
  mutationFn: (input: NewTask) => postTask(input),
  onSuccess: (created) => { /* toast, navigate, etc. */ },
  onError: (error) => { /* toast the failure */ },
  onSettled: () => {
    // success OR error: re-sync with server truth
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});

createTask.mutate({ title: 'Ship it' });
// createTask.isPending / .isError / .variables available for UI
```

## Optimistic update with rollback (React Query)

```tsx
const updateTask = useMutation({
  mutationFn: patchTask,

  onMutate: async (newTask) => {
    // 1. Prevent an in-flight refetch from clobbering our optimistic write
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    // 2. Snapshot for rollback
    const previous = queryClient.getQueryData<Task[]>(['tasks']);
    // 3. Optimistically update — the UI re-renders NOW
    queryClient.setQueryData<Task[]>(['tasks'], (old) =>
      old?.map((t) => (t.id === newTask.id ? { ...t, ...newTask } : t))
    );
    // 4. Whatever you return becomes `context` below
    return { previous };
  },

  onError: (_err, _newTask, context) => {
    // Server rejected it → restore the snapshot (automatic rollback)
    if (context?.previous) queryClient.setQueryData(['tasks'], context.previous);
  },

  onSettled: () => {
    // Either way, refetch the truth
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  },
});
```

Working example (create/update/delete): `src/react-query/RQTaskBoard.tsx`.

## Optimistic update with rollback (SWR)

```tsx
const { data, mutate } = useSWR('/tasks', fetcher);

await mutate(
  postTask(newTask),           // the real request; its promise drives success/failure
  {
    optimisticData: (current) => [newTask, ...(current ?? [])], // shown immediately
    rollbackOnError: true,     // restore previous data if the promise rejects
    populateCache: false,      // don't write the POST response into the list cache…
    revalidate: true,          // …refetch the list instead
  }
);
```

Working example: `src/swr/SWRTaskBoard.tsx`.

## Pagination (no flashing between pages)

```tsx
// React Query
useQuery({
  queryKey: ['tasks', 'page', page],       // one cache entry per page → instant back-nav
  queryFn: () => fetchPage(page),
  placeholderData: keepPreviousData,       // old page stays visible while new one loads
});
// `isPlaceholderData` tells you when you're looking at the previous page — dim the list.

// SWR
useSWR(`/tasks?page=${page}`, fetcher, { keepPreviousData: true });
```

Working examples: `src/react-query/RQPagination.tsx`, `src/swr/SWRPagination.tsx`.

## Infinite query

```tsx
// React Query
const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['activity'],
  queryFn: ({ pageParam }) => fetchFeed(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor, // null/undefined ⇒ hasNextPage: false
});
const items = data?.pages.flatMap((p) => p.events) ?? [];

// SWR — lower level: you write the key function and derive hasNextPage yourself
const { data, size, setSize } = useSWRInfinite(
  (index, prev) => (prev && prev.nextCursor === null ? null : `/feed?cursor=${prev?.nextCursor ?? 0}`),
  fetcher,
  { revalidateFirstPage: false }
);
// load more: setSize(size + 1)
```

Working examples: `src/react-query/RQInfiniteFeed.tsx`, `src/swr/SWRInfiniteFeed.tsx`.

## Query key naming conventions

Use a **key factory** — one module, one spelling, hierarchical from broad to narrow:

```ts
export const taskKeys = {
  all:      ['tasks'] as const,
  lists:    () => [...taskKeys.all, 'list'] as const,
  list:     (filters: Filters) => [...taskKeys.lists(), filters] as const,
  details:  () => [...taskKeys.all, 'detail'] as const,
  detail:   (id: number) => [...taskKeys.details(), id] as const,
};
```

Rules of thumb:

- **Everything the queryFn uses belongs in the key** (page, filters, search string, user id). If it changes the response, it changes the key — this is also your race-condition protection.
- Order segments broad → narrow (`entity, view, params`) so prefix invalidation works.
- Objects in keys are hashed structurally: `{ page: 1, q: 'x' }` equals `{ q: 'x', page: 1 }`.
- Never build keys inline in components — import the factory (`src/react-query/keys.ts`).

## Invalidation strategies

```ts
// Broad: everything task-related (board + every page + every search)
queryClient.invalidateQueries({ queryKey: taskKeys.all });

// Surgical: only the lists, not the detail views
queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

// Exact: one specific entry
queryClient.invalidateQueries({ queryKey: taskKeys.detail(42), exact: true });

// Predicate: anything custom
queryClient.invalidateQueries({ predicate: (q) => q.state.dataUpdatedAt < cutoff });

// Alternative to invalidation when the server RETURNS the updated entity:
queryClient.setQueryData(taskKeys.detail(42), updatedTask); // write, don't refetch
```

SWR equivalents: `mutate('/tasks')` revalidates one key; `mutate((key) => typeof key === 'string' && key.startsWith('/tasks'))` filter-matches many.

Pitfalls:

- **Over-invalidation** — invalidating `taskKeys.all` after editing one field causes refetch storms in big apps. Scope down when it matters.
- **Under-invalidation** — forgetting related keys (lists AND searches AND stats). Hierarchical keys make broad-but-correct easy; start broad, optimize later.
- **Invalidate ≠ delete**: stale data keeps rendering until fresh data arrives. To actually drop data use `removeQueries`.

## Refetch triggers (and how to control them)

| Trigger | React Query option | SWR option |
| --- | --- | --- |
| Component mounts w/ stale data | `refetchOnMount` | `revalidateIfStale` / `revalidateOnMount` |
| Window regains focus | `refetchOnWindowFocus` | `revalidateOnFocus` |
| Network reconnects | `refetchOnReconnect` | `revalidateOnReconnect` |
| Interval / polling | `refetchInterval` | `refreshInterval` |
| After a mutation | `invalidateQueries` | `mutate(key)` |
| Never (while fresh) | `staleTime: Infinity` | `revalidateIfStale: false` |

## Anti-patterns to avoid

- ❌ `useEffect` + `setState` fetching alongside React Query — pick one system.
- ❌ Copying `useQuery` data into `useState` "to edit it" — you just forked the cache; use the data directly or a form library.
- ❌ Using the query cache as a client-state store (`setQueryData` for things that never came from a server).
- ❌ Inconsistent key spellings across components — use the factory.
- ❌ Skipping `cancelQueries` in `onMutate` — an in-flight response can overwrite your optimistic value.
- ❌ `staleTime: Infinity` everywhere "for performance" — you've disabled the revalidation that keeps the UI honest.
