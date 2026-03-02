import { type HTMLAttributes } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function Badge({ variant, className, ...props }: BadgeProps) {
  const cls = [
    'hds-badge',
    variant && `hds-badge--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={cls} {...props} />;
}

export { Badge };
export type { BadgeProps };
