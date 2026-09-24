import React from 'react';
import { Badge, Button, Card, SectionHeader } from '../ui';
import type { Budget, Transaction } from '../../types/finance';
import { calculateMonthlyBudgetSummary } from '../../utils/budgets';

interface BudgetOverviewCardProps {
  budgets: Budget[];
  transactions: Transaction[];
  currentMonth: string;
  onNavigateToBudgets?: () => void;
}

const formatCurrency = (val: number) =>
  `Rp ${Math.abs(val).toLocaleString('id-ID')}`;

export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({
  budgets,
  transactions,
  currentMonth,
  onNavigateToBudgets,
}) => {
  const summary = calculateMonthlyBudgetSummary(
    budgets,
    transactions,
    currentMonth
  );

  return (
    <Card>
      <SectionHeader
        title="Monthly Budget Realization"
        description={`Spending limits vs actual expenses for ${currentMonth}.`}
        action={
          onNavigateToBudgets && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToBudgets}
            >
              View All Budgets
            </Button>
          )
        }
      />

      {summary.items.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm font-medium text-text-primary">
            No budgets configured for {currentMonth}.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Set category limits to track budget realization on your dashboard.
          </p>
          {onNavigateToBudgets && (
            <div className="mt-3">
              <Button size="sm" onClick={onNavigateToBudgets}>
                Set Monthly Budget
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Total Realization
              </p>
              <p className="mt-1 text-lg font-bold tabular-nums text-text-primary">
                {formatCurrency(summary.totalSpent)}{' '}
                <span className="text-xs font-normal text-text-muted">
                  / {formatCurrency(summary.totalBudget)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {summary.overBudgetCount > 0 ? (
                <Badge variant="negative">
                  {summary.overBudgetCount} Over Limit
                </Badge>
              ) : (
                <Badge variant="positive">All on Track</Badge>
              )}
              <span className="text-sm font-semibold tabular-nums text-text-primary">
                {summary.overallPercentage.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Top 3 categories preview */}
          <div className="space-y-3">
            {summary.items.slice(0, 3).map((item) => {
              const isOver = item.status === 'exceeded';
              const isWarning = item.status === 'warning';
              const progressColor = isOver
                ? 'bg-negative'
                : isWarning
                  ? 'bg-warning'
                  : 'bg-positive';

              return (
                <div key={item.budget.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text-primary truncate">
                      {item.budget.category}
                    </span>
                    <span className="tabular-nums text-text-muted">
                      {formatCurrency(item.spent)} / {formatCurrency(item.budget.limit)} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>

                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
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
