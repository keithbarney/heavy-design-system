import { type ReactNode } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';

/* ─── RadioGroup ─── */

interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

function Radio({ className, ...props }: RadioGroupProps) {
  return <RadioGroup.Root className={className} {...props} />;
}

/* ─── RadioItem ─── */

interface RadioItemProps {
  value: string;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}

function RadioItem({ value, label, disabled, className }: RadioItemProps) {
  const cls = ['hds-form-check', className].filter(Boolean).join(' ');

  return (
    <label className={cls}>
      <RadioGroup.Item className="hds-form-check-input" value={value} disabled={disabled}>
        <RadioGroup.Indicator />
      </RadioGroup.Item>
      {label && <span>{label}</span>}
    </label>
  );
}

export { Radio, RadioItem };
export type { RadioGroupProps, RadioItemProps };
