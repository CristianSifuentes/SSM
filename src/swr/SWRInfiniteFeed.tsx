// INFINITE SCROLL DEMO — useSWRInfinite.
//
// SWR's infinite hook is lower-level than useInfiniteQuery: you get a
// (pageIndex, previousPageData) → key function, and `data` is an array of
// pages. There is no built-in hasNextPage/fetchNextPage — you derive them
// yourself from the last page and setSize(size + 1). More manual than React
// Query, but also fewer concepts.

import useSWRInfinite from 'swr/infinite';
import { api } from '../api/client';
import type { ActivityPage } from '../api/types';

// Return null to stop fetching (SWR's "no more pages" signal).
function getKey(_pageIndex: number, previousPageData: ActivityPage | null): string | null {
  if (previousPageData && previousPageData.nextCursor === null) return null;
  const cursor = previousPageData ? previousPageData.nextCursor : 0;
  return `/activity?cursor=${cursor}`;
}

export function SWRInfiniteFeed() {
  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(
    getKey,
    (key: string) => {
      const cursor = Number(new URLSearchParams(key.split('?')[1]).get('cursor')) || 0;
      return api.getActivityPage('swr', cursor);
    },
    { revalidateFirstPage: false } // don't refetch page 1 on every load-more
  );

  if (isLoading) return <div className="loading-block">⏳ Loading feed…</div>;

  const pages = data ?? [];
  const events = pages.flatMap((page) => page.events);
  // Derived by hand — React Query gives you hasNextPage for free.
  const hasNextPage = pages.length === 0 || pages[pages.length - 1].nextCursor !== null;
  const isLoadingMore = isValidating && size > pages.length;

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
      <button onClick={() => setSize(size + 1)} disabled={!hasNextPage || isLoadingMore}>
        {isLoadingMore
          ? 'Loading more…'
          : hasNextPage
            ? `Load more (setSize(size + 1)) — ${events.length} loaded`
            : 'No more events'}
      </button>
    </div>
  );
}
