import { type HTMLAttributes, type ReactNode } from 'react';

type ListItemSize = 'sm' | 'lg';

interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value?: ReactNode;
  interactive?: boolean;
  size?: ListItemSize;
}

function ListItem({ label, value, interactive, size, className, ...props }: ListItemProps) {
  const cls = [
    'hds-list-item',
    interactive && 'hds-list-item--interactive',
    size && `hds-list-item--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      <span className="hds-list-item-key">{label}</span>
      {value !== undefined && <span className="hds-list-item-value">{value}</span>}
    </div>
  );
}

export { ListItem };
export type { ListItemProps };
