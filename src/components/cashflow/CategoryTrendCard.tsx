import React from 'react';
import { Card, SectionHeader, Badge } from '../ui';
import type { CategoryExpense } from '../../utils/cashflow';
import { formatMonthLabel, getPreviousMonth } from '../../utils/cashflow';

interface CategoryTrendCardProps {
  categoryExpenses: CategoryExpense[];
  selectedMonth: string;
}

const formatCurrency = (val: number) =>
  `Rp ${val.toLocaleString('id-ID')}`;

export const CategoryTrendCard: React.FC<CategoryTrendCardProps> = ({
  categoryExpenses,
  selectedMonth,
}) => {
  const currentMonthLabel = formatMonthLabel(selectedMonth);
  const prevMonthLabel = formatMonthLabel(getPreviousMonth(selectedMonth));

  const totalExpense = categoryExpenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  return (
    <Card>
      <SectionHeader
        title={`Category Expense Trend (${currentMonthLabel})`}
        description={`Spending breakdown by category and comparison against ${prevMonthLabel}.`}
      />

      {categoryExpenses.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-text-primary">
            No expenses recorded for {currentMonthLabel}.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Add expense transactions to see spending distribution across categories.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Total Expenses
            </span>
            <span className="text-sm font-bold tabular-nums text-text-primary">
              {formatCurrency(totalExpense)}
            </span>
          </div>

          <div className="space-y-4">
            {categoryExpenses.map((item) => {
              const hasPrev = item.previousMonthAmount !== undefined;
              const momChange = item.monthOverMonthChange ?? 0;
              const momPercent = item.monthOverMonthPercent;

              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {item.category}
                      </span>
                      <span className="text-xs text-text-muted">
                        ({item.transactionCount}{' '}
                        {item.transactionCount === 1 ? 'tx' : 'txs'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      {hasPrev ? (
                        momChange === 0 ? (
                          <Badge variant="default" className="text-[10px]">
                            0% vs last mo.
                          </Badge>
                        ) : momChange > 0 ? (
                          <Badge variant="negative" className="text-[10px]">
                            +{momPercent !== undefined ? `${momPercent.toFixed(1)}%` : formatCurrency(momChange)} vs last mo.
                          </Badge>
                        ) : (
                          <Badge variant="positive" className="text-[10px]">
                            {momPercent !== undefined ? `${momPercent.toFixed(1)}%` : `-${formatCurrency(Math.abs(momChange))}`} vs last mo.
                          </Badge>
                        )
                      ) : (
                        <Badge variant="default" className="text-[10px]">
                          New category
                        </Badge>
                      )}

                      <span className="text-sm font-semibold tabular-nums text-text-primary">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="text-xs font-medium text-text-muted tabular-nums">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div
                    className="h-2 overflow-hidden rounded-full bg-background"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${Math.min(item.percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
