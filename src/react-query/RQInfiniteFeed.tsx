// INFINITE SCROLL DEMO — useInfiniteQuery.
//
// The server exposes cursor pagination (GET /activity?cursor=N returns
// { events, nextCursor }). useInfiniteQuery accumulates every fetched page
// under ONE query key and hands you:
//   • data.pages        — all pages fetched so far
//   • fetchNextPage()   — call it from a button or an IntersectionObserver
//   • hasNextPage       — derived from getNextPageParam returning null
//   • isFetchingNextPage — loading state for JUST the next-page fetch
// Doing this manually means accumulating pages in useState, tracking the
// cursor, guarding against double-fetches, and losing it all on unmount.

import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { activityKey } from './keys';

export function RQInfiniteFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: activityKey,
    queryFn: ({ pageParam }) => api.getActivityPage('react-query', pageParam),
    initialPageParam: 0,
    // Tell React Query how to derive the next cursor from the last page.
    // Returning null/undefined ⇒ hasNextPage becomes false.
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  if (isPending) return <div className="loading-block">⏳ Loading feed…</div>;

  const events = data?.pages.flatMap((page) => page.events) ?? [];

  return (
    <div>
      <ul className="feed-list">
        {events.map((event) => (
          <li key={event.id}>
            <span className="muted">{new Date(event.createdAt).toLocaleTimeString()}</span>{' '}
            {event.message}
          </li>
        ))}
      </ul>
      <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
        {isFetchingNextPage
          ? 'Loading more…'
          : hasNextPage
            ? `Load more (fetchNextPage) — ${events.length} loaded`
            : 'No more events (hasNextPage: false)'}
      </button>
    </div>
  );
}
