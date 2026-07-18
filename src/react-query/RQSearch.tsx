// ---------------------------------------------------------------------------
// RACE CONDITION DEMO (React Query version) — same API, same latency quirk,
// no race. Type "typescript" as fast as you like.
//
// WHY THE RACE DISAPPEARS: the query key ['tasks','search','<q>'] includes
// the query string. Each keystroke switches the component to a DIFFERENT
// cache entry. When the slow response for "t" finally arrives, React Query
// writes it into the cache entry for "t" — an entry this component is no
// longer observing. Out-of-order responses can't overwrite the current view,
// because "current view" is defined by the key, not by whichever setState
// ran last.
//
// Bonus: each search result is cached, so retyping a previous query shows
// results instantly (staleTime: 30s below).
// ---------------------------------------------------------------------------

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import { taskKeys } from './keys';

export function RQSearch() {
  const [query, setQuery] = useState('');

  const { data: results, isFetching } = useQuery({
    queryKey: taskKeys.search(query), // ← the fix, right here
    queryFn: () => api.searchTasks('react-query', query),
    enabled: query.length > 0, // don't fetch for the empty string
    staleTime: 30_000, // typed queries stay cached for 30s
    placeholderData: keepPreviousData, // show last results while typing (no flicker)
  });

  const mismatch = results !== undefined && results.query !== query && query.length > 0;

  return (
    <div>
      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Type "typescript" fast — no race this time'
      />
      {isFetching && <span className="muted"> ⏳ searching…</span>}
      {results && query && (
        <div className={mismatch ? 'race-mismatch' : ''}>
          <p>
            Showing results for <b>“{results.query}”</b> — you typed <b>“{query}”</b>
            {mismatch ? (
              <span className="race-alert"> (placeholder from previous key, being replaced…)</span>
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
