import React from 'react';
import { StatCard } from '../ui';
import type { PortfolioAnalytics as PortfolioAnalyticsData } from '../../utils/portfolio';

interface PortfolioAnalyticsProps {
  analytics: PortfolioAnalyticsData;
}

const formatCurrency = (value: number) =>
  `Rp ${value.toLocaleString('id-ID')}`;

export const PortfolioAnalytics: React.FC<
  PortfolioAnalyticsProps
> = ({ analytics }) => {
  const {
    totalCostBasis,
    totalMarketValue,
    totalProfitLoss,
    totalProfitLossPercent,
    completeMetrics,
    assetsWithMetrics,
    assetsWithoutMetrics,
    bestPerformer,
    worstPerformer,
  } = analytics;

  const isEmpty = analytics.totalAssets === 0;
  const hasProfitLoss = totalProfitLoss !== null;
  const hasProfitLossPercent =
    totalProfitLossPercent !== null;

  const profitLossValue = hasProfitLoss
    ? `${totalProfitLoss >= 0 ? '+' : '-'}Rp ${Math.abs(
        totalProfitLoss
      ).toLocaleString('id-ID')}`
    : '—';

  const profitLossPercentValue = hasProfitLossPercent
    ? `${totalProfitLossPercent >= 0 ? '+' : ''}${totalProfitLossPercent.toFixed(
        2
      )}%`
    : '—';

  const profitLossTrend =
    totalProfitLoss === null
      ? 'neutral'
      : totalProfitLoss >= 0
        ? 'up'
        : 'down';

  const performerValue = (
    performer: typeof bestPerformer
  ) => {
    if (!performer) {
      return '—';
    }

    return performer.name;
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Cost Basis"
          value={
            completeMetrics
              ? formatCurrency(totalCostBasis)
              : '—'
          }
          change={
            isEmpty
              ? 'No portfolio assets'
              : completeMetrics
                ? 'Total invested cost'
                : 'Incomplete metrics'
          }
          trend="neutral"
        />

        <StatCard
          label="Market Value"
          value={
            completeMetrics
              ? formatCurrency(totalMarketValue)
              : '—'
          }
          change={
            isEmpty
              ? 'No portfolio assets'
              : completeMetrics
                ? 'Current portfolio value'
                : 'Incomplete metrics'
          }
          trend="neutral"
        />

        <StatCard
          label="Total P/L"
          value={profitLossValue}
          change={
            isEmpty
              ? 'No portfolio assets'
              : hasProfitLoss
                ? 'Across all assets'
                : 'Incomplete metrics'
          }
          trend={profitLossTrend}
        />

        <StatCard
          label="P/L %"
          value={profitLossPercentValue}
          change={
            isEmpty
              ? 'No portfolio assets'
              : hasProfitLossPercent
                ? 'Portfolio return'
                : 'Incomplete metrics'
          }
          trend={profitLossTrend}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Performance
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-text-muted">
                  Best Performer
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {isEmpty
                    ? 'No assets yet'
                    : performerValue(bestPerformer)}
                </p>
              </div>

              <div>
                <p className="text-xs text-text-muted">
                  Worst Performer
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  {isEmpty
                    ? 'No assets yet'
                    : performerValue(worstPerformer)}
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <p
              className={`text-xs font-medium ${
                isEmpty || !completeMetrics
                  ? 'text-text-muted'
                  : 'text-positive'
              }`}
            >
              {isEmpty
                ? 'Portfolio is empty'
                : completeMetrics
                  ? 'All portfolio metrics available'
                  : `${assetsWithMetrics}/${analytics.totalAssets} assets with complete metrics`}
            </p>

            {isEmpty ? (
              <p className="mt-1 text-xs text-text-muted">
                Add a portfolio asset to start tracking analytics.
              </p>
            ) : (
              !completeMetrics &&
              assetsWithoutMetrics > 0 && (
                <p className="mt-1 text-xs text-text-muted">
                  Add quantity, average buy price, and current
                  price to complete analytics.
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
