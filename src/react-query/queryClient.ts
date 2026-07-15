// ---------------------------------------------------------------------------
// THE QUERY CLIENT — one instance, app-wide. This IS the cache.
//
// The two most misunderstood options:
//
//   staleTime — how long data is considered FRESH. Fresh data is served from
//     cache with NO network request. Once stale, it is still served
//     instantly from cache, but a background refetch fires on the next
//     trigger (mount, window focus, reconnect). Default is 0 (everything is
//     immediately stale). We use 10s so you can watch fresh→stale flip in
//     the Cache Visualizer.
//
//   gcTime (formerly cacheTime) — how long INACTIVE data (zero observers,
//     i.e. no mounted component uses it) stays in the cache before being
//     garbage-collected. Default 5 min. This is about memory, not freshness.
//
//   A query can be stale AND cached: that's exactly what enables
//   stale-while-revalidate — show the stale copy now, revalidate silently.
// ---------------------------------------------------------------------------

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000, // fresh for 10s → deduped & served from cache
      gcTime: 5 * 60_000, // keep inactive data for 5 min
      refetchOnWindowFocus: true, // switch tabs & come back → silent refresh
      refetchOnReconnect: true, // network drops & returns → silent refresh
      retry: 1, // per-demo overrides below (flaky uses 4)
    },
  },
});
