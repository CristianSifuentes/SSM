// GARBAGE COLLECTION DEMO.
//
// gcTime controls how long data with ZERO observers (no mounted component
// uses it) stays cached. Mount the child → the query appears in the Cache
// Visualizer. Unmount it → observers drop to 0 ("inactive") and a 12s timer
// starts. Remount within 12s → instant data, no request. Wait longer → the
// entry vanishes from the cache table, and the next mount is a cold load.

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import { gcDemoKey } from './keys';

function GcChild() {
  const { data, isPending } = useQuery({
    queryKey: gcDemoKey,
    queryFn: () => api.getStats('react-query'),
    staleTime: 6_000, // fresh for 6s
    gcTime: 12_000, // evicted 12s after becoming inactive
  });

  return (
    <p>
      {isPending ? '⏳ cold load…' : `Cached stats: ${data?.total} tasks.`}{' '}
      <span className="muted">
        (key <code>["gc-demo"]</code>, staleTime 6s, gcTime 12s)
      </span>
    </p>
  );
}

export function RQGcDemo() {
  const [mounted, setMounted] = useState(false);

  return (
    <div>
      <button onClick={() => setMounted((m) => !m)}>
        {mounted ? 'Unmount component (observers → 0, GC timer starts)' : 'Mount component'}
      </button>
      {mounted && <GcChild />}
      {!mounted && (
        <p className="muted">
          While unmounted, watch <code>["gc-demo"]</code> in the Cache Visualizer below: it lingers
          as <i>inactive</i> for 12 seconds, then disappears. Remount before that and the data is
          served instantly with no request.
        </p>
      )}
    </div>
  );
}
