"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Supported aspect ratios for Replicate nano-banana
export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";

const ASPECT_RATIOS: { value: AspectRatio; label: string; display: string }[] = [
  { value: "1:1", label: "Square (1:1)", display: "Square" },
  { value: "2:3", label: "Portrait (2:3)", display: "Portrait" },
  { value: "3:2", label: "Landscape (3:2)", display: "Landscape" },
  { value: "3:4", label: "Portrait (3:4)", display: "Portrait" },
  { value: "4:3", label: "Landscape (4:3)", display: "Landscape" },
  { value: "4:5", label: "Portrait (4:5)", display: "Portrait" },
  { value: "5:4", label: "Landscape (5:4)", display: "Landscape" },
  { value: "9:16", label: "Portrait (9:16)", display: "Portrait" },
  { value: "16:9", label: "Landscape (16:9)", display: "Landscape" },
  { value: "21:9", label: "Ultra Wide (21:9)", display: "Ultra Wide" },
];

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
}

export function AspectRatioSelector({ value, onChange, disabled }: AspectRatioSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedRatio = ASPECT_RATIOS.find((r) => r.value === value);
  const displayLabel = selectedRatio?.display || "Landscape";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          disabled={disabled} 
          className="h-8 gap-1.5 px-2 text-xs rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
        >
          {displayLabel}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-1">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => {
                onChange(ratio.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                value === ratio.value && "bg-accent"
              )}
            >
              <span>{ratio.label}</span>
              {value === ratio.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

