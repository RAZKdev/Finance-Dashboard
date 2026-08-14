import React from 'react';
import { Button } from '../ui';
import type { PortfolioAsset } from '../../types/finance';
import {
  calculatePortfolioMetrics,
  getPortfolioValue,
} from '../../utils/portfolio';

interface PortfolioListProps {
  assets: PortfolioAsset[];
  onEdit?: (asset: PortfolioAsset) => void;
  onDelete?: (assetId: string) => void;
}

export const PortfolioList: React.FC<PortfolioListProps> = ({
  assets,
  onEdit,
  onDelete,
}) => {
  const total = assets.reduce(
    (sum, asset) => sum + getPortfolioValue(asset),
    0
  );

  if (assets.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-medium text-text-primary">
          No portfolio assets yet.
        </p>

        <p className="mt-1 text-xs text-text-muted">
          Add an asset to start tracking portfolio value and P/L.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assets.map((asset) => {
        const portfolioValue = getPortfolioValue(asset);
        const percentage =
          total > 0 ? (portfolioValue / total) * 100 : 0;
        const metrics = calculatePortfolioMetrics(asset);

        return (
          <div
            key={asset.id}
            className="flex flex-col gap-3 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{asset.name}</p>
              <p className="text-xs text-text-muted">
                {percentage.toFixed(1)}%
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
              <div className="min-w-0 text-right">
                <p className="text-sm font-semibold tabular-nums">
                  Rp {portfolioValue.toLocaleString('id-ID')}
                </p>

                {metrics.profitLoss !== null &&
                  metrics.profitLossPercent !== null ? (
                    <p
                      className={`text-xs font-medium tabular-nums ${
                        metrics.profitLoss >= 0
                          ? 'text-positive'
                          : 'text-negative'
                      }`}
                    >
                      {metrics.profitLoss >= 0 ? '+' : '-'}Rp{' '}
                      {Math.abs(metrics.profitLoss).toLocaleString('id-ID')}{' '}
                      ({metrics.profitLoss >= 0 ? '+' : ''}
                      {metrics.profitLossPercent.toFixed(2)}%)
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted">
                      P/L unavailable
                    </p>
                  )}
              </div>

              {onEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(asset)}
                  aria-label={`Edit ${asset.name}`}
                >
                  Edit
                </Button>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const confirmed = window.confirm(
                      `Delete portfolio asset "${asset.name}"?`
                    );

                    if (confirmed) {
                      onDelete(asset.id);
                    }
                  }}
                  aria-label={`Delete ${asset.name}`}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
