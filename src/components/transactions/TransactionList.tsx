import React from 'react';
import { Badge } from '../ui';
import type { Transaction } from '../../types/finance';

interface TransactionListProps {
  transactions: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">
              {transaction.title}
            </p>

            <p className="text-xs text-text-muted">
              {transaction.category} · {transaction.date}
            </p>
          </div>

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
        </div>
      ))}
    </div>
  );
};
