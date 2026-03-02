import { type ReactNode } from 'react';
import * as RadixCheckbox from '@radix-ui/react-checkbox';

interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  label?: ReactNode;
  className?: string;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IndeterminateIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Checkbox({ label, className, ...props }: CheckboxProps) {
  const cls = ['hds-form-check', className].filter(Boolean).join(' ');

  return (
    <label className={cls}>
      <RadixCheckbox.Root className="hds-form-check-input" {...props}>
        <RadixCheckbox.Indicator>
          {props.checked === 'indeterminate' ? <IndeterminateIcon /> : <CheckIcon />}
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && <span>{label}</span>}
    </label>
  );
}

export { Checkbox };
export type { CheckboxProps };
