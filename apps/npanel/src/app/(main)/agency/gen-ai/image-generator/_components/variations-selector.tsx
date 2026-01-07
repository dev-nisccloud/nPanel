"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const VARIATIONS = [1, 2, 3, 4, 5];

interface VariationsSelectorProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function VariationsSelector({ value, onChange, disabled }: VariationsSelectorProps) {
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
          {VARIATIONS.map((variation) => (
            <button
              key={variation}
              onClick={() => {
                onChange(variation);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              {variation} variation{variation !== 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

