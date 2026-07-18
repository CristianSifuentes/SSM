// DEDUPLICATION DEMO (SWR version).
//
// Both badges call useSWR('/stats', …). SWR deduplicates identical keys
// within `dedupingInterval` (default 2s, configured in App.tsx): one request
// for both components. This is SWR's equivalent of React Query's shared
// cache entry + staleTime.

import useSWR from 'swr';
import { api } from '../api/client';

function SWRStatsBadge({ label }: { label: string }) {
  const { data: stats, isLoading } = useSWR('/stats', () => api.getStats('swr'));

  return (
    <div className="stats-badge">
      <span className="muted">{label}</span>
      {isLoading ? (
        <span>⏳</span>
      ) : stats ? (
        <span>
          {stats.total} tasks · {stats.todo} todo · {stats.inProgress} doing · {stats.done} done
        </span>
      ) : (
        <span>—</span>
      )}
    </div>
  );
}

export function SWRStatsRow() {
  return (
    <div className="stats-row">
      {/* Same data, two components, ONE request (dedupingInterval). */}
      <SWRStatsBadge label="Header stats" />
      <SWRStatsBadge label="Sidebar stats" />
    </div>
  );
}
