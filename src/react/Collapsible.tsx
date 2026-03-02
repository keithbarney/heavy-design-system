import { type ReactNode } from 'react';
import * as RadixCollapsible from '@radix-ui/react-collapsible';

/* ─── Collapsible ─── */

interface CollapsibleProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

function Collapsible({ className, ...props }: CollapsibleProps) {
  const cls = ['hds-collapsible', className].filter(Boolean).join(' ');
  return <RadixCollapsible.Root className={cls} {...props} />;
}

/* ─── CollapsibleTrigger ─── */

interface CollapsibleTriggerProps {
  children: ReactNode;
  className?: string;
}

function CollapsibleTrigger({ ...props }: CollapsibleTriggerProps) {
  return <RadixCollapsible.Trigger asChild {...props} />;
}

/* ─── CollapsibleContent ─── */

interface CollapsibleContentProps {
  children: ReactNode;
  className?: string;
}

function CollapsibleContent({ ...props }: CollapsibleContentProps) {
  return <RadixCollapsible.Content {...props} />;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps };
