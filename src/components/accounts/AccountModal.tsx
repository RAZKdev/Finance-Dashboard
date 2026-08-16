import React, { useEffect } from 'react';
import { Button, Card } from '../ui';
import { AccountForm } from './AccountForm';
import type { Account } from '../../types/finance';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (account: Account) => void;
  initialData?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isEditing = Boolean(initialData);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2
              id="account-modal-title"
              className="text-lg font-semibold"
            >
              {isEditing
                ? 'Edit Account'
                : 'Add Account'}
            </h2>

            <p className="text-sm text-text-muted">
              {isEditing
                ? 'Update your financial account.'
                : 'Add an account to track your balance.'}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close account modal"
          >
            ✕
          </Button>
        </div>

        <AccountForm
          key={initialData?.id ?? 'new'}
          onSubmit={onSubmit}
          onCancel={onClose}
          initialData={initialData}
        />
      </Card>
    </div>
  );
};
