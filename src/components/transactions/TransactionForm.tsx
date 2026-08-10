import React, { useState } from 'react';
import { Button, Input } from '../ui';
import type { Transaction, TransactionType } from '../../types/finance';

interface TransactionFormProps {
  onSubmit: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
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
      id: `tx-${Date.now()}`,
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
          Add Transaction
        </Button>
      </div>
    </form>
  );
};
