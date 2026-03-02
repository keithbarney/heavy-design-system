import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, success, className, ...props }, ref) => {
    const cls = [
      'hds-form-textarea',
      error && 'hds-form-input--error',
      success && 'hds-form-input--success',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return <textarea ref={ref} className={cls} {...props} />;
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };
