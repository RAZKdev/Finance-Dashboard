import React, { useState } from 'react';
import { Button, Input } from '../ui';
import type { Transaction, TransactionType } from '../../types/finance';

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
  onCancel?: () => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [type, setType] = useState<TransactionType>(
    initialData?.type ?? 'expense'
  );
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [amount, setAmount] = useState(
    initialData ? String(initialData.amount) : ''
  );
  const [category, setCategory] = useState(initialData?.category ?? '');
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

    const transaction: Transaction = {
      id: initialData?.id ?? `tx-${Date.now()}`,
      title: title.trim(),
      amount: numericAmount,
      type,
      category: category.trim(),
      date,
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
