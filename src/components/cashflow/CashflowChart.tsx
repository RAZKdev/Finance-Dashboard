import React from 'react';
import { Card, SectionHeader, Badge } from '../ui';
import type { MonthlyCashflow } from '../../utils/cashflow';

interface CashflowChartProps {
  months: MonthlyCashflow[];
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
}

const formatCurrency = (val: number) =>
  `Rp ${Math.abs(val).toLocaleString('id-ID')}`;

const formatShortCurrency = (val: number) => {
  const abs = Math.abs(val);
  if (abs >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${(val / 1_000).toFixed(0)}K`;
  }
  return String(val);
};

export const CashflowChart: React.FC<CashflowChartProps> = ({
  months,
  selectedMonth,
  onSelectMonth,
}) => {
  const maxValue = Math.max(
    ...months.map((m) => Math.max(m.inflow, m.outflow)),
    1_000_000
  );

  const hasData = months.some((m) => m.inflow > 0 || m.outflow > 0);

  return (
    <Card>
      <SectionHeader
        title="Monthly Cashflow Comparison"
        description="Side-by-side monthly inflow (income) versus outflow (expenses)."
      />

      <div className="flex items-center gap-4 text-xs font-medium text-text-muted pb-4 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-positive inline-block" />
          <span>Inflow (Income)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-negative inline-block" />
          <span>Outflow (Expense)</span>
        </div>
      </div>

      {!hasData ? (
        <div className="py-12 text-center">
          <p className="text-sm font-medium text-text-primary">
            No cashflow activity recorded in this period.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Add income and expense transactions to view cashflow trends.
          </p>
        </div>
      ) : (
        <div className="pt-6">
          {/* Scrollable Container on Mobile */}
          <div className="overflow-x-auto pb-4">
            <div className="flex min-w-[500px] items-end justify-between gap-4 h-64 border-b border-border/60 pb-3 px-2">
              {months.map((m) => {
                const isSelected = selectedMonth === m.month;
                const inflowHeightPercent = (m.inflow / maxValue) * 100;
                const outflowHeightPercent = (m.outflow / maxValue) * 100;

                return (
                  <div
                    key={m.month}
                    onClick={() => onSelectMonth?.(m.month)}
                    className={`group flex flex-1 flex-col items-center justify-end h-full cursor-pointer rounded-lg p-2 transition-all ${
                      isSelected
                        ? 'bg-surface-elevated/70 ring-1 ring-premium'
                        : 'hover:bg-surface-elevated/30'
                    }`}
                    title={`${m.monthLabel}\nInflow: ${formatCurrency(m.inflow)}\nOutflow: ${formatCurrency(m.outflow)}\nNet: ${m.net >= 0 ? '+' : '-'}${formatCurrency(m.net)}`}
                  >
                    {/* Columns container */}
                    <div className="flex items-end gap-1.5 h-44 w-full justify-center">
                      {/* Inflow Bar */}
                      <div className="flex flex-col items-center justify-end h-full w-4 sm:w-6">
                        <span className="text-[10px] tabular-nums text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {m.inflow > 0 ? formatShortCurrency(m.inflow) : ''}
                        </span>
                        <div
                          className="w-full rounded-t-sm bg-positive transition-all duration-300"
                          style={{
                            height: `${Math.max(inflowHeightPercent, m.inflow > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>

                      {/* Outflow Bar */}
                      <div className="flex flex-col items-center justify-end h-full w-4 sm:w-6">
                        <span className="text-[10px] tabular-nums text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                          {m.outflow > 0 ? formatShortCurrency(m.outflow) : ''}
                        </span>
                        <div
                          className="w-full rounded-t-sm bg-negative transition-all duration-300"
                          style={{
                            height: `${Math.max(outflowHeightPercent, m.outflow > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Month Label */}
                    <p className="mt-3 text-xs font-semibold text-text-primary">
                      {m.monthLabel.split(' ')[0]}
                    </p>

                    {/* Net Badge */}
                    <div className="mt-1">
                      {m.inflow === 0 && m.outflow === 0 ? (
                        <span className="text-[11px] text-text-muted">-</span>
                      ) : (
                        <Badge
                          variant={m.net >= 0 ? 'positive' : 'negative'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {m.net >= 0 ? '+' : '-'}
                          {formatShortCurrency(m.net)}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
