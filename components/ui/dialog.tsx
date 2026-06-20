"use client"

import { X } from "@phosphor-icons/react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SPRING_OPEN = { type: "spring" as const, duration: 0.3, bounce: 0.08 }
const SPRING_CLOSE = { type: "spring" as const, duration: 0.2, bounce: 0 }

const STAGGER_DELAY = 0.05

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/20 backdrop-blur-sm",
        "data-starting-style:opacity-0 data-ending-style:opacity-0",
        "transition-opacity duration-200",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size = "sm",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  size?: "sm" | "md" | "lg"
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl border border-foreground/8 bg-popover p-0 text-popover-foreground",
          "shadow-lg ring-1 ring-foreground/5 outline-none",
          "max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:w-full max-sm:-translate-x-0 max-sm:-translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-2xl",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-md",
          size === "lg" && "max-w-lg",
          "data-starting-style:opacity-0 data-starting-style:scale-95",
          "max-sm:data-starting-style:translate-y-4 max-sm:data-starting-style:scale-100 max-sm:data-starting-style:opacity-0",
          "data-ending-style:opacity-0 data-ending-style:scale-95",
          "max-sm:data-ending-style:translate-y-4 max-sm:data-ending-style:scale-100 max-sm:data-ending-style:opacity-0",
          "transition-[transform,opacity,translate] duration-200 ease-out",
          "will-change-transform",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-3 top-3 z-10"
            render={
              <Button variant="ghost" size="icon-sm">
                <X weight="bold" size={16} />
              </Button>
            }
          />
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1 px-6 pt-6 pb-2",
        "border-b border-foreground/5",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex items-center justify-end gap-3 px-6 pb-6 pt-2",
        "border-t border-foreground/5",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn(
        "text-base font-semibold text-ink leading-snug tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn(
        "text-xs text-muted leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "px-6 py-4 overflow-y-auto max-h-[60vh]",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
}
