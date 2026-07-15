// DUPLICATE REQUEST DEMO (manual version).
//
// Two sibling components both need /stats. With manual fetching each one
// runs its own useEffect + fetch → TWO identical requests on every mount.
// Check the network panel: the React Query and SWR versions render the same
// two components but fire only ONE request, because both hooks share the
// same cache entry and in-flight request (deduplication).

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Stats } from '../api/types';

function ManualStatsBadge({ label }: { label: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getStats('manual')
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="stats-badge">
      <span className="muted">{label}</span>
      {loading ? (
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

export function ManualStatsRow() {
  return (
    <div className="stats-row">
      {/* Same data, two components, two requests. */}
      <ManualStatsBadge label="Header stats" />
      <ManualStatsBadge label="Sidebar stats" />
    </div>
  );
}
