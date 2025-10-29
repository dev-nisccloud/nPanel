"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  calendarClassName?: string;
  popoverClassName?: string;
  formatString?: string;
  fromDate?: Date;
  toDate?: Date;
  disabledDates?: Date[];
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  buttonClassName,
  calendarClassName,
  popoverClassName,
  formatString = "PPP",
  fromDate,
  toDate,
  disabledDates,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              buttonClassName
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, formatString) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn("w-auto p-0", popoverClassName)} 
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (disabledDates?.some(disabledDate => 
                date.getTime() === disabledDate.getTime()
              )) return true;
              if (fromDate && date < fromDate) return true;
              if (toDate && date > toDate) return true;
              return false;
            }}
            initialFocus
            className={calendarClassName}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Simple date picker without input (just button + calendar)
interface SimpleDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  calendarClassName?: string;
  popoverClassName?: string;
  formatString?: string;
  fromDate?: Date;
  toDate?: Date;
  disabledDates?: Date[];
}

export function SimpleDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  buttonClassName,
  calendarClassName,
  popoverClassName,
  formatString = "PPP",
  fromDate,
  toDate,
  disabledDates,
}: SimpleDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              buttonClassName
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, formatString) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn("w-auto p-0", popoverClassName)} 
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => {
              if (disabledDates?.some(disabledDate => 
                date.getTime() === disabledDate.getTime()
              )) return true;
              if (fromDate && date < fromDate) return true;
              if (toDate && date > toDate) return true;
              return false;
            }}
            initialFocus
            className={calendarClassName}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
