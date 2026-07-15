// ---------------------------------------------------------------------------
// QUERY KEY FACTORY.
//
// Query keys are React Query's #1 concept: they identify a cache entry, they
// are the dependency array of the fetch (key changes → refetch), and they are
// how you target invalidation. Centralizing them in a factory prevents the
// most common pitfall — two components spelling the "same" key differently
// (['tasks'] vs ['task-list']) and silently getting two cache entries.
//
// Keys are hierarchical so invalidation can be surgical or broad:
//   invalidateQueries({ queryKey: taskKeys.all })    → everything task-related
//   invalidateQueries({ queryKey: taskKeys.pages() })→ only paginated lists
// ---------------------------------------------------------------------------

export const taskKeys = {
  all: ['tasks'] as const,
  board: () => [...taskKeys.all, 'board'] as const,
  pages: () => [...taskKeys.all, 'page'] as const,
  page: (page: number) => [...taskKeys.pages(), page] as const,
  searches: () => [...taskKeys.all, 'search'] as const,
  search: (query: string) => [...taskKeys.searches(), query] as const,
};

export const statsKey = ['stats'] as const;
export const activityKey = ['activity'] as const;
export const flakyKey = ['flaky-quote'] as const;
export const gcDemoKey = ['gc-demo'] as const;
