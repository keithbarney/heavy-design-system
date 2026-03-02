import { type ReactNode } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  label?: ReactNode;
  className?: string;
}

function Switch({ label, className, ...props }: SwitchProps) {
  const cls = ['hds-form-toggle', className].filter(Boolean).join(' ');

  return (
    <label className={cls}>
      <RadixSwitch.Root className="hds-form-toggle-root" {...props}>
        <RadixSwitch.Thumb className="hds-form-toggle-track" />
      </RadixSwitch.Root>
      {label && <span>{label}</span>}
    </label>
  );
}

export { Switch };
export type { SwitchProps };
