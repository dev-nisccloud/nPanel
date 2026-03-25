"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const dataCardVariants = cva(
  "relative flex flex-col overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border",
        outlined: "bg-transparent text-foreground border-2",
        ghost: "bg-transparent text-foreground border-0",
        elevated: "bg-card text-card-foreground border shadow-md",
      },
      size: {
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
      },
      interactive: {
        true: "cursor-pointer hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
);

export interface DataCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dataCardVariants> {
  asChild?: boolean;
}

const DataCard = React.forwardRef<HTMLDivElement, DataCardProps>(
  ({ className, variant, size, interactive, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(dataCardVariants({ variant, size, interactive, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
DataCard.displayName = "DataCard";

// Card Header Component
const DataCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-2", className)}
    {...props}
  />
));
DataCardHeader.displayName = "DataCardHeader";

// Card Title Component
const DataCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DataCardTitle.displayName = "DataCardTitle";

// Card Description Component
const DataCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DataCardDescription.displayName = "DataCardDescription";

// Card Content Component
const DataCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1", className)} {...props} />
));
DataCardContent.displayName = "DataCardContent";

// Card Footer Component
const DataCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-2", className)}
    {...props}
  />
));
DataCardFooter.displayName = "DataCardFooter";

// Card Field Component for structured data display
interface DataCardFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  className?: string;
}

const DataCardField = React.forwardRef<HTMLDivElement, DataCardFieldProps>(
  ({ label, value, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1", className)}
      {...props}
    >
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
);
DataCardField.displayName = "DataCardField";

// Card Grid Component for organizing fields
const DataCardGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    cols?: 1 | 2 | 3 | 4;
  }
>(({ className, cols = 2, ...props }, ref) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "grid gap-4",
        gridCols[cols],
        className
      )}
      {...props}
    />
  );
});
DataCardGrid.displayName = "DataCardGrid";

// Card List Component for displaying multiple cards
interface DataCardListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
}

const DataCardList = React.forwardRef<HTMLDivElement, DataCardListProps>(
  ({ className, children, cols = 3, gap = "md", ...props }, ref) => {
    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    };

    const gapSize = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridCols[cols],
          gapSize[gap],
          "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DataCardList.displayName = "DataCardList";

export {
  DataCard,
  DataCardHeader,
  DataCardTitle,
  DataCardDescription,
  DataCardContent,
  DataCardFooter,
  DataCardField,
  DataCardGrid,
  DataCardList,
  dataCardVariants,
};
