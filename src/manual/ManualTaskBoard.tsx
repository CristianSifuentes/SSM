// ---------------------------------------------------------------------------
// MANUAL IMPLEMENTATION — the task board, "the painful way".
//
// Count the ceremony below and compare with react-query/RQTaskBoard.tsx:
//
//   • THREE useState hooks (data / loading / error) for ONE piece of server
//     data — and this trio must be re-created in every component that
//     fetches anything.
//   • A hand-rolled load() function and a useEffect to call it on mount.
//   • ZERO caching: unmount this tab and come back → blank screen + spinner,
//     even if the data is 2 seconds old.
//   • After EVERY mutation we must REMEMBER to call load() again. Forget it
//     once (see the "forgetful delete" button) and the UI silently lies.
//   • No deduplication: mount two components needing the same data and you
//     pay for two requests (see ManualStatsRow).
//   • No retries, no background refresh, no window-focus revalidation.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Task, TaskStatus } from '../api/types';
import { CreateTaskForm } from '../components/CreateTaskForm';
import { TaskItem } from '../components/TaskItem';
import { useToast } from '../components/Toast';

export function ManualTaskBoard() {
  // The infamous triplet. Every manually-fetching component starts like this.
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks('manual');
      setTasks(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount. When this component unmounts, the data is GONE — there
  // is no cache to come back to. That's why switching tabs always shows a
  // spinner in the Manual version but not in React Query / SWR.
  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(title: string, failOnPurpose: boolean) {
    setSaving(true);
    try {
      await api.createTask('manual', title, failOnPurpose);
      // ⚠️ MANUAL REFETCH: we must remember to do this after every mutation,
      // in every component, forever. There is no "optimistic update" here —
      // the user stares at a frozen UI until BOTH requests finish.
      await load();
    } catch (err) {
      toast(`Create failed: ${(err as Error).message}`, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvance(id: number, status: TaskStatus) {
    try {
      await api.updateTask('manual', id, { status });
      await load(); // ...remembered here...
    } catch (err) {
      toast(`Update failed: ${(err as Error).message}`, 'error');
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.deleteTask('manual', id);
      // 🐛 DELIBERATE BUG: we "forgot" to call load() here. The task is gone
      // on the server but still visible in the UI until something else
      // happens to refetch. This is the class of bug query invalidation
      // eliminates: with React Query you invalidate ['tasks'] ONCE in the
      // mutation, and every component using that data updates itself.
      toast('Deleted on the server… but we “forgot” to refetch. The list is now lying to you — press Reload.', 'error');
    } catch (err) {
      toast(`Delete failed: ${(err as Error).message}`, 'error');
    }
  }

  if (loading && !tasks) {
    return <div className="loading-block">⏳ Loading tasks… (full spinner EVERY time you visit this tab)</div>;
  }
  if (error) {
    return (
      <div className="error-block">
        💥 {error} — no automatic retry here. <button onClick={load}>Retry by hand</button>
      </div>
    );
  }

  return (
    <div>
      <CreateTaskForm onCreate={handleCreate} busy={saving} />
      <ul className="task-list">
        {tasks?.slice(0, 10).map((task) => (
          <TaskItem key={task.id} task={task} onAdvance={handleAdvance} onDelete={handleDelete} />
        ))}
      </ul>
      <button onClick={load} disabled={loading}>
        {loading ? 'Reloading…' : 'Reload (manual refetch)'}
      </button>
    </div>
  );
}
