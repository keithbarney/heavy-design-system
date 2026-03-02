import { forwardRef, type AnchorHTMLAttributes } from 'react';

interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ active, className, ...props }, ref) => {
    const cls = [
      'hds-nav-link',
      active && 'hds-nav-link--active',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <a ref={ref} className={cls} aria-current={active ? 'page' : undefined} {...props} />;
  },
);
NavLink.displayName = 'NavLink';

export { NavLink };
export type { NavLinkProps };
