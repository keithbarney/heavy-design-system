import { forwardRef, type InputHTMLAttributes } from 'react';

type InputSize = 'xs' | 'sm' | 'lg';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  error?: boolean;
  success?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize, error, success, className, ...props }, ref) => {
    const cls = [
      'hds-form-input',
      inputSize && `hds-form-input--${inputSize}`,
      error && 'hds-form-input--error',
      success && 'hds-form-input--success',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <input ref={ref} className={cls} {...props} />;
  },
);
Input.displayName = 'Input';

export { Input };
export type { InputProps };
