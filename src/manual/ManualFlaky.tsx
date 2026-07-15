// FLAKY ENDPOINT DEMO (manual version).
//
// /flaky fails 50% of the time. fetch() doesn't retry — so half your clicks
// end in an error the user has to resolve themselves. Writing retry with
// exponential backoff by hand is ~20 lines of fiddly code (attempt counter,
// setTimeout, jitter, cancellation on unmount…), so in practice nobody does,
// and flaky endpoints surface straight to the user.
// React Query gives you `retry: 4` + `retryDelay` as config. SWR retries
// errors by default (errorRetryCount / errorRetryInterval).

import { useState } from 'react';
import { api } from '../api/client';

export function ManualFlaky() {
  const [quote, setQuote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchOnce() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getFlaky('manual');
      setQuote(res.quote);
    } catch (err) {
      // One attempt, one failure, straight to the user. 🎲
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={fetchOnce} disabled={loading}>
        {loading ? 'Fetching…' : 'Fetch from flaky endpoint (50% failure)'}
      </button>
      {quote && <p className="quote">“{quote}”</p>}
      {error && (
        <p className="error-block">
          💥 {error} — no retry. Click again yourself. And again. And again.
        </p>
      )}
    </div>
  );
}
