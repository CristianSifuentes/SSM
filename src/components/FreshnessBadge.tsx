// Shows WHEN data was last confirmed by the server and whether a background
// refetch is in flight. The green flash when `updatedAt` changes is the
// visual proof of stale-while-revalidate: stale data stayed on screen, then
// was silently replaced by fresh data.

import { useEffect, useRef, useState } from 'react';

export function FreshnessBadge({
  updatedAt,
  fetching,
}: {
  updatedAt: number | undefined;
  fetching: boolean;
}) {
  const [flash, setFlash] = useState(false);
  const previous = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (updatedAt && previous.current && updatedAt !== previous.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1500);
      return () => clearTimeout(t);
    }
    previous.current = updatedAt;
  }, [updatedAt]);

  useEffect(() => {
    previous.current = updatedAt;
  }, [updatedAt]);

  return (
    <span className={`freshness ${flash ? 'freshness-flash' : ''}`}>
      {fetching && <span className="spinner-inline" aria-label="revalidating" />}
      {fetching
        ? ' revalidating in background…'
        : updatedAt
          ? `data confirmed at ${new Date(updatedAt).toLocaleTimeString()}`
          : 'no data yet'}
      {flash && ' — fresh data arrived!'}
    </span>
  );
}
