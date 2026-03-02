import { type HTMLAttributes } from 'react';

type StatusVariant = 'success' | 'error' | 'warning' | 'info';

interface StatusMessageProps extends HTMLAttributes<HTMLDivElement> {
  variant?: StatusVariant;
}

function StatusMessage({ variant, className, ...props }: StatusMessageProps) {
  const cls = [
    'hds-status-msg',
    variant && `hds-status-msg--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={cls} role="status" {...props} />;
}

export { StatusMessage };
export type { StatusMessageProps };
