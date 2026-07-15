// Implementation 2 — React Query (TanStack Query v5).
// Same features as /manual, rebuilt with useQuery/useMutation. Note what's
// GONE: loading/error useState triplets, manual refetch calls, race guards.

import { CacheVisualizer } from '../components/CacheVisualizer';
import { Section } from '../components/Section';
import { RQFlaky } from './RQFlaky';
import { RQGcDemo } from './RQGcDemo';
import { RQInfiniteFeed } from './RQInfiniteFeed';
import { RQPagination } from './RQPagination';
import { RQSearch } from './RQSearch';
import { RQStatsRow } from './RQStatsRow';
import { RQTaskBoard } from './RQTaskBoard';

export function RQDashboard() {
  return (
    <div className="dashboard">
      <div className="impl-banner impl-banner-rq">
        <b>Implementation 2 — React Query.</b> Repeat the actions from the Manual tab and compare
        the network panel. Also try: switch browser tabs and come back (window-focus refetch), and
        open the floating <b>React Query DevTools</b> (bottom-right corner) to inspect the cache.
      </div>

      <Section
        title="Deduplication"
        lesson={
          <>
            Same two components as the manual tab, but both <code>useQuery</code> calls share the
            key <code>["stats"]</code> → one cache entry, one request. Within{' '}
            <code>staleTime</code> (10s), remounting fires <b>zero</b> requests.
          </>
        }
      >
        <RQStatsRow />
      </Section>

      <Section
        title="Task board — optimistic updates, rollback & invalidation"
        lesson={
          <>
            Create/advance/delete update the UI <i>instantly</i> via <code>onMutate</code>. Check
            “make the server reject it” to watch <code>onError</code> roll the UI back and toast.
            After settling, <code>invalidateQueries({'{'} queryKey: ["tasks"] {'}'})</code> marks
            the board, the paginated list <i>and</i> searches stale in one call — watch the
            automatic refetches in the network log. Leave this tab and return: instant stale data,
            silent revalidation (green flash when fresh data lands).
          </>
        }
      >
        <RQTaskBoard />
      </Section>

      <Section
        title="Search — the race is gone"
        lesson={
          <>
            The query string lives <i>inside</i> the query key (<code>["tasks","search",q]</code>),
            so each keystroke observes a different cache entry. A slow response for an old query is
            filed under the old key — it can never overwrite what you're looking at. Retype a
            previous query: instant results from cache.
          </>
        }
      >
        <RQSearch />
      </Section>

      <Section
        title="Pagination — keepPreviousData"
        lesson={
          <>
            <code>placeholderData: keepPreviousData</code> keeps page N visible (dimmed) while page
            N+1 loads — no blank flash. Each page caches under its own key, so going back is
            instant.
          </>
        }
      >
        <RQPagination />
      </Section>

      <Section
        title="Infinite scroll — useInfiniteQuery"
        lesson={
          <>
            <code>useInfiniteQuery</code> accumulates cursor-paginated pages under one key and gives
            you <code>fetchNextPage</code>, <code>hasNextPage</code>, and{' '}
            <code>isFetchingNextPage</code> for free.
          </>
        }
      >
        <RQInfiniteFeed />
      </Section>

      <Section
        title="Retry with exponential backoff"
        lesson={
          <>
            <code>retry: 4</code> + <code>retryDelay: (a) =&gt; 500 * 2**a</code> turn a coin-flip
            endpoint into a ~97% success rate — no code, just config.
          </>
        }
      >
        <RQFlaky />
      </Section>

      <Section
        title="Cache garbage collection — gcTime"
        lesson={
          <>
            <code>staleTime</code> is about <i>freshness</i> (when to revalidate);{' '}
            <code>gcTime</code> is about <i>memory</i> (when to evict data nobody is watching).
          </>
        }
      >
        <RQGcDemo />
      </Section>

      <Section
        title="Cache Visualizer — live view of the QueryCache"
        lesson={
          <>
            Every row is a cache entry. Watch queries flip <b>fresh → stale</b> after their{' '}
            <code>staleTime</code>, turn <b>⏳ fetching</b> on window focus / invalidation, go{' '}
            <b>inactive</b> when their components unmount, and disappear when <code>gcTime</code>{' '}
            expires.
          </>
        }
      >
        <CacheVisualizer />
      </Section>
    </div>
  );
}
