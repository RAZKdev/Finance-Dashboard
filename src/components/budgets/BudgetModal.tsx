import React, { useEffect } from 'react';
import { Button, Card } from '../ui';
import { BudgetForm } from './BudgetForm';
import type { Budget } from '../../types/finance';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (budget: Budget) => void;
  initialData?: Budget | null;
  existingCategories?: string[];
  defaultMonth?: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingCategories,
  defaultMonth,
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

  const isEditing = Boolean(initialData);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2
              id="budget-modal-title"
              className="text-lg font-semibold"
            >
              {isEditing ? 'Edit Budget' : 'Add Monthly Budget'}
            </h2>

            <p className="text-sm text-text-muted">
              {isEditing
                ? 'Update your category spending limit.'
                : 'Set a spending target for a category.'}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close budget modal"
          >
            ✕
          </Button>
        </div>

        <BudgetForm
          key={initialData?.id ?? 'new'}
          onSubmit={onSubmit}
          onCancel={onClose}
          initialData={initialData}
          existingCategories={existingCategories}
          defaultMonth={defaultMonth}
        />
      </Card>
    </div>
  );
};
