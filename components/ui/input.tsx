"use client"

import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  InputPrimitive.Props
>(({ className, type, ...props }, ref) => {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full rounded-lg border border-foreground/10 bg-canvas px-3 py-1.5",
        "text-sm text-ink leading-snug placeholder:text-muted",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-foreground/20",
        "focus-visible:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-error aria-[invalid=true]:ring-error/20",
        className
      )}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
