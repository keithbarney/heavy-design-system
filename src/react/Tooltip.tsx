import { type ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

/* ─── TooltipProvider ─── */

interface TooltipProviderProps {
  children: ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

function TooltipProvider({ delayDuration = 200, ...props }: TooltipProviderProps) {
  return <RadixTooltip.Provider delayDuration={delayDuration} {...props} />;
}

/* ─── Tooltip ─── */

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

function Tooltip({ content, children, side = 'top', align = 'center' }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="hds-tooltip" side={side} align={align} sideOffset={4}>
          {content}
          <RadixTooltip.Arrow className="hds-tooltip-arrow" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export { Tooltip, TooltipProvider };
export type { TooltipProps, TooltipProviderProps };
