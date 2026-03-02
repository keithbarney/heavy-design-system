import {
  type ReactNode,
  type HTMLAttributes,
  type InputHTMLAttributes,
  forwardRef,
} from 'react';

/* ─── Chip ─── */

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  active?: boolean;
  onRemove?: () => void;
}

function Chip({ active, onRemove, children, className, ...props }: ChipProps) {
  const cls = [
    'hds-chip',
    active && 'hds-chip--active',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={cls} {...props}>
      {children}
      {onRemove && (
        <button
          type="button"
          className="hds-chip-remove"
          onClick={onRemove}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}

/* ─── ChipInput ─── */

interface ChipInputProps {
  children: ReactNode;
  size?: 'sm';
  disabled?: boolean;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

const ChipInput = forwardRef<HTMLInputElement, ChipInputProps>(
  ({ children, size, disabled, className, inputProps }, ref) => {
    const cls = [
      'hds-chip-input',
      size && `hds-chip-input--${size}`,
      disabled && 'hds-chip-input--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={cls}>
        {children}
        <input
          ref={ref}
          className="hds-chip-input-field"
          disabled={disabled}
          {...inputProps}
        />
      </div>
    );
  },
);
ChipInput.displayName = 'ChipInput';

export { Chip, ChipInput };
export type { ChipProps, ChipInputProps };
