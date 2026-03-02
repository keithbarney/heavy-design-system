import { forwardRef, type AnchorHTMLAttributes } from 'react';

type LinkSize = 'xs' | 'sm' | 'lg';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  size?: LinkSize;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ size, className, ...props }, ref) => {
    const cls = [
      'hds-link',
      size && `hds-link--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <a ref={ref} className={cls} {...props} />;
  },
);
Link.displayName = 'Link';

export { Link };
export type { LinkProps };
