import * as React from "react";
import { cn } from "@/lib/utils.ts";

export type CartPillTab<T extends string> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

interface CartPillTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  tabs: CartPillTab<T>[];
  className?: string;
  listClassName?: string;
  ariaLabel?: string;
}

export function CartPillTabs<T extends string>({
  value,
  onValueChange,
  tabs,
  className,
  listClassName,
  ariaLabel = "Options",
}: CartPillTabsProps<T>) {
  return (
    <div className={cn("mb-4", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          listClassName,
        )}
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = value === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
