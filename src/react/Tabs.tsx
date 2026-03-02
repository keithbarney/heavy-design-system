import { type ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

/* ─── Tabs ─── */

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

function Tabs({ className, ...props }: TabsProps) {
  return <RadixTabs.Root className={className} {...props} />;
}

/* ─── TabList ─── */

interface TabListProps {
  children: ReactNode;
  className?: string;
}

function TabList({ className, ...props }: TabListProps) {
  const cls = ['hds-tabs', className].filter(Boolean).join(' ');
  return <RadixTabs.List className={cls} {...props} />;
}

/* ─── Tab ─── */

interface TabProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function Tab({ className, ...props }: TabProps) {
  const cls = ['hds-tab', className].filter(Boolean).join(' ');
  return <RadixTabs.Trigger className={cls} {...props} />;
}

/* ─── TabPanel ─── */

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

function TabPanel({ className, ...props }: TabPanelProps) {
  return <RadixTabs.Content className={className} {...props} />;
}

export { Tabs, TabList, Tab, TabPanel };
export type { TabsProps, TabListProps, TabProps, TabPanelProps };
