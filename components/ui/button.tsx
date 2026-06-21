import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0.8,1)] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-accent-hover",
        outline:
          "border border-edges bg-transparent text-ink hover:bg-hover hover:text-brand-accent",
        secondary:
          "bg-surface-high text-ink border border-edges hover:bg-surface-highest hover:text-brand-accent",
        ghost:
          "bg-transparent text-ink hover:bg-hover hover:text-brand-accent",
        destructive:
          "bg-error/10 text-error hover:bg-error/20",
        link: "text-brand-accent underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-6",
        xs: "h-6 gap-1 rounded px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 text-[0.8rem] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-8",
        icon: "size-10",
        "icon-xs": "size-6 rounded [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
