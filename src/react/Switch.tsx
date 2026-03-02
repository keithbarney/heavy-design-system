import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, ...props }, ref) => {
    const cls = ['hds-form-toggle', className].filter(Boolean).join(' ');

    return (
      <label className={cls}>
        <input ref={ref} type="checkbox" role="switch" {...props} />
        <span className="hds-form-toggle-track" />
        {label && <span>{label}</span>}
      </label>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };
export type { SwitchProps };
