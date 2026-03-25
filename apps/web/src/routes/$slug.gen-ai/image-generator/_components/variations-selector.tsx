"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VARIATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface VariationsSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Max selectable variations (e.g. from credits). Options above this are disabled. */
  maxVariations?: number | null;
}

export function VariationsSelector({
  value,
  onChange,
  disabled,
  maxVariations,
}: VariationsSelectorProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className="h-8 gap-1.5 px-2 text-xs rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
        >
          {value} variation{value !== 1 ? "s" : ""}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        <div className="space-y-1">
          {VARIATIONS.map((variation) => {
            const overLimit =
              maxVariations != null && typeof maxVariations === "number" && variation > maxVariations;
            return (
              <button
                key={variation}
                type="button"
                onClick={() => {
                  if (overLimit) return;
                  onChange(variation);
                  setOpen(false);
                }}
                disabled={overLimit}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                  overLimit
                    ? "cursor-not-allowed opacity-50 text-muted-foreground"
                    : "hover:bg-accent"
                )}
              >
                {variation} variation{variation !== 1 ? "s" : ""}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

