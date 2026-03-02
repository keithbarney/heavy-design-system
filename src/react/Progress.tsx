import { type HTMLAttributes } from 'react';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  complete?: boolean;
}

function Progress({ value, max = 100, complete, className, ...props }: ProgressProps) {
  const cls = ['hds-progress', className].filter(Boolean).join(' ');
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const barCls = [
    'hds-progress-bar',
    (complete || percent >= 100) && 'hds-progress-bar--complete',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} {...props}>
      <div className={barCls} style={{ width: `${percent}%` }} />
    </div>
  );
}

export { Progress };
export type { ProgressProps };
