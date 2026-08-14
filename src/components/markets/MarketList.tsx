import React from 'react';
import type { MarketAsset } from '../../data/markets';

interface MarketListProps {
  assets: MarketAsset[];
}

type MarketFilter = 'all' | MarketAsset['type'];

const formatPrice = (asset: MarketAsset) => {
  if (asset.currency === 'IDR') {
    return `Rp ${asset.price.toLocaleString('id-ID')}`;
  }

  return `${asset.currency} ${asset.price.toLocaleString('en-US', {
    maximumFractionDigits: 4,
  })}`;
};

const typeLabel: Record<MarketAsset['type'], string> = {
  stock: 'Stock',
  crypto: 'Crypto',
  forex: 'Forex',
};

const typeDescription: Record<MarketAsset['type'], string> = {
  stock: 'Stock market asset',
  crypto: 'Cryptocurrency asset',
  forex: 'Foreign exchange asset',
};

const MarketDetail: React.FC<{
  asset: MarketAsset;
  onBack: () => void;
}> = ({ asset, onBack }) => {
  const isPositive = asset.changePercent >= 0;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
      >
        <span aria-hidden="true">←</span>
        Back to markets
      </button>

      <div className="rounded-xl border border-border bg-surface/50 p-4 sm:p-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-text-primary">
                  {asset.symbol}
                </h2>

                <span className="rounded-md bg-background px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                  {typeLabel[asset.type]}
                </span>
              </div>

              <p className="mt-1 text-sm text-text-muted">
                {asset.name}
              </p>
            </div>

            <div
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                isPositive
                  ? 'bg-positive/10 text-positive'
                  : 'bg-negative/10 text-negative'
              }`}
            >
              {isPositive ? 'Positive' : 'Negative'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Price</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
                {formatPrice(asset)}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs text-text-muted">Change</p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  isPositive ? 'text-positive' : 'text-negative'
                }`}
              >
                {isPositive ? '+' : ''}
                {asset.changePercent.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4 sm:col-span-2">
              <p className="text-xs text-text-muted">Asset Type</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {typeDescription[asset.type]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MarketList: React.FC<MarketListProps> = ({
  assets,
}) => {
  const [filter, setFilter] = React.useState<MarketFilter>('all');
  const [selectedAsset, setSelectedAsset] =
    React.useState<MarketAsset | null>(null);

  const filteredAssets =
    filter === 'all'
      ? assets
      : assets.filter((asset) => asset.type === filter);

  const filters: Array<{ value: MarketFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'stock', label: 'Stocks' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'forex', label: 'Forex' },
  ];

  if (assets.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        No market data available.
      </div>
    );
  }

  if (selectedAsset) {
    return (
      <MarketDetail
        asset={selectedAsset}
        onBack={() => setSelectedAsset(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Market filters"
      >
        {filters.map((item) => {
          const isActive = filter === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-muted hover:text-text-primary'
              }`}
              aria-pressed={isActive}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {filteredAssets.length === 0 ? (
        <div className="py-6 text-center text-sm text-text-muted">
          No assets found for this filter.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAssets.map((asset) => {
            const isPositive = asset.changePercent >= 0;

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedAsset(asset)}
                className="flex w-full items-center justify-between gap-4 rounded-lg border-b border-border pb-3 pt-1 text-left transition-colors hover:bg-surface/60 focus:outline-none focus:ring-2 focus:ring-primary/40 last:border-0"
                aria-label={`View details for ${asset.symbol}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      {asset.symbol}
                    </p>

                    <span className="rounded-md bg-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                      {typeLabel[asset.type]}
                    </span>
                  </div>

                  <p className="truncate text-xs text-text-muted">
                    {asset.name}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatPrice(asset)}
                  </p>

                  <p
                    className={`text-xs font-medium tabular-nums ${
                      isPositive
                        ? 'text-positive'
                        : 'text-negative'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {asset.changePercent.toFixed(2)}%
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
