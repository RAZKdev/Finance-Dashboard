import React from 'react';
import { cn } from '../../utils/cn';

export interface SectionHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader = React.forwardRef<
  HTMLDivElement,
  SectionHeaderProps
>(({ className, title, description, action, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start justify-between gap-4 mb-5',
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-text-primary">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-text-muted">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';
