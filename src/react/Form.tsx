import { type HTMLAttributes, type LabelHTMLAttributes, type ReactNode } from 'react';

/* ─── FormGroup ─── */

interface FormGroupProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm';
}

function FormGroup({ size, className, ...props }: FormGroupProps) {
  const cls = [
    'hds-form-group',
    size && `hds-form-group--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={cls} {...props} />;
}

/* ─── FormLabel ─── */

interface FormLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

function FormLabel({ required, className, ...props }: FormLabelProps) {
  const cls = [
    'hds-form-label',
    required && 'hds-form-label--required',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <label className={cls} {...props} />;
}

/* ─── FormHint ─── */

type HintVariant = 'error' | 'success';

interface FormHintProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: HintVariant;
}

function FormHint({ variant, className, ...props }: FormHintProps) {
  const cls = [
    'hds-form-hint',
    variant && `hds-form-hint--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={cls} {...props} />;
}

/* ─── FormError ─── */

interface FormErrorProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

function FormError({ className, ...props }: FormErrorProps) {
  const cls = ['hds-form-error', className].filter(Boolean).join(' ');
  return <span className={cls} role="alert" {...props} />;
}

export { FormGroup, FormLabel, FormHint, FormError };
export type { FormGroupProps, FormLabelProps, FormHintProps, FormErrorProps };
