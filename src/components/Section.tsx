// A titled demo card with a "lesson" callout. Every demo in the lab lives in
// one of these so the pedagogy is impossible to miss.

import type { ReactNode } from 'react';

export function Section({
  title,
  lesson,
  children,
}: {
  title: string;
  lesson: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <h3 className="card-title">{title}</h3>
      <div className="card-body">{children}</div>
      <div className="lesson">
        <span className="lesson-icon">💡</span>
        <div>{lesson}</div>
      </div>
    </section>
  );
}
