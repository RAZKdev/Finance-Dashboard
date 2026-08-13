import React from 'react';
import type { MarketAsset } from '../../data/markets';

interface MarketListProps {
  assets: MarketAsset[];
}

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

export const MarketList: React.FC<MarketListProps> = ({
  assets,
}) => {
  if (assets.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        No market data available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assets.map((asset) => {
        const isPositive = asset.changePercent >= 0;

        return (
          <div
            key={asset.id}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0"
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

            <div className="text-right">
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
          </div>
        );
      })}
    </div>
  );
};
