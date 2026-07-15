// RACE CONDITION DEMO (SWR version) — same fix as React Query, same reason:
// the key `/tasks/search?q=<query>` changes with every keystroke, so each
// response is filed under its own key and can't overwrite the current view.
// A `null` key means "don't fetch" (SWR's version of `enabled: false`).

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../api/client';

export function SWRSearch() {
  const [query, setQuery] = useState('');

  const { data: results, isValidating } = useSWR(
    // Conditional fetching: null key = no request.
    query ? `/tasks/search?q=${query}` : null,
    () => api.searchTasks('swr', query),
    { keepPreviousData: true } // show last results while typing
  );

  const mismatch = results !== undefined && query.length > 0 && results.query !== query;

  return (
    <div>
      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Type "typescript" fast — no race here either'
      />
      {isValidating && <span className="muted"> ⏳ searching…</span>}
      {results && query && (
        <div>
          <p>
            Showing results for <b>“{results.query}”</b> — you typed <b>“{query}”</b>
            {mismatch ? (
              <span className="race-alert"> (previous key kept while loading…)</span>
            ) : (
              <span className="race-ok"> ✓ always in sync</span>
            )}
          </p>
          <ul className="result-list">
            {results.items.map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
            {results.items.length === 0 && <li className="muted">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
