import React from 'react';
import type { PortfolioAsset } from '../../types/finance';

interface PortfolioListProps {
  assets: PortfolioAsset[];
}

export const PortfolioList: React.FC<PortfolioListProps> = ({ assets }) => {
  const total = assets.reduce((sum, asset) => sum + asset.value, 0);

  if (assets.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        No portfolio assets found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assets.map((asset) => {
        const percentage = total > 0 ? (asset.value / total) * 100 : 0;

        return (
          <div
            key={asset.id}
            className="flex items-center justify-between border-b border-border pb-3 last:border-0"
          >
            <div>
              <p className="text-sm font-medium">{asset.name}</p>
              <p className="text-xs text-text-muted">
                {percentage.toFixed(1)}%
              </p>
            </div>

            <p className="text-sm font-semibold tabular-nums">
              Rp {asset.value.toLocaleString('id-ID')}
            </p>
          </div>
        );
      })}
    </div>
  );
};
