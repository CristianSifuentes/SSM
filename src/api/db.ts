// ---------------------------------------------------------------------------
// THE "SERVER": an in-memory database + synchronous request handlers.
//
// This module plays the role of a remote backend. The three implementations
// never touch it directly — they go through `client.ts`, which wraps every
// call in simulated network latency, random failures, and request logging.
// Because the "server" lives in memory, every scenario in the lab is 100%
// reproducible offline.
// ---------------------------------------------------------------------------

import type {
  ActivityPage,
  SearchResult,
  Stats,
  Task,
  TaskPage,
  TaskPriority,
  TaskStatus,
} from './types';

const TITLES = [
  'Design login screen',
  'Fix flaky checkout test',
  'Upgrade TypeScript to 5.5',
  'Write onboarding docs',
  'Refactor billing service',
  'Add dark mode toggle',
  'Investigate memory leak',
  'Migrate CI to new runners',
  'Review dependency updates',
  'Ship notification center',
  'Polish empty states',
  'Add rate limiting to API',
  'Instrument search latency',
  'Prototype command palette',
  'Clean up feature flags',
  'Audit accessibility',
  'Optimize bundle size',
  'Document release process',
  'Triage support backlog',
  'Improve error messages',
  'Add e2e tests for signup',
  'Rotate API credentials',
  'Benchmark list rendering',
  'Fix timezone bug in reports',
  'Set up preview deployments',
  'Archive stale branches',
  'Tune database indexes',
  'Localize settings page',
  'Reduce cold start time',
  'Split monolith router',
  'Add CSV export',
  'Harden webhook retries',
  'Update brand colors',
  'Remove dead code',
  'Add keyboard shortcuts',
  'Fix drag-and-drop ghosting',
];

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

let nextTaskId = 1;
let nextEventId = 1;

let tasks: Task[] = TITLES.map((title, i) => ({
  id: nextTaskId++,
  title,
  status: STATUSES[i % 3],
  priority: PRIORITIES[i % 3],
  createdAt: Date.now() - (TITLES.length - i) * 3_600_000,
}));

let activity: { id: number; message: string; createdAt: number }[] = Array.from(
  { length: 57 },
  (_, i) => ({
    id: nextEventId++,
    message: `Event #${i + 1}: ${TITLES[i % TITLES.length]} was ${
      ['created', 'moved to in-progress', 'commented on', 'completed'][i % 4]
    }`,
    createdAt: Date.now() - (57 - i) * 900_000,
  })
);

function logActivity(message: string) {
  activity = [...activity, { id: nextEventId++, message, createdAt: Date.now() }];
}

// --- Handlers (what an Express route would do) -----------------------------

export const serverDb = {
  /** GET /tasks — the whole board. */
  getAllTasks(): Task[] {
    return [...tasks].sort((a, b) => b.createdAt - a.createdAt);
  },

  /** GET /tasks?page=N&limit=M */
  getTaskPage(page: number, limit: number): TaskPage {
    const sorted = [...tasks].sort((a, b) => a.id - b.id);
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, page), totalPages);
    return {
      items: sorted.slice((safePage - 1) * limit, safePage * limit),
      page: safePage,
      totalPages,
      total,
    };
  },

  /** GET /tasks/search?q=... */
  searchTasks(query: string): SearchResult {
    const q = query.toLowerCase();
    return {
      query,
      items: tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 8),
    };
  },

  /** POST /tasks */
  createTask(title: string): Task {
    const task: Task = {
      id: nextTaskId++,
      title,
      status: 'todo',
      priority: 'medium',
      createdAt: Date.now(),
    };
    tasks = [...tasks, task];
    logActivity(`${title} was created`);
    return task;
  },

  /** PATCH /tasks/:id */
  updateTask(id: number, patch: Partial<Pick<Task, 'title' | 'status' | 'priority'>>): Task {
    const existing = tasks.find((t) => t.id === id);
    if (!existing) throw new Error(`404 Not Found — task ${id}`);
    const updated = { ...existing, ...patch };
    tasks = tasks.map((t) => (t.id === id ? updated : t));
    if (patch.status) logActivity(`${existing.title} moved to ${patch.status}`);
    return updated;
  },

  /** DELETE /tasks/:id */
  deleteTask(id: number): { id: number } {
    tasks = tasks.filter((t) => t.id !== id);
    return { id };
  },

  /** GET /activity?cursor=N&limit=M — cursor pagination for infinite scroll. */
  getActivityPage(cursor: number, limit: number): ActivityPage {
    const sorted = [...activity].sort((a, b) => b.id - a.id);
    const events = sorted.slice(cursor, cursor + limit);
    const next = cursor + limit;
    return { events, nextCursor: next < sorted.length ? next : null };
  },

  /** GET /stats */
  getStats(): Stats {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    };
  },

  /** GET /flaky — same payload as /stats, but the route fails 50% of the
   *  time (failure is injected in client.ts, not here). */
  getFlakyQuote(): { quote: string; fetchedAt: number } {
    const quotes = [
      'Cache invalidation is one of the two hard problems.',
      'The best request is the one you never send.',
      'Stale data now beats a spinner forever.',
      'Server state is a cache, not a source of truth.',
    ];
    return {
      quote: quotes[Math.floor(Math.random() * quotes.length)],
      fetchedAt: Date.now(),
    };
  },
};
