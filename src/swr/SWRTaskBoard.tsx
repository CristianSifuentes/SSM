// ---------------------------------------------------------------------------
// SWR — the task board.
//
// SWR ("stale-while-revalidate", from the HTTP Cache-Control extension) is
// built around one idea: ALWAYS return cached (stale) data first, then
// revalidate in the background. The API surface is tiny:
//
//   const { data, error, isLoading, mutate } = useSWR(key, fetcher)
//
// Differences from React Query to notice here:
//   • Keys are usually plain strings (often the URL itself).
//   • There is no useMutation — writes are ordinary async functions, and you
//     sync the cache with `mutate(promise, options)`. Optimistic updates +
//     rollback are options on mutate: optimisticData / rollbackOnError.
//   • "Invalidation" is just calling mutate(key) — it revalidates that key.
//     There is no hierarchical key matching out of the box.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { api } from '../api/client';
import type { Task, TaskStatus } from '../api/types';
import { CreateTaskForm } from '../components/CreateTaskForm';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { TaskItem } from '../components/TaskItem';
import { useToast } from '../components/Toast';

export function SWRTaskBoard() {
  const toast = useToast();
  // `mutate` from useSWRConfig lets us revalidate OTHER keys (like the
  // paginated pages) after a write — SWR's version of invalidation.
  const { mutate: globalMutate } = useSWRConfig();

  const {
    data: tasks,
    error,
    isLoading, // no data yet (first load)
    isValidating, // any (re)validation in flight
    mutate, // bound to this key: '/tasks'
  } = useSWR('/tasks', () => api.getTasks('swr'));

  // SWR doesn't expose a dataUpdatedAt like React Query, so we track it
  // ourselves for the freshness badge (a small API-surface difference).
  const [updatedAt, setUpdatedAt] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (tasks) setUpdatedAt(Date.now());
  }, [tasks]);

  /** Revalidate every task-related key after a successful write. SWR has no
   *  hierarchical keys, so we match with a filter function. */
  function revalidateTaskKeys() {
    globalMutate((key) => typeof key === 'string' && key.startsWith('/tasks'));
  }

  // --- CREATE with optimistic update + rollback ---------------------------
  async function handleCreate(title: string, failOnPurpose: boolean) {
    const optimisticTask: Task = {
      id: -Date.now(),
      title,
      status: 'todo',
      priority: 'medium',
      createdAt: Date.now(),
    };
    try {
      await mutate(
        // The actual write. Its promise drives success/failure.
        api.createTask('swr', title, failOnPurpose).then(() => undefined),
        {
          // Shown IMMEDIATELY, before the request resolves:
          optimisticData: (current) => [optimisticTask, ...(current ?? [])],
          // If the promise rejects, SWR restores the previous cache value:
          rollbackOnError: true,
          // Don't write the promise result into the cache; instead…
          populateCache: false,
          // …refetch the list so the cache reflects server truth:
          revalidate: true,
        }
      );
      revalidateTaskKeys();
    } catch (err) {
      toast(`Server rejected the create — SWR rolled the UI back. (${(err as Error).message})`, 'error');
    }
  }

  async function handleAdvance(id: number, status: TaskStatus) {
    try {
      await mutate(api.updateTask('swr', id, { status }).then(() => undefined), {
        optimisticData: (current) => (current ?? []).map((t) => (t.id === id ? { ...t, status } : t)),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      });
      revalidateTaskKeys();
    } catch (err) {
      toast(`Update failed, rolled back: ${(err as Error).message}`, 'error');
    }
  }

  async function handleDelete(id: number) {
    try {
      await mutate(api.deleteTask('swr', id).then(() => undefined), {
        optimisticData: (current) => (current ?? []).filter((t) => t.id !== id),
        rollbackOnError: true,
        populateCache: false,
        revalidate: true,
      });
      revalidateTaskKeys();
    } catch (err) {
      toast(`Delete failed, rolled back: ${(err as Error).message}`, 'error');
    }
  }

  if (isLoading) return <div className="loading-block">⏳ First load only — SWR serves stale data instantly afterwards.</div>;
  if (error) return <div className="error-block">💥 {(error as Error).message}</div>;

  return (
    <div>
      <FreshnessBadge updatedAt={updatedAt} fetching={isValidating} />
      <CreateTaskForm onCreate={handleCreate} busy={false} />
      <ul className="task-list">
        {tasks?.slice(0, 10).map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            pending={task.id < 0}
            onAdvance={handleAdvance}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    </div>
  );
}
