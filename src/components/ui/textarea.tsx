import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full px-4 py-3 font-body text-base bg-white border-3 border-black transition-colors resize-none',
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
Textarea.displayName = 'Textarea'

export { Textarea }
