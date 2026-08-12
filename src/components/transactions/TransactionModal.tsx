import React from 'react';
import { Button, Card } from '../ui';
import { TransactionForm } from './TransactionForm';
import type { Transaction } from '../../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => void;
  initialData?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="transaction-modal-title"
    >
      <Card className="w-full max-w-md">
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
          onSubmit={onSubmit}
          onCancel={onClose}
          initialData={initialData}
        />
      </Card>
    </div>
  );
};
