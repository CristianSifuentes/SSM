// The "painful way" dashboard: useEffect + useState + fetch for everything.
// Each section demonstrates one failure mode of manual server-state handling.

import { Section } from '../components/Section';
import { ManualFlaky } from './ManualFlaky';
import { ManualPagination } from './ManualPagination';
import { ManualSearch } from './ManualSearch';
import { ManualStatsRow } from './ManualStatsRow';
import { ManualTaskBoard } from './ManualTaskBoard';

export function ManualDashboard() {
  return (
    <div className="dashboard">
      <div className="impl-banner impl-banner-manual">
        <b>Implementation 1 — Manual fetching.</b> Every demo below uses only{' '}
        <code>useEffect + useState + fetch</code>. Watch the network panel and count the requests;
        then repeat the same actions in the React Query and SWR tabs.
      </div>

      <Section
        title="Duplicate requests (no deduplication)"
        lesson={
          <>
            Two components need <code>/stats</code>, so two requests fire — every time this tab
            mounts. There is no shared cache to deduplicate through. React Query/SWR fire{' '}
            <b>one</b> request for the same two components.
          </>
        }
      >
        <ManualStatsRow />
      </Section>

      <Section
        title="Task board (mutations = remember to refetch)"
        lesson={
          <>
            Every component carries a <code>data/loading/error</code> useState triplet. After each
            mutation you must <i>remember</i> to refetch — the delete button here “forgets” on
            purpose, and the UI silently shows deleted tasks. Also: leave this tab and come back —
            full spinner, because nothing is cached.
          </>
        }
      >
        <ManualTaskBoard />
      </Section>

      <Section
        title="Search (race condition!)"
        lesson={
          <>
            Type <code>typescript</code> fast. Short queries respond slower than long ones, so an
            old response can land <i>after</i> a newer one and overwrite it — the results stop
            matching the input. The effect has no cancellation, and every response calls{' '}
            <code>setResults</code> unconditionally.
          </>
        }
      >
        <ManualSearch />
      </Section>

      <Section
        title="Pagination (flash of loading)"
        lesson={
          <>
            No cache means each page change blanks the list and shows a spinner, and revisiting a
            page refetches it. Compare with <code>keepPreviousData</code> in the other tabs.
          </>
        }
      >
        <ManualPagination />
      </Section>

      <Section
        title="Flaky endpoint (no retries)"
        lesson={
          <>
            <code>/flaky</code> fails 50% of the time and manual fetch gives up on the first
            failure. Retrying with exponential backoff by hand is real work, so it rarely gets
            written.
          </>
        }
      >
        <ManualFlaky />
      </Section>
    </div>
  );
}
