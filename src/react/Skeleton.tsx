import { type HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  const cls = ['hds-skeleton', className].filter(Boolean).join(' ');
  return <div className={cls} aria-hidden="true" {...props} />;
}

export { Skeleton };
export type { SkeletonProps };
