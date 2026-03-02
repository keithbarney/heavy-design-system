import { type ReactNode, type HTMLAttributes } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

/* ─── Modal ─── */

interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: ReactNode;
  children: ReactNode;
}

function Modal({ open, onOpenChange, trigger, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="hds-modal-backdrop" />
        <Dialog.Content className="hds-modal">{children}</Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─── ModalHeader ─── */

interface ModalHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

function ModalHeader({ title, description, actions }: ModalHeaderProps) {
  return (
    <div className="hds-modal-header">
      <div className="hds-modal-header-text">
        <Dialog.Title asChild>
          <h3>{title}</h3>
        </Dialog.Title>
        {description && (
          <Dialog.Description asChild>
            <p>{description}</p>
          </Dialog.Description>
        )}
      </div>
      <div className="hds-modal-header-actions">
        {actions}
        <Dialog.Close asChild>
          <button className="hds-btn-icon" aria-label="Close">×</button>
        </Dialog.Close>
      </div>
    </div>
  );
}

/* ─── ModalBody ─── */

interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {}

function ModalBody({ className, ...props }: ModalBodyProps) {
  const cls = ['hds-modal-body', className].filter(Boolean).join(' ');
  return <div className={cls} {...props} />;
}

/* ─── ModalFooter ─── */

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {}

function ModalFooter({ className, ...props }: ModalFooterProps) {
  const cls = ['hds-modal-footer', className].filter(Boolean).join(' ');
  return <div className={cls} {...props} />;
}

/* ─── ModalClose ─── */

interface ModalCloseProps {
  children: ReactNode;
}

function ModalClose({ children }: ModalCloseProps) {
  return <Dialog.Close asChild>{children}</Dialog.Close>;
}

export { Modal, ModalHeader, ModalBody, ModalFooter, ModalClose };
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps, ModalCloseProps };
