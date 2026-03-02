import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/* ─── Variant / Size Types ─── */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'tertiary';
type ButtonSize = 'tiny' | 'xs' | 'sm' | 'lg';

/* ─── Button ─── */

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, block, className, ...props }, ref) => {
    const cls = [
      'hds-btn',
      variant && `hds-btn--${variant}`,
      size && `hds-btn--${size}`,
      block && 'hds-btn--block',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <button ref={ref} className={cls} {...props} />;
  },
);
Button.displayName = 'Button';

/* ─── ButtonIcon ─── */

interface ButtonIconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  label: string;
  children: ReactNode;
}

const ButtonIcon = forwardRef<HTMLButtonElement, ButtonIconProps>(
  ({ variant, size, label, className, ...props }, ref) => {
    const cls = [
      'hds-btn-icon',
      variant && `hds-btn-icon--${variant}`,
      size && `hds-btn-icon--${size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <button ref={ref} className={cls} aria-label={label} {...props} />;
  },
);
ButtonIcon.displayName = 'ButtonIcon';

/* ─── ButtonGroup ─── */

interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
}

function ButtonGroup({ children, className }: ButtonGroupProps) {
  const cls = ['hds-btn-group', className].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}

export { Button, ButtonIcon, ButtonGroup };
export type { ButtonProps, ButtonIconProps, ButtonGroupProps };
