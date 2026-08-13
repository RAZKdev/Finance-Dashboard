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
  const [symbol, setSymbol] = useState(initialData?.symbol ?? '');
  const [assetType, setAssetType] = useState<
    NonNullable<PortfolioAsset['assetType']>
  >(initialData?.assetType ?? 'cash');
  const [quantity, setQuantity] = useState(
    initialData?.quantity !== undefined
      ? String(initialData.quantity)
      : ''
  );
  const [averageBuyPrice, setAverageBuyPrice] = useState(
    initialData?.averageBuyPrice !== undefined
      ? String(initialData.averageBuyPrice)
      : ''
  );
  const [currentPrice, setCurrentPrice] = useState(
    initialData?.currentPrice !== undefined
      ? String(initialData.currentPrice)
      : ''
  );
  const [currency, setCurrency] = useState(
    initialData?.currency ?? 'IDR'
  );
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericValue = Number(value);
    const numericQuantity = quantity ? Number(quantity) : undefined;
    const numericAverageBuyPrice = averageBuyPrice
      ? Number(averageBuyPrice)
      : undefined;
    const numericCurrentPrice = currentPrice
      ? Number(currentPrice)
      : undefined;

    if (!name.trim()) {
      setError('Asset name is required.');
      return;
    }

    if (!numericValue || numericValue <= 0) {
      setError('Value must be greater than 0.');
      return;
    }

    if (
      numericQuantity !== undefined &&
      (!Number.isFinite(numericQuantity) || numericQuantity <= 0)
    ) {
      setError('Quantity must be greater than 0.');
      return;
    }

    if (
      numericAverageBuyPrice !== undefined &&
      (!Number.isFinite(numericAverageBuyPrice) ||
        numericAverageBuyPrice <= 0)
    ) {
      setError('Average buy price must be greater than 0.');
      return;
    }

    if (
      numericCurrentPrice !== undefined &&
      (!Number.isFinite(numericCurrentPrice) ||
        numericCurrentPrice <= 0)
    ) {
      setError('Current price must be greater than 0.');
      return;
    }

    if (
      numericQuantity !== undefined &&
      numericAverageBuyPrice === undefined
    ) {
      setError('Average buy price is required when quantity is set.');
      return;
    }

    const asset: PortfolioAsset = {
      id: initialData?.id ?? `asset-${Date.now()}`,
      name: name.trim(),
      value: numericValue,
      symbol: symbol.trim() || undefined,
      assetType,
      quantity: numericQuantity,
      averageBuyPrice: numericAverageBuyPrice,
      currentPrice: numericCurrentPrice,
      currency: currency.trim() || 'IDR',
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

      <Input
        label="Symbol"
        placeholder="e.g. BBCA, BTC, ETH"
        value={symbol}
        onChange={(event) => setSymbol(event.target.value)}
      />

      <label className="block space-y-1.5">
        <span className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
          Asset Type
        </span>

        <select
          value={assetType}
          onChange={(event) =>
            setAssetType(
              event.target.value as NonNullable<
                PortfolioAsset['assetType']
              >
            )
          }
          className="w-full bg-surface text-text-primary px-3.5 py-2.5 rounded-lg border border-border text-sm"
        >
          <option value="stock">Stock</option>
          <option value="crypto">Crypto</option>
          <option value="forex">Forex</option>
          <option value="cash">Cash</option>
        </select>
      </label>

      <Input
        label="Quantity"
        type="number"
        min="0"
        step="any"
        placeholder="Optional"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
      />

      <Input
        label="Average Buy Price"
        type="number"
        min="0"
        step="any"
        placeholder="Optional"
        value={averageBuyPrice}
        onChange={(event) => setAverageBuyPrice(event.target.value)}
      />

      <Input
        label="Current Price"
        type="number"
        min="0"
        step="any"
        placeholder="Optional"
        value={currentPrice}
        onChange={(event) => setCurrentPrice(event.target.value)}
      />

      <Input
        label="Currency"
        placeholder="IDR"
        value={currency}
        onChange={(event) => setCurrency(event.target.value)}
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
