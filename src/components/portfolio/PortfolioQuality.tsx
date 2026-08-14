import React from 'react';
import { Card, SectionHeader } from '../ui';
import type { PortfolioQuality as PortfolioQualityData } from '../../utils/portfolio';

interface PortfolioQualityProps {
  quality: PortfolioQualityData;
}

export const PortfolioQuality: React.FC<
  PortfolioQualityProps
> = ({ quality }) => {
  const isEmpty = quality.totalAssets === 0;
  const hasAllocation = quality.largestHolding !== null;

  const concentrationLabel =
    quality.concentration === null
      ? '—'
      : quality.concentration === 'very-high'
        ? 'Very High'
        : quality.concentration.charAt(0).toUpperCase() +
          quality.concentration.slice(1);

  return (
    <Card>
      <SectionHeader
        title="Portfolio Quality"
        description="Portfolio completeness and concentration snapshot."
      />

      {isEmpty ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-text-primary">
            No portfolio assets yet.
          </p>

          <p className="mt-1 text-xs text-text-muted">
            Add an asset to start analyzing portfolio quality.
          </p>
        </div>
      ) : !hasAllocation ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-text-primary">
            Allocation data unavailable.
          </p>

          <p className="mt-1 text-xs text-text-muted">
            Add a positive portfolio value to analyze concentration.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Assets
            </p>
            <p className="mt-2 text-lg font-semibold text-text-primary">
              {quality.totalAssets}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Metrics Complete
            </p>
            <p className="mt-2 text-lg font-semibold text-text-primary">
              {quality.assetsWithCompleteMetrics}/{quality.totalAssets}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Largest Holding
            </p>
            <p className="mt-2 truncate text-lg font-semibold text-text-primary">
              {quality.largestHolding?.name ?? '—'}
            </p>
            <p className="mt-1 text-xs tabular-nums text-text-muted">
              {quality.largestAllocation.toFixed(1)}%
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Concentration
            </p>
            <p className="mt-2 text-lg font-semibold text-text-primary">
              {concentrationLabel}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
