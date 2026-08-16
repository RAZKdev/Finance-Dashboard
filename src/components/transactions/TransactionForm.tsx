import React, { useState } from 'react';
import { Button, Input } from '../ui';
import type {
  Account,
  Transaction,
  TransactionType,
} from '../../types/finance';

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
  onCancel?: () => void;
  initialData?: Transaction | null;
  accounts: Account[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  accounts,
}) => {
  const [type, setType] = useState<TransactionType>(
    initialData?.type ?? 'expense'
  );
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(
    initialData ? String(initialData.amount) : ''
  );
  const [category, setCategory] = useState(initialData?.category ?? '');

  const [accountId, setAccountId] = useState(
    initialData?.accountId ??
      accounts[0]?.id ??
      ''
  );

  const [date, setDate] = useState(
    initialData?.date ?? new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    if (!category.trim()) {
      setError('Category is required.');
      return;
    }

    if (!date) {
      setError('Date is required.');
      return;
    }

    if (
      accountId.trim() &&
      !accounts.some(
        (account) => account.id === accountId.trim()
      )
    ) {
      setError('Selected account no longer exists.');
      return;
    }

    const transaction: Transaction = {
      id: initialData?.id ?? `tx-${Date.now()}`,
      title: title.trim(),
      amount: numericAmount,
      type,
      category: category.trim(),
      date,
      ...(accountId.trim()
        ? { accountId: accountId.trim() }
        : {}),
    };

    onSubmit(transaction);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant={type === 'expense' ? 'primary' : 'secondary'}
          onClick={() => setType('expense')}
        >
          Expense
        </Button>

        <Button
          type="button"
          variant={type === 'income' ? 'primary' : 'secondary'}
          onClick={() => setType('income')}
        >
          Income
        </Button>
      </div>

      <Input
        label="Title"
        placeholder="e.g. Salary, Food, Internet"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <Input
        label="Amount"
        type="number"
        min="1"
        placeholder="0"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />

      <Input
        label="Category"
        placeholder="e.g. Food, Salary, Investment"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      />

      <label className="block space-y-1.5">
        <span className="block text-xs font-medium uppercase tracking-wider text-text-secondary">
          Account
        </span>

        <select
          value={accountId}
          onChange={(event) =>
            setAccountId(event.target.value)
          }
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
        >
          <option value="">
            No account
          </option>

          {accounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
            >
              {account.name} · {account.currency}
            </option>
          ))}
        </select>

        <p className="text-xs text-text-muted">
          Link this transaction to a financial account.
        </p>
      </label>

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />

      {error && (
        <p className="text-sm font-medium text-negative">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}

        <Button type="submit">
          {initialData ? 'Save Changes' : 'Add Transaction'}
        </Button>
      </div>
    </form>
  );
};
