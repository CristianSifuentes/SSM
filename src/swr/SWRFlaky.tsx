// RETRY DEMO (SWR version).
//
// SWR retries failed requests OUT OF THE BOX: `errorRetryCount` and
// `errorRetryInterval` (with built-in exponential backoff) default to
// sensible values — you often don't configure anything. The trade-off vs
// React Query: less visibility (no failureCount to render) and coarser
// control (no per-attempt retryDelay function).

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../api/client';

export function SWRFlaky() {
  // Mount/unmount the hook to trigger a fresh fetch cycle on demand.
  const [enabled, setEnabled] = useState(false);

  const { data, error, isValidating } = useSWR(
    enabled ? '/flaky' : null,
    () => api.getFlaky('swr'),
    {
      errorRetryCount: 4,
      errorRetryInterval: 500, // SWR applies exponential backoff on top
      revalidateOnFocus: false, // keep the demo deterministic
    }
  );

  return (
    <div>
      <button onClick={() => setEnabled((e) => !e)}>
        {enabled ? 'Reset demo' : 'Fetch from flaky endpoint (50% failure)'}
      </button>
      {enabled && isValidating && !data && <p className="muted">⏳ Fetching (retrying quietly on failure)…</p>}
      {enabled && data && <p className="quote">“{data.quote}”</p>}
      {enabled && error && !isValidating && (
        <p className="error-block">💥 Gave up after retries: {(error as Error).message}</p>
      )}
      <p className="muted">
        Watch the network panel: failed <code>/flaky</code> requests are retried automatically with
        growing delays — you wrote zero retry code.
      </p>
    </div>
  );
}
