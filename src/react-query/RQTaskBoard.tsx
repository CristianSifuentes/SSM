// ---------------------------------------------------------------------------
// REACT QUERY — the task board.
//
// Compare with manual/ManualTaskBoard.tsx:
//   • The data/loading/error triplet is ONE useQuery call.
//   • Leave the tab and come back → the cached board renders INSTANTLY
//     (stale-while-revalidate), with a silent background refetch.
//   • Mutations use the full optimistic-update lifecycle:
//       onMutate  → snapshot cache, apply optimistic change (UI updates NOW)
//       onError   → restore snapshot (automatic rollback) + toast
//       onSettled → invalidate, so the cache re-syncs with server truth
//     Check "make the server reject it" on the form to watch the rollback.
//   • Invalidation replaces "remember to refetch": one invalidateQueries
//     call marks every task query stale, and active ones refetch themselves.
// ---------------------------------------------------------------------------

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Task, TaskStatus } from '../api/types';
import { CreateTaskForm } from '../components/CreateTaskForm';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { TaskItem } from '../components/TaskItem';
import { useToast } from '../components/Toast';
import { taskKeys } from './keys';

export function RQTaskBoard() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // The entire manual triplet + effect + reload button, in one hook.
  const {
    data: tasks,
    isPending, // no cached data yet → first-ever load
    isFetching, // any fetch in flight (incl. background revalidation)
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: taskKeys.board(),
    queryFn: () => api.getTasks('react-query'),
    placeholderData: keepPreviousData,
  });

  // --- CREATE with optimistic update + rollback ---------------------------
  const createTask = useMutation({
    mutationFn: ({ title, failOnPurpose }: { title: string; failOnPurpose: boolean }) =>
      api.createTask('react-query', title, failOnPurpose),

    // 1) onMutate runs BEFORE the request. Update the cache now so the UI is
    //    instant; return a snapshot for potential rollback.
    onMutate: async ({ title }) => {
      // Cancel in-flight board fetches so a stale response can't clobber
      // our optimistic entry while the mutation is pending.
      await queryClient.cancelQueries({ queryKey: taskKeys.board() });
      const previousBoard = queryClient.getQueryData<Task[]>(taskKeys.board());

      const optimisticTask: Task = {
        id: -Date.now(), // temporary negative id until the server assigns one
        title,
        status: 'todo',
        priority: 'medium',
        createdAt: Date.now(),
      };
      queryClient.setQueryData<Task[]>(taskKeys.board(), (old) =>
        old ? [optimisticTask, ...old] : [optimisticTask]
      );
      return { previousBoard }; // becomes `context` in onError/onSettled
    },

    // 2) onError: the server rejected the write → put the snapshot back.
    onError: (err, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(taskKeys.board(), context.previousBoard);
      }
      toast(`Server rejected the create — UI rolled back automatically. (${err.message})`, 'error');
    },

    // 3) onSettled (success OR error): re-sync with server truth. This one
    //    line replaces every hand-written "remember to refetch" call — it
    //    marks ALL task queries (board, pages, searches) stale at once, and
    //    the active ones refetch automatically. Watch it in the network log.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  // --- UPDATE STATUS, optimistically --------------------------------------
  const advanceTask = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      api.updateTask('react-query', id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.board() });
      const previousBoard = queryClient.getQueryData<Task[]>(taskKeys.board());
      queryClient.setQueryData<Task[]>(taskKeys.board(), (old) =>
        old?.map((t) => (t.id === id ? { ...t, status } : t))
      );
      return { previousBoard };
    },
    onError: (err, _variables, context) => {
      if (context?.previousBoard) queryClient.setQueryData(taskKeys.board(), context.previousBoard);
      toast(`Update failed, rolled back: ${err.message}`, 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });

  // --- DELETE, optimistically ----------------------------------------------
  // Note there is no way to "forget to refetch" here: invalidation lives
  // WITH the mutation, not scattered across call sites.
  const deleteTask = useMutation({
    mutationFn: (id: number) => api.deleteTask('react-query', id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.board() });
      const previousBoard = queryClient.getQueryData<Task[]>(taskKeys.board());
      queryClient.setQueryData<Task[]>(taskKeys.board(), (old) => old?.filter((t) => t.id !== id));
      return { previousBoard };
    },
    onError: (err, _id, context) => {
      if (context?.previousBoard) queryClient.setQueryData(taskKeys.board(), context.previousBoard);
      toast(`Delete failed, rolled back: ${err.message}`, 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: taskKeys.all }),
  });

  if (isPending) {
    return <div className="loading-block">⏳ First load only — after this, the cache serves instantly.</div>;
  }
  if (isError) {
    return (
      <div className="error-block">
        💥 {error.message} <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <FreshnessBadge updatedAt={dataUpdatedAt} fetching={isFetching} />
      <CreateTaskForm
        onCreate={(title, failOnPurpose) => createTask.mutate({ title, failOnPurpose })}
        // NOT disabled while saving: optimistic UI means the user never waits.
        busy={false}
      />
      <ul className="task-list">
        {tasks?.slice(0, 10).map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            pending={task.id < 0} // optimistic rows have temporary negative ids
            onAdvance={(id, status) => advanceTask.mutate({ id, status })}
            onDelete={(id) => deleteTask.mutate(id)}
          />
        ))}
      </ul>
    </div>
  );
}
