import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'
import { eyebrowClassName } from './surfaces'

export function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col', className)}
      {...props}
    />
  )
}

export function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('flex items-center', className)}
      {...props}
    />
  )
}

export const tabsTriggerVariants = cva(
  'relative inline-flex shrink-0 items-center justify-center outline-none disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        // A bottom border that turns primary on the active tab.
        underline:
          'border-b-2 border-transparent px-3.5 transition-colors hover:text-foreground data-active:border-primary data-active:text-accent-text',
        // Eyebrow labels with a rounded bar under the active tab.
        eyebrow: [
          eyebrowClassName,
          'h-8 gap-1.5 text-muted-foreground transition-colors hover:text-muted-bright data-active:text-foreground',
          'data-active:after:absolute data-active:after:inset-x-0 data-active:after:bottom-0 data-active:after:h-0.5 data-active:after:rounded-full data-active:after:bg-foreground',
        ],
      },
    },
  },
)

export function TabsTrigger({
  className,
  variant,
  ...props
}: TabsPrimitive.Tab.Props & VariantProps<typeof tabsTriggerVariants>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('outline-none', className)}
      {...props}
    />
  )
}
