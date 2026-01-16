import * as React from 'react'
import { cn } from '@/lib/utils'

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'font-display text-sm font-bold uppercase tracking-wide text-black',
      className
    )}
    {...props}
  />
))
Label.displayName = 'Label'

export { Label }
