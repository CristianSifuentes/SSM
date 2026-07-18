// ---------------------------------------------------------------------------
// THE API CLIENT — the only thing the three implementations import.
//
// Each function takes a `source` so the Network Panel can attribute the
// request to the implementation that fired it. Otherwise this looks exactly
// like a typical typed fetch wrapper (`fetch(...).then(r => r.json())`).
// ---------------------------------------------------------------------------

import { serverDb } from './db';
import { simulateHttp } from './http';
import type {
  ActivityPage,
  SearchResult,
  Source,
  Stats,
  Task,
  TaskPage,
  TaskStatus,
} from './types';

export const api = {
  /** GET /tasks — every task, for the board view. */
  getTasks(source: Source): Promise<Task[]> {
    return simulateHttp(source, 'GET', '/tasks', () => serverDb.getAllTasks());
  },

  /** GET /tasks?page=N */
  getTaskPage(source: Source, page: number, limit = 6): Promise<TaskPage> {
    return simulateHttp(source, 'GET', `/tasks?page=${page}`, () =>
      serverDb.getTaskPage(page, limit)
    );
  },

  /**
   * GET /tasks/search?q=...
   *
   * ⚠️ Deliberate quirk for the race-condition demo: SHORTER queries are
   * SLOWER (like a real backend, where `"t"` matches thousands of rows and
   * `"typescript"` matches three). Type fast and the response for "t" can
   * arrive AFTER the response for "typescript" — the classic out-of-order
   * race that breaks naive useEffect fetching.
   */
  searchTasks(source: Source, query: string): Promise<SearchResult> {
    const latencyMs = 250 + Math.max(0, 6 - query.length) * 350;
    return simulateHttp(
      source,
      'GET',
      `/tasks/search?q=${encodeURIComponent(query)}`,
      () => serverDb.searchTasks(query),
      { latencyMs }
    );
  },

  /**
   * POST /tasks — `failOnPurpose` makes the server reject the write, which
   * is how the optimistic-update rollback demo simulates a server error.
   */
  createTask(source: Source, title: string, failOnPurpose = false): Promise<Task> {
    return simulateHttp(source, 'POST', '/tasks', () => serverDb.createTask(title), {
      failureRate: failOnPurpose ? 1 : undefined,
    });
  },

  /** PATCH /tasks/:id */
  updateTask(
    source: Source,
    id: number,
    patch: Partial<Pick<Task, 'title' | 'status' | 'priority'>> & { status?: TaskStatus },
    failOnPurpose = false
  ): Promise<Task> {
    return simulateHttp(source, 'PATCH', `/tasks/${id}`, () => serverDb.updateTask(id, patch), {
      failureRate: failOnPurpose ? 1 : undefined,
    });
  },

  /** DELETE /tasks/:id */
  deleteTask(source: Source, id: number): Promise<{ id: number }> {
    return simulateHttp(source, 'DELETE', `/tasks/${id}`, () => serverDb.deleteTask(id));
  },

  /** GET /activity?cursor=N — cursor-paginated feed for infinite scroll. */
  getActivityPage(source: Source, cursor: number, limit = 8): Promise<ActivityPage> {
    return simulateHttp(source, 'GET', `/activity?cursor=${cursor}`, () =>
      serverDb.getActivityPage(cursor, limit)
    );
  },

  /** GET /stats — used by TWO components at once (deduplication demo). */
  getStats(source: Source): Promise<Stats> {
    return simulateHttp(source, 'GET', '/stats', () => serverDb.getStats());
  },

  /** GET /flaky — ALWAYS fails 50% of the time (retry / backoff demo). */
  getFlaky(source: Source): Promise<{ quote: string; fetchedAt: number }> {
    return simulateHttp(source, 'GET', '/flaky', () => serverDb.getFlakyQuote(), {
      failureRate: 0.5,
      latencyMs: 400,
    });
  },
};
