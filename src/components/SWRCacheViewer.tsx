// SWR's cache is just a Map from key → state. There are no official DevTools
// (unlike React Query), but we can iterate the Map ourselves. Notice how much
// less metadata SWR keeps compared to React Query's QueryCache: no observer
// counts, no configurable garbage collection — keys stay until page reload.

import { useEffect, useReducer } from 'react';
import { useSWRConfig } from 'swr';

export function SWRCacheViewer() {
  const { cache } = useSWRConfig();
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const t = setInterval(forceRender, 1000);
    return () => clearInterval(t);
  }, []);

  const keys = Array.from(cache.keys()).filter((k) => !k.startsWith('$inf$'));
  const infiniteKeys = Array.from(cache.keys()).filter((k) => k.startsWith('$inf$'));

  return (
    <div className="cache-viz">
      <table>
        <thead>
          <tr>
            <th>SWR cache key</th>
            <th>Has data</th>
            <th>Validating</th>
          </tr>
        </thead>
        <tbody>
          {keys.length === 0 && infiniteKeys.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                Cache is empty — visit the demos above.
              </td>
            </tr>
          )}
          {keys.map((key) => {
            const state = cache.get(key);
            return (
              <tr key={key}>
                <td>
                  <code>{key}</code>
                </td>
                <td>{state?.data !== undefined ? '✓' : '—'}</td>
                <td>{state?.isValidating ? '⏳' : 'idle'}</td>
              </tr>
            );
          })}
          {infiniteKeys.map((key) => (
            <tr key={key}>
              <td>
                <code>{key}</code> <span className="muted">(useSWRInfinite)</span>
              </td>
              <td>✓</td>
              <td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
