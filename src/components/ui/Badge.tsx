import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'premium';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-surface-elevated text-text-secondary border border-border',
      positive: 'bg-positive/10 text-positive border border-positive/20',
      negative: 'bg-negative/10 text-negative border border-negative/20',
      warning: 'bg-warning/10 text-warning border border-warning/20',
      premium: 'bg-premium/10 text-premium border border-premium/20',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tabular-nums',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
