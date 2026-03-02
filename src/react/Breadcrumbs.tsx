import { type ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
}

function Breadcrumbs({ items, separator = '/', className }: BreadcrumbsProps) {
  const cls = ['hds-breadcrumbs', className].filter(Boolean).join(' ');

  return (
    <nav className={cls} aria-label="Breadcrumb">
      <ol>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <li key={i}>
              {i > 0 && (
                <span className="hds-breadcrumbs-separator" aria-hidden="true">
                  {separator}
                </span>
              )}
              {isLast ? (
                <span className="hds-breadcrumbs-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumbs };
export type { BreadcrumbsProps, BreadcrumbItem };
