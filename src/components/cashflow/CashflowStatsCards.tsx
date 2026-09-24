import React from 'react';
import { Card } from '../ui';
import type { CashflowAnalytics } from '../../utils/cashflow';

interface CashflowStatsCardsProps {
  analytics: CashflowAnalytics;
}

const formatCurrency = (val: number) =>
  `Rp ${Math.abs(val).toLocaleString('id-ID')}`;

export const CashflowStatsCards: React.FC<CashflowStatsCardsProps> = ({
  analytics,
}) => {
  const {
    totalInflow,
    totalOutflow,
    netCashflow,
    overallSavingsRate,
    averageMonthlyNet,
    bestMonth,
  } = analytics;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Inflow */}
      <Card className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Period Inflow
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-positive">
          +{formatCurrency(totalInflow)}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Avg {formatCurrency(analytics.averageMonthlyInflow)}/mo
        </p>
      </Card>

      {/* Total Outflow */}
      <Card className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Period Outflow
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-negative">
          -{formatCurrency(totalOutflow)}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Avg {formatCurrency(analytics.averageMonthlyOutflow)}/mo
        </p>
      </Card>

      {/* Net Cashflow */}
      <Card className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Net Cashflow
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            netCashflow >= 0 ? 'text-positive' : 'text-negative'
          }`}
        >
          {netCashflow >= 0 ? '+' : '-'}
          {formatCurrency(netCashflow)}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Avg net {netCashflow >= 0 ? '+' : '-'}
          {formatCurrency(averageMonthlyNet)}/mo
        </p>
      </Card>

      {/* Savings Rate */}
      <Card className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
          Savings Rate
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            overallSavingsRate >= 0 ? 'text-positive' : 'text-negative'
          }`}
        >
          {overallSavingsRate.toFixed(1)}%
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {bestMonth
            ? `Best: ${bestMonth.monthLabel} (+${formatCurrency(bestMonth.net)})`
            : 'Track savings efficiency'}
        </p>
      </Card>
    </div>
  );
};
