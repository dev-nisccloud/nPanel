import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils.ts";

const buttonVariants = cva(
  "inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 outline-none disabled:pointer-events-none disabled:opacity-45 aria-busy:pointer-events-none aria-busy:cursor-wait aria-busy:opacity-70 focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/88 hover:shadow-md hover:shadow-primary/15 active:translate-y-px active:bg-primary/78",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 active:translate-y-px focus-visible:ring-destructive/20 dark:bg-destructive/70 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-border bg-background text-foreground shadow-xs hover:border-primary/60 hover:bg-primary/[0.07] active:translate-y-px dark:bg-input/25 dark:hover:bg-input/45",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/75 active:translate-y-px",
        ghost:
          "shadow-none hover:bg-accent hover:text-accent-foreground active:bg-accent/70 dark:hover:bg-accent/50",
        link: "min-h-0 rounded-none px-0 text-primary shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-11 gap-1.5 px-3.5 has-[>svg]:px-3",
        lg: "h-12 px-6 has-[>svg]:px-5",
        icon: "size-11 p-0",
        "icon-sm": "size-11 p-0",
        "icon-lg": "size-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
