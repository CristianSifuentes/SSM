// PAGINATION DEMO (manual version).
//
// Every page change clears the data and shows a spinner — the dreaded
// "flash of loading" between pages, because there is nowhere to keep the
// previous page while the next one loads. (You could keep it in yet another
// useState… which is exactly the kind of ad-hoc cache these libraries
// formalize.) Compare with React Query's `placeholderData: keepPreviousData`
// and SWR's `keepPreviousData: true`, where the old page stays visible,
// slightly dimmed, until the new one arrives.

import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { TaskPage } from '../api/types';

export function ManualPagination() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TaskPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null); // 😬 goodbye previous page, hello spinner
    let ignore = false;
    api
      .getTaskPage('manual', page)
      .then((res) => {
        if (!ignore) setData(res);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [page]);

  return (
    <div>
      <div className="pager">
        <button disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
          ← Prev
        </button>
        <span>
          Page {data?.page ?? page} / {data?.totalPages ?? '…'}
        </span>
        <button
          disabled={loading || (data !== null && page >= data.totalPages)}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
        {/* Also note: pages are NEVER cached. Going back to a page you just
            saw refetches it from scratch. */}
      </div>
      {loading ? (
        <div className="loading-block">⏳ Blank + spinner on EVERY page change…</div>
      ) : (
        <ul className="result-list">
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
