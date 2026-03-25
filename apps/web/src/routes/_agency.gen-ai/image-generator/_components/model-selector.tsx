"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModelType = "ultra" | "core" | "sd3";

type Sd3Model = "sd3.5-large" | "sd3.5-large-turbo" | "sd3.5-medium" | "sd3.5-flash";

interface ModelSelectorProps {
  value: ModelType;
  sd3Model: Sd3Model;
  onModelChange: (value: ModelType) => void;
  onSd3ModelChange: (value: Sd3Model) => void;
  disabled?: boolean;
}

export function ModelSelector({
  value,
  sd3Model,
  onModelChange,
  onSd3ModelChange,
  disabled,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const modelLabels: Record<ModelType, string> = {
    ultra: "Ultra",
    core: "Core",
    sd3: "SD3.5",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          disabled={disabled} 
          className="h-8 gap-1.5 px-2 text-xs rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-blue-500"
        >
          {modelLabels[value]}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={value}
              onValueChange={(v) => onModelChange(v as ModelType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ultra">Ultra</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="sd3">SD3.5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {value === "sd3" && (
            <div className="space-y-2">
              <Label>SD3.5 Variant</Label>
              <Select 
                value={sd3Model} 
                onValueChange={(value) => onSd3ModelChange(value as Sd3Model)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sd3.5-large">SD3.5 Large</SelectItem>
                  <SelectItem value="sd3.5-large-turbo">SD3.5 Large Turbo</SelectItem>
                  <SelectItem value="sd3.5-medium">SD3.5 Medium</SelectItem>
                  <SelectItem value="sd3.5-flash">SD3.5 Flash</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={() => setOpen(false)} className="w-full" size="sm">
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
