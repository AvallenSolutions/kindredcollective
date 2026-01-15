import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center px-3 py-1 font-display text-xs font-bold uppercase tracking-wider border-2 border-black',
  {
    variants: {
      variant: {
        default: 'bg-white text-black',
        cyan: 'bg-cyan text-black',
        coral: 'bg-coral text-white',
        lime: 'bg-lime text-black',
        blue: 'bg-blue-500 text-white',
        outline: 'bg-transparent text-black',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
