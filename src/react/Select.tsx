import { type ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';

/* ─── Select ─── */

type SelectSize = 'xs' | 'sm' | 'lg';

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  size?: SelectSize;
  children: ReactNode;
  className?: string;
}

function Select({ size, placeholder, children, className, ...props }: SelectProps) {
  const triggerCls = [
    'hds-select',
    size && `hds-select--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <RadixSelect.Root {...props}>
      <RadixSelect.Trigger className={triggerCls}>
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content className="hds-select-content" position="popper" sideOffset={4}>
          <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

/* ─── SelectItem ─── */

interface SelectItemProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

function SelectItem({ children, className, ...props }: SelectItemProps) {
  const cls = ['hds-select-item', className].filter(Boolean).join(' ');

  return (
    <RadixSelect.Item className={cls} {...props}>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}

/* ─── SelectGroup ─── */

interface SelectGroupProps {
  label: string;
  children: ReactNode;
}

function SelectGroup({ label, children }: SelectGroupProps) {
  return (
    <RadixSelect.Group>
      <RadixSelect.Label className="hds-select-label">{label}</RadixSelect.Label>
      {children}
    </RadixSelect.Group>
  );
}

export { Select, SelectItem, SelectGroup };
export type { SelectProps, SelectItemProps, SelectGroupProps };
