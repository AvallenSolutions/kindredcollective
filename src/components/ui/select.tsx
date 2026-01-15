'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'flex h-11 w-full appearance-none px-4 py-3 pr-10 font-body text-base bg-white border-3 border-black transition-colors cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100',
            error && 'border-coral focus:ring-coral',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
