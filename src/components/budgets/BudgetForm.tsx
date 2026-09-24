import React, { useState } from 'react';
import { Button, Input } from '../ui';
import type { Budget } from '../../types/finance';
import { isValidMonthFormat } from '../../utils/budgets';

interface BudgetFormProps {
  onSubmit: (budget: Budget) => void;
  onCancel: () => void;
  initialData?: Budget | null;
  existingCategories?: string[];
  defaultMonth?: string;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  existingCategories = [],
  defaultMonth,
}) => {
  const currentMonthStr =
    defaultMonth || new Date().toISOString().slice(0, 7);

  const [category, setCategory] = useState(
    initialData?.category ?? ''
  );
  const [limit, setLimit] = useState(
    initialData ? String(initialData.limit) : ''
  );
  const [month, setMonth] = useState(
    initialData?.month ?? currentMonthStr
  );
  const [error, setError] = useState('');

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedCategory = category.trim();
    const numericLimit = Number(limit);

    if (!trimmedCategory) {
      setError('Category is required.');
      return;
    }

    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
      setError('Budget limit must be a number greater than 0.');
      return;
    }

    if (!isValidMonthFormat(month)) {
      setError('Month must be in YYYY-MM format.');
      return;
    }

    const budget: Budget = {
      id: initialData?.id ?? `budget-${Date.now()}`,
      category: trimmedCategory,
      limit: numericLimit,
      month,
      createdAt:
        initialData?.createdAt ?? new Date().toISOString(),
    };

    setError('');
    onSubmit(budget);
  };

  const isEditing = Boolean(initialData);

  // Deduplicate and filter categories for suggestion
  const uniqueCategories = Array.from(
    new Set(
      existingCategories.map((c) => c.trim()).filter(Boolean)
    )
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Category"
        placeholder="e.g. Food, Transportation, Utilities"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        list="budget-categories-list"
      />
      {uniqueCategories.length > 0 && (
        <datalist id="budget-categories-list">
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      )}

      <Input
        label="Monthly Limit (IDR)"
        type="number"
        step="any"
        min="1"
        placeholder="e.g. 2500000"
        value={limit}
        onChange={(event) => setLimit(event.target.value)}
      />

      <label className="block space-y-1.5">
        <span className="block text-xs font-medium uppercase tracking-wider text-text-secondary">
          Target Month
        </span>
        <input
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
        />
      </label>

      {error && (
        <p className="text-sm font-medium text-negative">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button type="submit">
          {isEditing ? 'Save Changes' : 'Add Budget'}
        </Button>
      </div>
    </form>
  );
};
