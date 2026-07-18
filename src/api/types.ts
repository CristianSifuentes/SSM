// ---------------------------------------------------------------------------
// Shared domain types used by all three implementations.
// ---------------------------------------------------------------------------

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: number;
}

/** A page of tasks (offset pagination). */
export interface TaskPage {
  items: Task[];
  page: number;
  totalPages: number;
  total: number;
}

/** Search results echo the query back, so the UI can detect out-of-order
 *  responses (the race-condition demo depends on this). */
export interface SearchResult {
  query: string;
  items: Task[];
}

export interface ActivityEvent {
  id: number;
  message: string;
  createdAt: number;
}

/** A page of the activity feed (cursor pagination, for infinite scroll). */
export interface ActivityPage {
  events: ActivityEvent[];
  /** null = no more pages. */
  nextCursor: number | null;
}

export interface Stats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

/** Which implementation fired a request — used by the network panel to
 *  compare request counts side by side. */
export type Source = 'manual' | 'react-query' | 'swr';
