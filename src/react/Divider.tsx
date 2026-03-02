import { type HTMLAttributes } from 'react';

interface DividerProps extends HTMLAttributes<HTMLHRElement> {}

function Divider({ className, ...props }: DividerProps) {
  const cls = ['hds-divider', className].filter(Boolean).join(' ');
  return <hr className={cls} {...props} />;
}

export { Divider };
export type { DividerProps };
