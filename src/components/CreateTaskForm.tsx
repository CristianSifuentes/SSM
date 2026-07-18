// Shared "new task" form. The "make the server reject it" checkbox powers the
// optimistic-update-with-rollback demo: check it, submit, and watch what each
// implementation does when the write fails.

import { useState } from 'react';
import type { FormEvent } from 'react';

export function CreateTaskForm({
  onCreate,
  busy = false,
}: {
  onCreate: (title: string, failOnPurpose: boolean) => void;
  busy?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [failOnPurpose, setFailOnPurpose] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed, failOnPurpose);
    setTitle('');
  }

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title…"
        aria-label="New task title"
      />
      <label className="fail-toggle">
        <input
          type="checkbox"
          checked={failOnPurpose}
          onChange={(e) => setFailOnPurpose(e.target.checked)}
        />
        make the server reject it
      </label>
      <button type="submit" disabled={busy || !title.trim()}>
        {busy ? 'Saving…' : 'Add task'}
      </button>
    </form>
  );
}
