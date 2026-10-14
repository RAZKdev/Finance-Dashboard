import React, { useEffect } from 'react';
import { Button, Card } from '../ui';
import { TransactionForm } from './TransactionForm';
import type {
  Account,
  Transaction,
} from '../../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => void;
  initialData?: Transaction | null;
  accounts: Account[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  accounts,
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
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md my-auto max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2
              id="transaction-modal-title"
              className="text-lg font-semibold"
            >
              {initialData ? 'Edit Transaction' : 'Add Transaction'}
            </h2>

            <p className="text-sm text-text-muted">
              {initialData
                ? 'Update the transaction details.'
                : 'Record a new income or expense.'}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close transaction modal"
          >
            ✕
          </Button>
        </div>

        <TransactionForm
          key={initialData?.id ?? 'new'}
          onSubmit={onSubmit}
          onCancel={onClose}
          initialData={initialData}
          accounts={accounts}
        />
      </Card>
    </div>
  );
};
