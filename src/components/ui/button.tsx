import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-display font-bold uppercase tracking-wide border-3 border-black transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary:
          'bg-cyan text-black shadow-brutal hover:shadow-brutal-md hover:-translate-y-0.5 active:shadow-brutal-sm active:translate-y-0.5 disabled:hover:shadow-brutal disabled:hover:translate-y-0',
        secondary:
          'bg-coral text-white shadow-brutal hover:shadow-brutal-md hover:-translate-y-0.5 active:shadow-brutal-sm active:translate-y-0.5 disabled:hover:shadow-brutal disabled:hover:translate-y-0',
        accent:
          'bg-lime text-black shadow-brutal hover:shadow-brutal-md hover:-translate-y-0.5 active:shadow-brutal-sm active:translate-y-0.5 disabled:hover:shadow-brutal disabled:hover:translate-y-0',
        outline:
          'bg-white text-black shadow-brutal hover:bg-black hover:text-white hover:shadow-brutal-md hover:-translate-y-0.5 active:shadow-brutal-sm active:translate-y-0.5',
        ghost:
          'bg-transparent text-black border-transparent shadow-none hover:bg-gray-100',
        link:
          'bg-transparent text-black border-transparent shadow-none underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-14 px-8 text-base',
        xl: 'h-16 px-10 text-lg',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
