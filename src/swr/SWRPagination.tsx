// PAGINATION DEMO (SWR version).
//
// `keepPreviousData: true` (SWR ≥ 2.0) keeps the previous page on screen
// while the next loads — same UX as React Query's placeholderData. Each page
// caches under its own string key, so revisiting a page is instant.

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../api/client';

export function SWRPagination() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isValidating } = useSWR(
    `/tasks?page=${page}`,
    () => api.getTaskPage('swr', page),
    { keepPreviousData: true }
  );

  // With keepPreviousData, `data` can belong to the PREVIOUS key while the
  // new page loads — data.page tells us which one we're looking at.
  const showingStalePage = data !== undefined && data.page !== page;

  return (
    <div>
      <div className="pager">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          ← Prev
        </button>
        <span>
          Page {data?.page ?? page} / {data?.totalPages ?? '…'}
          {isValidating && ' ⏳'}
        </span>
        <button
          disabled={data !== undefined && page >= data.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
      {isLoading ? (
        <div className="loading-block">⏳ Loading first page…</div>
      ) : (
        <ul className="result-list" style={{ opacity: showingStalePage ? 0.5 : 1 }}>
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
