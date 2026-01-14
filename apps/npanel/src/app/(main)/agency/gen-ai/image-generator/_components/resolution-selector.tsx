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

type Resolution = "1K" | "2K" | "4K";

const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
];

interface ResolutionSelectorProps {
  value: Resolution;
  onChange: (value: Resolution) => void;
  disabled?: boolean;
}

export function ResolutionSelector({ value, onChange, disabled }: ResolutionSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedResolution = RESOLUTIONS.find((r) => r.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          disabled={disabled} 
          className="h-8 gap-1.5 px-2 text-xs rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
        >
          {selectedResolution?.label || "2K"}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-32 p-1" align="start">
        <div className="space-y-1">
          {RESOLUTIONS.map((resolution) => (
            <button
              key={resolution.value}
              onClick={() => {
                onChange(resolution.value);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                value === resolution.value && "bg-accent"
              )}
            >
              <span>{resolution.label}</span>
              {value === resolution.value && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
