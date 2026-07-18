// DEDUPLICATION DEMO (React Query version).
//
// Same two components as the manual version, both asking for /stats — but
// both useQuery calls share the query key ['stats'], so they share ONE cache
// entry and ONE in-flight request. Check the network panel: one request,
// not two. While the data is fresh (staleTime), remounting doesn't even hit
// the network.

import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { statsKey } from './keys';

function RQStatsBadge({ label }: { label: string }) {
  const { data: stats, isPending } = useQuery({
    queryKey: statsKey,
    queryFn: () => api.getStats('react-query'),
  });

  return (
    <div className="stats-badge">
      <span className="muted">{label}</span>
      {isPending ? (
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

export function RQStatsRow() {
  return (
    <div className="stats-row">
      {/* Same data, two components, ONE request (shared cache entry). */}
      <RQStatsBadge label="Header stats" />
      <RQStatsBadge label="Sidebar stats" />
    </div>
  );
}
