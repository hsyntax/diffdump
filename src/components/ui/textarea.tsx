import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

export const textareaVariants = cva(
  [
    'flex min-h-16 w-full resize-y rounded-control border border-line bg-canvas px-2 py-1.5 text-xs text-foreground outline-none transition-[border-color,box-shadow]',
    'placeholder:text-muted-foreground/70 focus-visible:border-accent-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-55',
  ],
  {
    variants: {
      variant: {
        // A borderless code editor surface with an inset focus outline.
        editor: [
          'rounded-none border-0 bg-panel px-5 py-5 font-mono leading-code caret-accent-text md:px-6 md:py-6 md:text-[13px]',
          'focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-accent-text',
        ],
      },
    },
  },
)

export function Textarea({
  className,
  variant,
  ...props
}: ComponentProps<'textarea'> & VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(textareaVariants({ variant }), className)}
      {...props}
    />
  )
}
