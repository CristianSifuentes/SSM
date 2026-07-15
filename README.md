# Server State Management Lab — Manual vs React Query vs SWR

An educational React project that demonstrates **why libraries like TanStack Query (React Query) and SWR exist**, what problems they solve compared to manual fetching, and how they transform the way React apps handle server data.

One Task Management Dashboard, **three parallel implementations** of the same features:

| Tab | Implementation | Folder |
| --- | --- | --- |
| 🩹 Manual fetching | `useEffect + useState + fetch` — the painful way | [`src/manual/`](src/manual) |
| ⚡ React Query | `useQuery` / `useMutation` (TanStack Query v5) + DevTools | [`src/react-query/`](src/react-query) |
| 🌊 SWR | `useSWR` / `mutate` (SWR 2) | [`src/swr/`](src/swr) |

A **live network monitor** at the bottom of the screen counts every HTTP request each implementation fires, so you can perform the same actions in each tab and compare the score. A **Cache Visualizer** shows React Query's cache in real time: query keys, fresh vs stale, background refetches, observer counts, and garbage collection.

## Running the lab

```bash
npm install
npm run dev
```

Everything runs against an **in-memory mock API** ([`src/api/`](src/api)) with configurable latency and failure rate (sliders in the network panel) — all scenarios are reproducible offline. No backend, no network needed.

### Suggested tour

1. Open the **Manual** tab. Use every demo. Watch the request counter climb and the bugs appear: the search race condition, the delete that "forgets" to refetch, the full spinner every time you re-enter the tab.
2. **Reset counters**, repeat the same actions in the **React Query** tab. Fewer requests, no races, instant back-navigation. Open the Cache Visualizer and the floating React Query DevTools (bottom-right).
3. Reset again, repeat in the **SWR** tab. Same wins, smaller API.
4. Try the special scenarios: switch browser tabs and come back (focus refetch), create a task with *"make the server reject it"* checked (optimistic update → rollback), crank the latency slider up.

---

## Client state vs server state

The single most important idea in this lab:

| | Client state (UI state) | Server state (remote data) |
| --- | --- | --- |
| Who owns it | **You** — it lives only in the browser | **The server** — your copy is a *cache* |
| Sync/async | Synchronous, always current | Asynchronous, possibly stale on arrival |
| Shared? | No — yours alone | Yes — other users/tabs mutate it behind your back |
| Examples | theme, open modal, form draft, selected filter | user, tasks, notifications, search results |
| Right tool | `useState`, `useReducer`, Context, Zustand | **React Query, SWR** (also RTK Query, Apollo) |

Server state is a **caching problem**, not a state problem. It needs answers to questions `useState` was never designed to answer: *When is my copy stale? Should I refetch on focus? What if two components need it at once? What if the write fails after I showed it as done?*

## Why manual fetching doesn't scale

The `useEffect + useState + fetch` pattern forces you to hand-roll, in **every component**:

- **The triplet** — `data` / `loading` / `error` useState hooks, over and over.
- **No caching** — data dies with the component; every navigation is a blank screen and a spinner.
- **No deduplication** — two components needing `/stats` = two identical requests.
- **Race conditions** — responses can arrive out of order; without cancellation logic in every effect, stale responses overwrite fresh ones (type fast in the Manual search demo).
- **Manual refetching** — after every mutation, *you* must remember to refetch, at every call site, forever. The Manual delete button "forgets" on purpose so you can watch the UI lie.
- **No retries** — one failure goes straight to the user (see the 50%-flaky endpoint demo).
- **No freshness model** — data never revalidates on window focus or reconnect; it just rots.

Each of these is fixable by hand — an `AbortController` here, an ad-hoc cache there — but you must fix all of them, in every component, and never forget once. That's the code React Query/SWR delete.

## React Query core concepts

### Query keys

A query key (an array, e.g. `['tasks', 'search', 'foo']`) **identifies a cache entry**. It's also the dependency array of the fetch — key changes → new cache entry, refetch — and the target for invalidation. Keys are hierarchical: invalidating `['tasks']` matches every key that starts with `['tasks']`. This lab centralizes keys in a factory ([`src/react-query/keys.ts`](src/react-query/keys.ts)) — the standard defense against the "same data under two spellings" bug.

Putting the input *inside* the key is also why the search race condition disappears: a slow response for an old query is filed under the old key and can never overwrite the entry you're currently looking at.

### staleTime vs gcTime

The two most misunderstood options — they control **different things**:

- **`staleTime`** (default `0`) — how long data counts as **fresh**. Fresh data is served from cache with *no request*. Stale data is *also* served instantly from cache, but a background refetch fires on the next trigger (mount, window focus, reconnect). This is **stale-while-revalidate**: never a spinner when a cached copy exists.
- **`gcTime`** (default 5 min, formerly `cacheTime`) — how long **inactive** data (zero mounted components observing it) stays in memory before garbage collection. About memory, not freshness.

