import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full px-4 py-3 font-body text-base bg-white border-3 border-black transition-colors',
          'placeholder:text-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100',
          error && 'border-coral focus:ring-coral',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
