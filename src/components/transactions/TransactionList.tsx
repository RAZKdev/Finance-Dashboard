import React from 'react';
import { Badge, Button } from '../ui';
import type { Account, Transaction } from '../../types/finance';

interface TransactionListProps {
  transactions: Transaction[];
  accounts?: Account[];
  onDelete?: (transactionId: string) => void;
  onEdit?: (transaction: Transaction) => void;
  emptyMessage?: string;
  emptyDescription?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  accounts,
  onDelete,
  onEdit,
  emptyMessage = 'No transactions found.',
  emptyDescription,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-medium text-text-primary">
          {emptyMessage}
        </p>

        {emptyDescription && (
          <p className="mt-1 text-xs text-text-muted">
            {emptyDescription}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const account = accounts?.find(
          (acc) => acc.id === transaction.accountId
        );

        return (
          <div
            key={transaction.id}
            className="flex flex-col gap-3 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {transaction.title}
              </p>

              <p className="text-xs text-text-muted">
                {transaction.category} · {transaction.date}
                {account ? ` · ${account.name}` : ''}
              </p>
            </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge
              variant={
                transaction.type === 'income'
                  ? 'positive'
                  : 'negative'
              }
            >
              {transaction.type === 'income' ? '+ ' : '- '}
              Rp {transaction.amount.toLocaleString('id-ID')}
            </Badge>

            {onEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onEdit(transaction)}
                aria-label={`Edit ${transaction.title}`}
              >
                Edit
              </Button>
            )}

            {onDelete && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => {
                  const confirmed = window.confirm(
                    `Delete transaction "${transaction.title}"?`
                  );

                  if (confirmed) {
                    onDelete(transaction.id);
                  }
                }}
                aria-label={`Delete ${transaction.title}`}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      );
    })}
    </div>
  );
};
