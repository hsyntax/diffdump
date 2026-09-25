import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

export function ToggleGroup({
  className,
  ...props
}: ToggleGroupPrimitive.Props) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      className={cn('flex items-center', className)}
      {...props}
    />
  )
}

export const toggleGroupItemVariants = cva(
  'outline-none disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        // Inline mono labels with a rounded bar under the pressed item.
        indicator: [
          'relative inline-flex h-8 shrink-0 items-center gap-2 font-mono text-2xs text-muted-foreground transition-colors hover:text-muted-bright data-pressed:text-foreground',
          'data-pressed:after:absolute data-pressed:after:inset-x-0 data-pressed:after:bottom-0 data-pressed:after:h-0.5 data-pressed:after:rounded-full data-pressed:after:bg-foreground',
        ],
        // A stacked list option that highlights on hover.
        option:
          'flex items-center gap-2 rounded-control px-2 py-1.5 text-left font-mono text-2xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground data-pressed:text-foreground',
      },
    },
  },
)

export function ToggleGroupItem({
  className,
  variant,
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleGroupItemVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(toggleGroupItemVariants({ variant }), className)}
      {...props}
    />
  )
}
