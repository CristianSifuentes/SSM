// RETRY WITH EXPONENTIAL BACKOFF (React Query version).
//
// Same 50%-failure endpoint as the manual demo — but here retries are pure
// configuration:
//   retry: 4                → up to 4 retries after the first failure
//   retryDelay: exponential → 500ms, 1s, 2s, 4s (capped)
// `failureCount` exposes the attempt counter so we can visualize it. The
// odds that 5 consecutive attempts all fail are ~3% — so this demo almost
// always succeeds, while the manual version fails half your clicks.

import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { flakyKey } from './keys';

export function RQFlaky() {
  const { data, isFetching, isError, error, failureCount, refetch } = useQuery({
    queryKey: flakyKey,
    queryFn: () => api.getFlaky('react-query'),
    retry: 4,
    retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4000), // exponential backoff
    staleTime: Infinity, // only refetch when the button asks
    enabled: false, // fetch on demand via refetch()
  });

  return (
    <div>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching
          ? failureCount > 0
            ? `Retrying… (attempt ${failureCount + 1} of 5, backing off)`
            : 'Fetching…'
          : 'Fetch from flaky endpoint (50% failure)'}
      </button>
      {data && <p className="quote">“{data.quote}”</p>}
      {isError && (
        <p className="error-block">💥 Gave up after 5 attempts (~3% chance): {error.message}</p>
      )}
      <p className="muted">
        Watch the network panel: each click can produce several <code>/flaky</code> requests with
        growing gaps — that's the backoff.
      </p>
    </div>
  );
}
