import * as React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'draft' | 'submitted' | 'review' | 'approved' | 'rejected' | 'completed' | 'changes' | 'evaluation';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50',
          {
            'border-transparent bg-primary text-white': variant === 'default',
            'border-transparent bg-gray-100 text-gray-700': variant === 'draft',
            'border-transparent bg-blue-100 text-blue-700': variant === 'submitted',
            'border-transparent bg-yellow-100 text-yellow-800': variant === 'review',
            'border-transparent bg-green-100 text-green-700': variant === 'approved',
            'border-transparent bg-red-100 text-red-700': variant === 'rejected',
            'border-transparent bg-purple-100 text-purple-700': variant === 'completed',
            'border-transparent bg-orange-100 text-orange-800': variant === 'changes',
            'border-transparent bg-indigo-100 text-indigo-700': variant === 'evaluation',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
