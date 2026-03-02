import { type HTMLAttributes } from 'react';

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

function Spinner({ label = 'Loading', className, ...props }: SpinnerProps) {
  const cls = ['hds-spinner', className].filter(Boolean).join(' ');
  return <div className={cls} role="status" aria-label={label} {...props} />;
}

export { Spinner };
export type { SpinnerProps };
