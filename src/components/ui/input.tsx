import type { ComponentProps } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

export const inputVariants = cva(
  [
    'h-8 w-full min-w-0 rounded-control border border-line bg-canvas px-3 py-1 text-xs text-foreground outline-none transition-[border-color,box-shadow]',
    'file:mr-2 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:p-0 file:text-xs file:font-medium file:text-foreground',
    'placeholder:text-muted-foreground/70 focus-visible:border-accent-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-55',
  ],
  {
    variants: {
      variant: {
        // No chrome: for a field inside a container that draws the focus ring.
        bare: 'border-0 bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0',
      },
      size: {
        lg: 'h-10 px-3.5',
      },
    },
  },
)

type InputProps = Omit<ComponentProps<'input'>, 'size'> &
  VariantProps<typeof inputVariants>

export function Input({ className, variant, size, ...props }: InputProps) {
  return (
    <InputPrimitive
      data-slot="input"
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  )
}
