import { type ReactNode, type HTMLAttributes } from 'react';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children?: ReactNode;
}

function EmptyState({ title, description, children, className, ...props }: EmptyStateProps) {
  const cls = ['hds-empty-state', className].filter(Boolean).join(' ');

  return (
    <div className={cls} {...props}>
      <h3 className="hds-empty-state-title">{title}</h3>
      {description && <p className="hds-empty-state-description">{description}</p>}
      {children}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
