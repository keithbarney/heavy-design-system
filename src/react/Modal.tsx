import { type ReactNode } from 'react';
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

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

function ModalBody({ children, className }: ModalBodyProps) {
  const cls = ['hds-modal-body', className].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}

/* ─── ModalFooter ─── */

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

function ModalFooter({ children, className }: ModalFooterProps) {
  const cls = ['hds-modal-footer', className].filter(Boolean).join(' ');
  return <div className={cls}>{children}</div>;
}

/* ─── ModalClose ─── */

const ModalClose = Dialog.Close;

export { Modal, ModalHeader, ModalBody, ModalFooter, ModalClose };
export type { ModalProps, ModalHeaderProps, ModalBodyProps, ModalFooterProps };
