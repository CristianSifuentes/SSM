// ---------------------------------------------------------------------------
// CACHE VISUALIZER for React Query.
//
// Reads the QueryCache directly and shows, live:
//   • every query key currently cached (even for UNMOUNTED components!)
//   • fresh vs stale (controlled by `staleTime`)
//   • which queries are fetching right now (background refetches show up
//     here when you refocus the window, reconnect, or invalidate)
//   • observer count — 0 observers = "inactive"; inactive queries are
//     garbage-collected after `gcTime` and vanish from this table.
// ---------------------------------------------------------------------------

import { useEffect, useReducer } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function CacheVisualizer() {
  const queryClient = useQueryClient();
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  // Re-render on every cache event (add/remove/update)...
  useEffect(() => queryClient.getQueryCache().subscribe(forceRender), [queryClient]);
  // ...and once per second, because fresh→stale transitions are pure time
  // passing — no cache event fires when staleTime elapses.
  useEffect(() => {
    const t = setInterval(forceRender, 1000);
    return () => clearInterval(t);
  }, []);

  const queries = queryClient.getQueryCache().getAll();

  return (
    <div className="cache-viz">
      <table>
        <thead>
          <tr>
            <th>Query key</th>
            <th>Freshness</th>
            <th>Fetch status</th>
            <th>Observers</th>
            <th>Last updated</th>
          </tr>
        </thead>
        <tbody>
          {queries.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                Cache is empty — visit the demos above.
              </td>
            </tr>
          )}
          {queries.map((query) => {
            const stale = query.isStale();
            const observers = query.getObserversCount();
            const fetching = query.state.fetchStatus === 'fetching';
            return (
              <tr key={query.queryHash} className={fetching ? 'row-fetching' : ''}>
                <td>
                  <code>{JSON.stringify(query.queryKey)}</code>
                </td>
                <td>
                  {query.state.status === 'error' ? (
                    <span className="chip chip-error">error</span>
                  ) : stale ? (
                    <span className="chip chip-stale">stale</span>
                  ) : (
                    <span className="chip chip-fresh">fresh</span>
                  )}
                </td>
                <td>{fetching ? '⏳ fetching' : 'idle'}</td>
                <td>
                  {observers}{' '}
                  {observers === 0 && <span className="muted">(inactive → GC after gcTime)</span>}
                </td>
                <td className="muted">
                  {query.state.dataUpdatedAt
                    ? new Date(query.state.dataUpdatedAt).toLocaleTimeString()
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
