import { type SVGAttributes } from 'react';

type IconSize = 'xsm' | 'sm' | 'md' | 'lg';

interface IconProps extends SVGAttributes<SVGSVGElement> {
  size?: IconSize;
}

function Icon({ size, className, ...props }: IconProps) {
  const cls = [
    'hds-icon',
    size && `hds-icon--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <svg className={cls} aria-hidden="true" {...props} />;
}

export { Icon };
export type { IconProps };
