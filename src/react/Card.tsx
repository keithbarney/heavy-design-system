import { type ReactNode, type HTMLAttributes } from 'react';

/* ─── Card ─── */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

function Card({ interactive, className, ...props }: CardProps) {
  const cls = [
    'hds-card',
    interactive && 'hds-card--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={cls} {...props} />;
}

/* ─── CardHeader ─── */

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  const cls = ['hds-card-header', className].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <div className="hds-card-header-text">
        <h3 className="hds-card-title">{title}</h3>
        {subtitle && <p className="hds-card-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="hds-card-header-actions">{actions}</div>}
    </div>
  );
}

/* ─── CardBody ─── */

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

function CardBody({ className, ...props }: CardBodyProps) {
  const cls = ['hds-card-body', className].filter(Boolean).join(' ');
  return <div className={cls} {...props} />;
}

/* ─── CardFooter ─── */

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

function CardFooter({ className, ...props }: CardFooterProps) {
  const cls = ['hds-card-footer', className].filter(Boolean).join(' ');
  return <div className={cls} {...props} />;
}

export { Card, CardHeader, CardBody, CardFooter };
export type { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps };
