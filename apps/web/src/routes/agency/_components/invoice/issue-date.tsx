import { TZDate } from "@date-fns/tz";
import { Calendar } from "@npanel/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@npanel/ui/components/popover";
import { format } from "date-fns";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { LabelInput } from "./label-input";

export function IssueDate() {
  const { setValue, watch } = useFormContext();
  const issueDate = watch("issueDate");
  const dateFormat = watch("template.dateFormat");
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setValue("issueDate", date.toISOString(), {
        shouldValidate: true,
        shouldDirty: true,
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="flex space-x-2 items-center">
      <div className="flex items-center space-x-1">
        <LabelInput
          name="template.issueDateLabel"
          onSave={(value) => {
            console.log("Update template:", { issueDateLabel: value });
          }}
        />
        <span className="text-[11px] text-[#878787] font-mono">:</span>
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen} modal>
        <PopoverTrigger className="text-primary text-[11px] font-mono whitespace-nowrap flex px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
          {issueDate && format(issueDate, dateFormat)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={issueDate ? new TZDate(issueDate, "UTC") : undefined}
            onSelect={handleSelect}
            initialFocus
            className="p-4"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

