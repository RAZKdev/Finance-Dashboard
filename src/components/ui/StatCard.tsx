import React from 'react';
import { cn } from '../../utils/cn';

export interface StatCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

export const StatCard = React.forwardRef<
  HTMLDivElement,
  StatCardProps
>(
  (
    {
      className,
      label,
      value,
      change,
      trend = 'neutral',
      icon,
      ...props
    },
    ref
  ) => {
    const trendStyles = {
      up: 'text-positive',
      down: 'text-negative',
      neutral: 'text-text-muted',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl p-5 bg-surface border border-border',
          'transition-colors hover:border-text-muted',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-text-primary tabular-nums truncate">
              {value}
            </p>

            {change && (
              <p className={cn(
                'mt-2 text-sm font-medium tabular-nums',
                trendStyles[trend]
              )}>
                {change}
              </p>
            )}
          </div>

          {icon && (
            <div className="shrink-0 text-text-secondary">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

StatCard.displayName = 'StatCard';
