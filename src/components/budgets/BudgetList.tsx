import React from 'react';
import { Badge, Button, Card } from '../ui';
import type { Budget, Transaction } from '../../types/finance';
import {
  calculateMonthlyBudgetSummary,
} from '../../utils/budgets';

interface BudgetListProps {
  budgets: Budget[];
  transactions: Transaction[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
  onAdd?: () => void;
}

const formatCurrency = (val: number) =>
  `Rp ${Math.abs(val).toLocaleString('id-ID')}`;

export const BudgetList: React.FC<BudgetListProps> = ({
  budgets,
  transactions,
  selectedMonth,
  onMonthChange,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const summary = calculateMonthlyBudgetSummary(
    budgets,
    transactions,
    selectedMonth
  );

  return (
    <div className="space-y-6">
      {/* Month Selector & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor="budget-month-picker"
            className="text-xs font-medium uppercase tracking-wider text-text-muted"
          >
            Month:
          </label>
          <input
            id="budget-month-picker"
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
          />
        </div>

        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            + Add Budget
          </Button>
        )}
      </div>

      {/* Aggregate Realization Summary Cards */}
      {summary.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Total Budget
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
              {formatCurrency(summary.totalBudget)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {summary.items.length} {summary.items.length === 1 ? 'category' : 'categories'} budgeted
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Realized Spent
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-text-primary">
              {formatCurrency(summary.totalSpent)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {summary.overallPercentage.toFixed(1)}% of total budget
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {summary.totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
            </p>
            <p
              className={`mt-1 text-xl font-bold tabular-nums ${
                summary.totalRemaining >= 0
                  ? 'text-positive'
                  : 'text-negative'
              }`}
            >
              {summary.totalRemaining < 0 && '- '}
              {formatCurrency(summary.totalRemaining)}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {summary.totalRemaining >= 0
                ? 'Available to spend'
                : 'Deficit across categories'}
            </p>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Budget Health
            </p>
            <div className="mt-1 flex items-center gap-2">
              {summary.overBudgetCount > 0 ? (
                <Badge variant="negative">
                  {summary.overBudgetCount} Over Limit
                </Badge>
              ) : (
                <Badge variant="positive">All on Track</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {summary.overBudgetCount > 0
                ? 'Requires attention'
                : 'Spending within limits'}
            </p>
          </Card>
        </div>
      )}

      {/* Categories Realization List */}
      {summary.items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-text-primary">
            No budgets defined for {selectedMonth}.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Create monthly budget limits by category to monitor your realization.
          </p>
          {onAdd && (
            <div className="mt-4">
              <Button size="sm" onClick={onAdd}>
                + Set Budget for {selectedMonth}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {summary.items.map((item) => {
            const { budget, spent, remaining, percentage, status } = item;
            const isOver = status === 'exceeded';
            const isWarning = status === 'warning';

            const badgeVariant = isOver
              ? 'negative'
              : isWarning
                ? 'warning'
                : 'positive';

            const badgeLabel = isOver
              ? 'Over Budget'
              : isWarning
                ? 'Near Limit'
                : 'On Track';

            const progressColor = isOver
              ? 'bg-negative'
              : isWarning
                ? 'bg-warning'
                : 'bg-positive';

            return (
              <div
                key={budget.id}
                className="rounded-xl border border-border bg-surface p-4 transition-colors"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-text-primary">
                        {budget.category}
                      </h3>
                      <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                    </div>

                    <p className="mt-1 text-xs text-text-muted">
                      Target: {formatCurrency(budget.limit)} · Spent:{' '}
                      {formatCurrency(spent)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold tabular-nums text-text-primary">
                        {percentage.toFixed(1)}%
                      </p>
                      <p
                        className={`text-xs tabular-nums ${
                          isOver ? 'text-negative font-medium' : 'text-text-muted'
                        }`}
                      >
                        {isOver
                          ? `Over by ${formatCurrency(Math.abs(remaining))}`
                          : `Remaining: ${formatCurrency(remaining)}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(budget)}
                          aria-label={`Edit ${budget.category} budget`}
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
                              `Delete budget for "${budget.category}"?`
                            );
                            if (confirmed) {
                              onDelete(budget.id);
                            }
                          }}
                          aria-label={`Delete ${budget.category} budget`}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-background"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
