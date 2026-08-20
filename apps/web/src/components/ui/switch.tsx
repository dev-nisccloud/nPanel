"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { Spinner } from "@/components/ui/shadcn-io/spinner"
import { cn } from "@/lib/utils"

function Switch({
  className,
  loading,
  disabled,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & { loading?: boolean }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      disabled={disabled || loading}
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        loading &&
          "bg-muted data-[state=checked]:bg-muted dark:bg-muted dark:data-[state=checked]:bg-muted disabled:opacity-100",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none relative flex size-4 items-center justify-center overflow-hidden rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
          loading &&
            "bg-background dark:bg-background dark:data-[state=checked]:bg-background dark:data-[state=unchecked]:bg-background",
        )}
      >
        {loading ? (
          <Spinner variant="pinwheel" size={12} className="text-primary" />
        ) : null}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
