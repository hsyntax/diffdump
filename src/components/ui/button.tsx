import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/cn'

export const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-control border text-xs font-medium outline-none',
    'transition-[color,background-color,border-color,transform,box-shadow] duration-150',
    'focus-visible:border-accent-text focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'data-disabled:pointer-events-none data-disabled:opacity-55 disabled:pointer-events-none disabled:opacity-55',
  ],
  {
    variants: {
      variant: {
        primary:
          'border-primary bg-primary text-primary-foreground hover:border-primary-strong hover:bg-primary-strong active:translate-y-px',
        secondary:
          'border-secondary-border bg-secondary text-secondary-foreground hover:border-secondary-border-strong hover:bg-secondary-strong active:translate-y-px',
        outline:
          'border-line bg-surface text-muted-bright hover:border-line-bright hover:bg-surface-raised hover:text-foreground active:translate-y-px',
        ghost:
          'border-transparent bg-transparent text-muted-foreground hover:bg-surface-raised hover:text-foreground',
        destructive:
          'border-destructive bg-destructive text-destructive-foreground hover:border-destructive-strong hover:bg-destructive-strong active:translate-y-px',
        // A multi-line list row that highlights on hover.
        row: 'cursor-pointer whitespace-normal border-transparent bg-transparent font-normal leading-snug text-foreground transition-colors hover:border-line hover:bg-surface-raised hover:text-foreground',
        // No chrome: for a button inside a row that is already styled.
        plain:
          'whitespace-normal border-0 border-transparent bg-transparent font-normal text-foreground hover:bg-transparent hover:text-foreground',
      },
      size: {
        '2xs': 'h-6 px-1.5 text-2xs',
        xs: 'h-7 px-2.5',
        sm: 'h-8 px-3',
        row: 'h-auto gap-1 px-2 py-1.5',
        flush: 'h-auto gap-1 p-0',
        iconXs: 'size-7 p-0 text-sm',
        iconSm: 'size-8 p-0 text-sm',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'sm',
    },
  },
)

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      type={type}
      className={(state) =>
        cn(
          buttonVariants({ variant, size }),
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  )
}

type IconButtonProps = Omit<ButtonProps, 'size'> & {
  label: string
  size?: 'xs' | 'sm'
}

export function IconButton({ label, size = 'sm', ...props }: IconButtonProps) {
  return (
    <Button
      data-slot="icon-button"
      size={size === 'xs' ? 'iconXs' : 'iconSm'}
      aria-label={label}
      {...props}
    />
  )
}
