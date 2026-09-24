import React from 'react';
import type { Transaction } from '../../types/finance';
import { calculateCashflowAnalytics } from '../../utils/cashflow';
import { CashflowStatsCards } from './CashflowStatsCards';
import { CashflowChart } from './CashflowChart';
import { CategoryTrendCard } from './CategoryTrendCard';

interface CashflowViewProps {
  transactions: Transaction[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const CashflowView: React.FC<CashflowViewProps> = ({
  transactions,
  selectedMonth,
  onMonthChange,
}) => {
  const analytics = calculateCashflowAnalytics(
    transactions,
    selectedMonth,
    6
  );

  return (
    <div className="space-y-6">
      {/* Month Filter Selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Cashflow Trends & Analysis
          </h2>
          <p className="text-xs text-text-muted">
            Tracking monthly inflow, outflow, and category shifts across a 6-month window.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="cashflow-month-input"
            className="text-xs font-medium uppercase tracking-wider text-text-muted"
          >
            Target Month:
          </label>
          <input
            id="cashflow-month-input"
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <CashflowStatsCards analytics={analytics} />

      {/* Dual Column Cashflow Comparison Chart */}
      <CashflowChart
        months={analytics.months}
        selectedMonth={selectedMonth}
        onSelectMonth={onMonthChange}
      />

      {/* Category Expense Trend */}
      <CategoryTrendCard
        categoryExpenses={analytics.categoryExpenses}
        selectedMonth={selectedMonth}
      />
    </div>
  );
};
