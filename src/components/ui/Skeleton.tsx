import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading..."
        className={cn('animate-pulse bg-surface-elevated rounded-md', className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
