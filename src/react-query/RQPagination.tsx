// PAGINATION DEMO (React Query version).
//
// `placeholderData: keepPreviousData` = while page N+1 loads, keep showing
// page N (dimmed via isPlaceholderData) instead of a blank spinner. And each
// page lives in its own cache entry (['tasks','page',N]), so going BACK to a
// page you've seen renders instantly from cache.

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import { taskKeys } from './keys';

export function RQPagination() {
  const [page, setPage] = useState(1);

  const { data, isPending, isFetching, isPlaceholderData } = useQuery({
    queryKey: taskKeys.page(page), // page number in the key → per-page caching
    queryFn: () => api.getTaskPage('react-query', page),
    placeholderData: keepPreviousData, // ← no flash between pages
  });

  return (
    <div>
      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          ← Prev
        </button>
        <span>
          Page {data?.page ?? page} / {data?.totalPages ?? '…'}
          {isFetching && ' ⏳'}
        </span>
        <button
          disabled={isPlaceholderData || (data !== undefined && page >= data.totalPages)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
      {isPending ? (
        <div className="loading-block">⏳ Loading first page…</div>
      ) : (
        // Dim the list while it's showing the *previous* page's data.
        <ul className="result-list" style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
          {data?.items.map((t) => (
            <li key={t.id}>
              #{t.id} — {t.title} <span className={`priority priority-${t.priority}`}>{t.priority}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
