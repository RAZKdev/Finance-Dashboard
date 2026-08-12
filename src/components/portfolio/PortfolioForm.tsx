import React, { useState } from 'react';
import { Button, Input } from '../ui';
import type { PortfolioAsset } from '../../types/finance';

interface PortfolioFormProps {
  onSubmit: (asset: PortfolioAsset) => void;
  onCancel: () => void;
  initialData?: PortfolioAsset | null;
}

export const PortfolioForm: React.FC<PortfolioFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [value, setValue] = useState(
    initialData ? String(initialData.value) : ''
  );
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericValue = Number(value);

    if (!name.trim()) {
      setError('Asset name is required.');
      return;
    }

    if (!numericValue || numericValue <= 0) {
      setError('Value must be greater than 0.');
      return;
    }

    const asset: PortfolioAsset = {
      id: initialData?.id ?? `asset-${Date.now()}`,
      name: name.trim(),
      value: numericValue,
    };

    onSubmit(asset);
  };

  const isEditing = Boolean(initialData);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Asset Name"
        placeholder="e.g. Stocks, Crypto, Cash"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <Input
        label="Value"
        type="number"
        min="1"
        placeholder="0"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      {error && (
        <p className="text-sm font-medium text-negative">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>

        <Button type="submit">
          {isEditing ? 'Save Changes' : 'Add Asset'}
        </Button>
      </div>
    </form>
  );
};
