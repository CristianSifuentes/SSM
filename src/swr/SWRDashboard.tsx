// Implementation 3 — SWR (by Vercel).
// Same features again. Notice the smaller API surface: one hook (useSWR),
// string keys, and mutate() for writes. And notice what you give up vs
// React Query: no useMutation lifecycle, no hierarchical invalidation, no
// official devtools, no gcTime.

import { Section } from '../components/Section';
import { SWRCacheViewer } from '../components/SWRCacheViewer';
import { SWRFlaky } from './SWRFlaky';
import { SWRInfiniteFeed } from './SWRInfiniteFeed';
import { SWRPagination } from './SWRPagination';
import { SWRSearch } from './SWRSearch';
import { SWRStatsRow } from './SWRStatsRow';
import { SWRTaskBoard } from './SWRTaskBoard';

export function SWRDashboard() {
  return (
    <div className="dashboard">
      <div className="impl-banner impl-banner-swr">
        <b>Implementation 3 — SWR.</b> The name is the philosophy:{' '}
        <i>stale-while-revalidate</i> — always show cached data instantly, always revalidate in the
        background. Repeat the Manual-tab actions and compare the network panel. SWR is ~4–5 kB
        gzipped vs React Query's ~12–13 kB.
      </div>

      <Section
        title="Deduplication"
        lesson={
          <>
            Both badges call <code>useSWR('/stats', …)</code>. Requests to the same key within{' '}
            <code>dedupingInterval</code> (2s here) collapse into one.
          </>
        }
      >
        <SWRStatsRow />
      </Section>

      <Section
        title="Task board — mutate() with optimisticData & rollbackOnError"
        lesson={
          <>
            SWR has no <code>useMutation</code>: writes are plain async calls synced via{' '}
            <code>mutate(promise, {'{'} optimisticData, rollbackOnError, revalidate {'}'})</code>.
            Check “make the server reject it” and watch the row appear instantly, then vanish on
            rollback. Invalidating related keys uses a key <i>filter function</i> — SWR keys have
            no hierarchy like React Query's arrays.
          </>
        }
      >
        <SWRTaskBoard />
      </Section>

      <Section
        title="Search — no race"
        lesson={
          <>
            Same fix as React Query: the query lives in the key{' '}
            <code>/tasks/search?q=…</code>, so stale responses land in stale keys. A{' '}
            <code>null</code> key disables fetching (SWR's <code>enabled: false</code>).
          </>
        }
      >
        <SWRSearch />
      </Section>

      <Section
        title="Pagination — keepPreviousData"
        lesson={
          <>
            <code>keepPreviousData: true</code> keeps the old page visible while the new one loads.
            Visited pages are cached by key → instant back-navigation.
          </>
        }
      >
        <SWRPagination />
      </Section>

      <Section
        title="Infinite scroll — useSWRInfinite"
        lesson={
          <>
            Lower-level than <code>useInfiniteQuery</code>: you write the key function and derive{' '}
            <code>hasNextPage</code> yourself from the last page; “fetch more” is{' '}
            <code>setSize(size + 1)</code>.
          </>
        }
      >
        <SWRInfiniteFeed />
      </Section>

      <Section
        title="Retry — on by default"
        lesson={
          <>
            SWR retries errors with exponential backoff <i>by default</i>{' '}
            (<code>errorRetryCount</code>/<code>errorRetryInterval</code>). Less configurable than
            React Query's <code>retryDelay</code> function, but zero setup.
          </>
        }
      >
        <SWRFlaky />
      </Section>

      <Section
        title="SWR cache viewer"
        lesson={
          <>
            SWR's cache is a plain <code>Map</code> of key → state. Note the differences from React
            Query's visualizer: no observer counts, no fresh/stale flag, no GC — and no official
            devtools.
          </>
        }
      >
        <SWRCacheViewer />
      </Section>
    </div>
  );
}
