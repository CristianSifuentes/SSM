// Shared task row used by all three board implementations, so the ONLY thing
// that differs between /manual, /react-query and /swr is data fetching.

import type { Task, TaskStatus } from '../api/types';

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
};

export function TaskItem({
  task,
  onAdvance,
  onDelete,
  pending = false,
}: {
  task: Task;
  onAdvance: (id: number, status: TaskStatus) => void;
  onDelete: (id: number) => void;
  /** True while this row only exists optimistically (server hasn't confirmed). */
  pending?: boolean;
}) {
  return (
    <li className={`task-item ${pending ? 'task-pending' : ''}`}>
      <button
        className={`status-chip status-${task.status}`}
        title="Advance status"
        onClick={() => onAdvance(task.id, NEXT_STATUS[task.status])}
      >
        {task.status}
      </button>
      <span className="task-title">{task.title}</span>
      {pending && <span className="pending-badge">saving…</span>}
      <span className={`priority priority-${task.priority}`}>{task.priority}</span>
      <button className="icon-btn" title="Delete task" onClick={() => onDelete(task.id)}>
        ✕
      </button>
    </li>
  );
}
