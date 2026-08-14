import React from 'react';
import { Card, SectionHeader } from '../ui';
import type { PortfolioAllocation as PortfolioAllocationData } from '../../utils/portfolio';

interface PortfolioAllocationProps {
  allocation: PortfolioAllocationData;
  isEmpty: boolean;
}

const formatCurrency = (value: number) =>
  `Rp ${value.toLocaleString('id-ID')}`;

export const PortfolioAllocation: React.FC<
  PortfolioAllocationProps
> = ({ allocation, isEmpty }) => {
  const {
    totalValue,
    items,
    complete,
  } = allocation;

  return (
    <Card>
      <SectionHeader
        title="Portfolio Allocation"
        description="Current portfolio weight by asset."
      />

      {isEmpty ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-text-primary">
            No portfolio assets yet.
          </p>

          <p className="mt-1 text-xs text-text-muted">
            Add a portfolio asset with a positive value to see allocation.
          </p>
        </div>
      ) : !complete ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-text-primary">
            Allocation metrics are incomplete.
          </p>

          <p className="mt-1 text-xs text-text-muted">
            Complete the asset value data to calculate portfolio allocation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Total Value
            </span>

            <span className="text-sm font-semibold tabular-nums text-text-primary">
              {formatCurrency(totalValue)}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.asset.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.asset.name}
                    </p>

                    <p className="text-xs text-text-muted">
                      {formatCurrency(item.value)}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>

                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-background"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(item.percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
