// ---------------------------------------------------------------------------
// RACE CONDITION DEMO (manual version) — type "typescript" QUICKLY.
//
// The mock API makes SHORT queries SLOWER than long ones (realistic: "t"
// matches everything, "typescript" matches little). So while typing:
//
//   t          → request A fired, takes ~2000ms
//   typescript → request B fired, takes ~250ms
//
// Request B resolves first and renders the right results… then request A
// finally lands and OVERWRITES them with results for "t". The UI now shows
// results that don't match the input. Classic out-of-order race.
//
// The bug: this effect has no cancellation. EVERY response calls setResults,
// regardless of whether its query is still the current one.
//
// Why React Query doesn't have this bug: data is stored PER QUERY KEY.
// The response for ['search', 't'] is written into the cache entry for 't',
// and the component only ever renders the entry for the CURRENT key — a late
// response for an old key can never leak into the current view.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { SearchResult } from '../api/types';

export function ManualSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }
    setLoading(true);
    api
      .searchTasks('manual', query)
      .then((res) => {
        // 🐛 THE BUG: no check that `query` is still what the user typed.
        // A fix exists (AbortController or an `ignore` flag in cleanup),
        // but you must remember it in EVERY fetching effect you ever write.
        setResults(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query]);

  const mismatch = results !== null && results.query !== query;

  return (
    <div>
      <input
        className="search-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Type "typescript" fast…'
      />
      {loading && <span className="muted"> ⏳ searching…</span>}
      {results && (
        <div className={mismatch ? 'race-mismatch' : ''}>
          <p>
            Showing results for <b>“{results.query}”</b> — you typed <b>“{query}”</b>
            {mismatch && <span className="race-alert"> ⚠️ OUT-OF-ORDER RESPONSE: stale results overwrote fresh ones!</span>}
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
