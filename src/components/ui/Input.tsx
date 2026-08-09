import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={cn(error && errorId, helperText && descriptionId)}
          className={cn(
            'w-full bg-surface text-text-primary placeholder:text-text-muted px-3.5 py-2.5 rounded-lg border border-border text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-focus focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-negative focus:ring-negative',
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p id={descriptionId} className="text-xs text-text-muted">
            {helperText}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-negative font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
