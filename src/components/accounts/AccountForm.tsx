import React, { useState } from 'react';
import { Button, Input } from '../ui';
import type {
  Account,
  AccountType,
} from '../../types/finance';

interface AccountFormProps {
  onSubmit: (account: Account) => void;
  onCancel: () => void;
  initialData?: Account | null;
}

const ACCOUNT_TYPES: AccountType[] = [
  'cash',
  'bank',
  'ewallet',
  'other',
];

export const AccountForm: React.FC<AccountFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [name, setName] = useState(
    initialData?.name ?? ''
  );

  const [type, setType] = useState<AccountType>(
    initialData?.type ?? 'cash'
  );

  const [openingBalance, setOpeningBalance] = useState(
    initialData
      ? String(initialData.openingBalance)
      : ''
  );

  const [currency, setCurrency] = useState(
    initialData?.currency ?? 'IDR'
  );

  const [error, setError] = useState('');

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedCurrency = currency.trim();
    const numericOpeningBalance = Number(
      openingBalance
    );

    if (!trimmedName) {
      setError('Account name is required.');
      return;
    }

    if (!Number.isFinite(numericOpeningBalance)) {
      setError(
        'Opening balance must be a finite number.'
      );
      return;
    }

    if (!trimmedCurrency) {
      setError('Currency is required.');
      return;
    }

    const account: Account = {
      id:
        initialData?.id ??
        `account-${Date.now()}`,
      name: trimmedName,
      type,
      openingBalance: numericOpeningBalance,
      currency: trimmedCurrency.toUpperCase(),
      createdAt:
        initialData?.createdAt ??
        new Date().toISOString(),
    };

    setError('');
    onSubmit(account);
  };

  const isEditing = Boolean(initialData);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        label="Account Name"
        placeholder="e.g. BCA, Cash, GoPay"
        value={name}
        onChange={(event) =>
          setName(event.target.value)
        }
      />

      <label className="block space-y-1.5">
        <span className="block text-xs font-medium uppercase tracking-wider text-text-secondary">
          Account Type
        </span>

        <select
          value={type}
          onChange={(event) =>
            setType(
              event.target.value as AccountType
            )
          }
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {ACCOUNT_TYPES.map((accountType) => (
            <option
              key={accountType}
              value={accountType}
            >
              {accountType === 'ewallet'
                ? 'E-Wallet'
                : accountType.charAt(0).toUpperCase() +
                  accountType.slice(1)}
            </option>
          ))}
        </select>
      </label>

      <Input
        label="Opening Balance"
        type="number"
        step="any"
        placeholder="0"
        value={openingBalance}
        onChange={(event) =>
          setOpeningBalance(event.target.value)
        }
      />

      <Input
        label="Currency"
        placeholder="IDR"
        value={currency}
        onChange={(event) =>
          setCurrency(event.target.value)
        }
      />

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
          {isEditing
            ? 'Save Changes'
            : 'Add Account'}
        </Button>
      </div>
    </form>
  );
};
