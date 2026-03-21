"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  datePlaceholder?: string;
  timePlaceholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  toDate?: Date;
  disabledDates?: Date[];
}

export function DateTimePicker({
  value,
  onChange,
  label,
  datePlaceholder = "Select date",
  timePlaceholder,
  disabled = false,
  className,
  fromDate,
  toDate,
  disabledDates,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState<string>("");

  // Extract time from value or use default
  React.useEffect(() => {
    if (value) {
      const hours = value.getHours().toString().padStart(2, "0");
      const minutes = value.getMinutes().toString().padStart(2, "0");
      const seconds = value.getSeconds().toString().padStart(2, "0");
      setTimeValue(`${hours}:${minutes}:${seconds}`);
    } else {
      setTimeValue("");
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(undefined);
      setTimeValue("");
      return;
    }

    // If time is already set, preserve it
    if (timeValue) {
      const [hours, minutes, seconds = "00"] = timeValue.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds || "00", 10));
      onChange?.(newDate);
    } else {
      // Set default time to current time if no time is set
      const now = new Date();
      const newDate = new Date(date);
      newDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
      onChange?.(newDate);
      setTimeValue(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`
      );
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setTimeValue(time);

    if (value && time) {
      const [hours, minutes, seconds = "00"] = time.split(":");
      const newDate = new Date(value);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), parseInt(seconds || "00", 10));
      onChange?.(newDate);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {label && (
        <Label className="px-1">
          {label}
        </Label>
      )}
      <div className="flex gap-4">
        <Popover open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
              disabled={disabled}
            >
              {value ? value.toLocaleDateString() : datePlaceholder}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto overflow-hidden p-0" 
            align="start"
            onPointerDownOutside={(e) => {
              // Prevent closing when clicking on calendar navigation elements
              const target = e.target as HTMLElement;
              if (target.closest('.rdp') || 
                  target.closest('[role="button"]') ||
                  target.closest('select') ||
                  target.closest('option')) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              // Prevent closing when interacting with calendar navigation elements
              const target = e.target as HTMLElement;
              if (target.closest('.rdp') || 
                  target.closest('[role="button"]') ||
                  target.closest('select') ||
                  target.closest('option')) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              // Allow escape to close
            }}
            style={{ pointerEvents: 'auto' }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Calendar
                mode="single"
                selected={value}
                captionLayout="dropdown"
                fromYear={2024}
                toYear={2050}
                onSelect={(date) => {
                  handleDateSelect(date);
                  if (date) {
                    setOpen(false);
                  }
                }}
                disabled={(date) => {
                  if (disabledDates?.some(disabledDate => 
                    date.getTime() === disabledDate.getTime()
                  )) return true;
                  if (fromDate && date < fromDate) return true;
                  if (toDate && date > toDate) return true;
                  return false;
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          step="1"
          value={timeValue}
          onChange={handleTimeChange}
          placeholder={timePlaceholder}
          disabled={disabled || !value}
          className="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}

