import { type HTMLAttributes, type ReactNode } from 'react';

/* ─── Stat ─── */

interface StatProps extends HTMLAttributes<HTMLDivElement> {}

function Stat({ className, ...props }: StatProps) {
  const cls = ['hds-stat', className].filter(Boolean).join(' ');
  return <div className={cls} {...props} />;
}

/* ─── StatValue ─── */

interface StatValueProps extends HTMLAttributes<HTMLDivElement> {
  unit?: string;
}

function StatValue({ unit, children, className, ...props }: StatValueProps) {
  const cls = ['hds-stat-value', className].filter(Boolean).join(' ');

  return (
    <div className={cls} {...props}>
      {children}
      {unit && <span className="hds-stat-unit">{unit}</span>}
    </div>
  );
}

/* ─── StatLabel ─── */

interface StatLabelProps extends HTMLAttributes<HTMLDivElement> {}

function StatLabel({ className, ...props }: StatLabelProps) {
  const cls = ['hds-stat-label', className].filter(Boolean).join(' ');
  return <div className={cls} {...props} />;
}

/* ─── StatDelta ─── */

type DeltaDirection = 'positive' | 'negative';

interface StatDeltaProps extends HTMLAttributes<HTMLSpanElement> {
  direction?: DeltaDirection;
  children: ReactNode;
}

function StatDelta({ direction, className, ...props }: StatDeltaProps) {
  const cls = [
    'hds-stat-delta',
    direction && `hds-stat-delta--${direction}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={cls} {...props} />;
}

export { Stat, StatValue, StatLabel, StatDelta };
export type { StatProps, StatValueProps, StatLabelProps, StatDeltaProps };
