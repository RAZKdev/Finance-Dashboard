import React from 'react';
import { Card, SectionHeader, Button, Badge } from '../ui';
import type { Transaction } from '../../types/finance';
import { calculateMonthlyCashflow, formatMonthLabel } from '../../utils/cashflow';

interface CashflowMiniCardProps {
  transactions: Transaction[];
  currentMonth: string;
  onNavigateToCashflow?: () => void;
}

const formatCurrency = (val: number) =>
  `Rp ${Math.abs(val).toLocaleString('id-ID')}`;

export const CashflowMiniCard: React.FC<CashflowMiniCardProps> = ({
  transactions,
  currentMonth,
  onNavigateToCashflow,
}) => {
  const current = calculateMonthlyCashflow(transactions, currentMonth);
  const monthName = formatMonthLabel(currentMonth);

  return (
    <Card>
      <SectionHeader
        title="Monthly Cashflow Summary"
        description={`Inflow vs outflow snapshot for ${monthName}.`}
        action={
          onNavigateToCashflow && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToCashflow}
            >
              Detailed Trends
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
        <div className="rounded-lg bg-surface-elevated/40 p-3 border border-border/50">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Inflow
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-positive">
            +{formatCurrency(current.inflow)}
          </p>
        </div>

        <div className="rounded-lg bg-surface-elevated/40 p-3 border border-border/50">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Outflow
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-negative">
            -{formatCurrency(current.outflow)}
          </p>
        </div>

        <div className="rounded-lg bg-surface-elevated/40 p-3 border border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Net Savings
            </p>
            {current.inflow > 0 && (
              <Badge
                variant={current.savingsRate >= 0 ? 'positive' : 'negative'}
                className="text-[10px] px-1 py-0"
              >
                {current.savingsRate.toFixed(0)}% rate
              </Badge>
            )}
          </div>
          <p
            className={`mt-1 text-lg font-bold tabular-nums ${
              current.net >= 0 ? 'text-positive' : 'text-negative'
            }`}
          >
            {current.net >= 0 ? '+' : '-'}
            {formatCurrency(current.net)}
          </p>
        </div>
      </div>
    </Card>
  );
};
