import React from 'react';
import { Button } from '../ui';
import type { Account, Transaction } from '../../types/finance';
import { calculateAccountBalanceSummary } from '../../utils/accounts';

interface AccountListProps {
  accounts: Account[];
  transactions?: Transaction[];
  onEdit?: (account: Account) => void;
  onDelete?: (accountId: string) => void;
}

export const AccountList: React.FC<AccountListProps> = ({
  accounts,
  transactions = [],
  onEdit,
  onDelete,
}) => {
  if (accounts.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-medium text-text-primary">
          No accounts yet.
        </p>

        <p className="mt-1 text-xs text-text-muted">
          Add an account to start tracking your financial balances.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => {
        const summary =
          calculateAccountBalanceSummary(account, transactions);

        return (
          <div
            key={account.id}
            className="flex flex-col gap-3 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {account.name}
              </p>

              <p className="text-xs text-text-muted">
                {account.type} · {account.currency}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">
                  {account.currency}{' '}
                  {summary.currentBalance.toLocaleString('id-ID')}
                </p>

                <p className="text-xs text-text-muted">
                  {summary.netChange !== 0
                    ? `${summary.netChange > 0 ? '+' : ''}${account.currency} ${summary.netChange.toLocaleString('id-ID')} activity`
                    : 'Current balance'}
                </p>
              </div>

              {onEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(account)}
                  aria-label={`Edit ${account.name}`}
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
                      `Delete account "${account.name}"?`
                    );

                    if (confirmed) {
                      onDelete(account.id);
                    }
                  }}
                  aria-label={`Delete ${account.name}`}
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