Watch both live in the Cache Visualizer: queries flip fresh → stale after 10s, and the GC demo query vanishes 12s after its component unmounts.

### Invalidation

`queryClient.invalidateQueries({ queryKey: ['tasks'] })` marks every matching query stale; active ones refetch automatically. Called once inside a mutation's `onSettled`, it replaces every hand-written "remember to refetch" across the codebase — the board, the paginated list, and cached searches all re-sync from one line.

### Mutations & optimistic updates

`useMutation` gives writes a lifecycle:

1. **`onMutate`** — runs before the request: cancel in-flight fetches for the key, snapshot the cache, write the optimistic value (UI updates instantly), return the snapshot.
2. **`onError`** — the server said no: restore the snapshot (automatic rollback), toast the user.
3. **`onSettled`** — success or error: invalidate, so the cache re-syncs with server truth.

Try it: check *"make the server reject it"* on the React Query board and watch the task appear, then vanish, with an error toast.

## SWR philosophy and API

SWR is named after the `stale-while-revalidate` HTTP caching strategy, and that's the whole philosophy: **always return cached data first (even stale), then revalidate in the background**. The API is deliberately tiny:

```tsx
const { data, error, isLoading, mutate } = useSWR('/api/tasks', fetcher)
```

- Keys are usually strings (often the URL itself). `null` key = don't fetch.
- No mutation hook in the core — writes are plain async calls synced via `mutate(promise, { optimisticData, rollbackOnError, revalidate })`.
- Revalidate-on-focus, revalidate-on-reconnect, dedup, and error retry with backoff are **on by default**.

## React Query vs SWR

| | React Query v5 | SWR 2 |
| --- | --- | --- |
| Bundle (min+gzip, approx.) | ~12–13 kB | ~4–5 kB |
| Keys | Arrays, hierarchical → prefix invalidation | Strings, flat → filter-function invalidation |
| Mutations | `useMutation` lifecycle (`onMutate`/`onError`/`onSettled`) | `mutate()` options (`optimisticData`, `rollbackOnError`) |
| Infinite | `useInfiniteQuery` — `fetchNextPage`, `hasNextPage` built in | `useSWRInfinite` — key function + `setSize`, derive the rest |
| Cache lifecycle | `staleTime` + `gcTime` (GC of inactive data) | `dedupingInterval`; no GC until reload |
| Retries | Fully configurable (`retry`, `retryDelay` fn) | On by default, less granular |
| DevTools | Official & excellent | None official |
| Ecosystem | Framework-agnostic core (React/Vue/Solid/Svelte/Angular), offline & persistence plugins | React-only, by Vercel, natural Next.js fit |

**Decision guide:** choose **React Query** when mutations/optimistic updates are central, you want DevTools, or you need fine-grained cache control. Choose **SWR** for read-heavy apps where bundle size and API minimalism matter. Either one beats manual fetching by a mile — the expensive mistake is choosing neither.

## "Do you still need Redux?"

Run the inventory (full table in the app's Overview tab): user data, tasks, notifications, search results, feeds — **server state** → React Query/SWR. Theme, sidebar, filters, form drafts — **client state** → `useState`/Context. In a typical app, half or more of the "global state" that justified Redux was server state in disguise; once it moves into a server-state library, what's left rarely needs more than `useState`. This entire lab has no global state library — its only client state is "which tab is open".

## Project structure

```
src/
├── api/           # Mock server: in-memory DB, fake HTTP layer with latency/failures/logging
├── components/    # Shared UI: network panel, cache visualizer, task rows, toasts
├── manual/        # Implementation 1: useEffect + useState (deliberately buggy)
├── react-query/   # Implementation 2: TanStack Query v5 (keys, client, hooks, demos)
├── swr/           # Implementation 3: SWR 2 (same demos, smaller API)
└── pages/         # Overview (concepts, Redux inventory, self-check) & Comparison
```

Every file carries pedagogical comments: what problem the pattern solves, which option controls the behavior, and the common pitfalls.

## Self-check questions

Eight questions with expandable answers live in the app's **Overview** tab, covering: the client/server state distinction, `staleTime` vs `gcTime`, why query keys kill race conditions, the `onMutate`/`onError`/`onSettled` lifecycle, what invalidation actually does, stale-while-revalidate on remount, deduplication, and adoption pitfalls (key drift, over-invalidation, cache-as-global-store).

See also [`SERVER_STATE_CHEATSHEET.md`](SERVER_STATE_CHEATSHEET.md) for copy-pasteable templates.
