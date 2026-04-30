"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { cn } from "@npanel/ui/lib/utils/index";
import { Button, buttonVariants } from "@npanel/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@npanel/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@npanel/ui/components/popover";

export type ComboboxItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

type Props<T> = {
  placeholder?: React.ReactNode;
  searchPlaceholder?: string;
  items: T[];
  onSelect: (item: T) => void;
  selectedItem?: T;
  renderSelectedItem?: (selectedItem: T) => React.ReactNode;
  renderOnCreate?: (value: string) => React.ReactNode;
  renderListItem?: (listItem: {
    isChecked: boolean;
    item: T;
  }) => React.ReactNode;
  emptyResults?: React.ReactNode;
  popoverProps?: React.ComponentProps<typeof PopoverContent>;
  disabled?: boolean;
  onCreate?: (value: string) => void;
  headless?: boolean;
  className?: string;
};

export function ComboboxDropdown<T extends ComboboxItem>({
  headless,
  placeholder,
  searchPlaceholder,
  items,
  onSelect,
  selectedItem: incomingSelectedItem,
  renderSelectedItem = (item) => item.label,
  renderListItem,
  renderOnCreate,
  emptyResults,
  popoverProps,
  disabled,
  onCreate,
  className,
}: Props<T>) {
  const [open, setOpen] = React.useState(false);
  const [internalSelectedItem, setInternalSelectedItem] = React.useState<
    T | undefined
  >();
  const [inputValue, setInputValue] = React.useState("");

  const selectedItem = incomingSelectedItem ?? internalSelectedItem;

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const showCreate = onCreate && Boolean(inputValue) && !filteredItems.length;

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus input when popover opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        (inputRef.current as HTMLInputElement | null)?.focus();
      }, 100);
    }
  }, [open]);

  const Component = (
    <Command loop className="rounded-xl overflow-hidden" shouldFilter={false}>
      <div
        className="border-b px-3"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <CommandInput
          ref={inputRef as any}
          value={inputValue}
          onValueChange={setInputValue}
          placeholder={searchPlaceholder ?? "Search item..."}
          className="border-0 focus:ring-0 focus-visible:ring-0 pointer-events-auto"
        />
      </div>

      <CommandList className="max-h-[225px] overflow-y-auto scrollbar-thin overflow-x-hidden p-1">
        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
          {emptyResults ?? "No item found"}
        </CommandEmpty>

        <CommandGroup>
          {items
            .filter((item) => item.label.toLowerCase().includes(inputValue.toLowerCase()))
            .map((item) => {
              const isChecked = selectedItem?.id === item.id;

              return (
                <CommandItem
                  disabled={item.disabled}
                  className={cn("cursor-pointer rounded-lg mx-1 my-0.5", className)}
                  key={item.id}
                  value={item.id}
                  onSelect={() => {
                    onSelect(item);
                    setInternalSelectedItem(item);
                    setOpen(false);
                  }}
                >
                  {renderListItem ? (
                    renderListItem({ isChecked, item })
                  ) : (
                    <>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isChecked ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {item.label}
                    </>
                  )}
                </CommandItem>
              );
            })}

          {showCreate && (
            <CommandItem
              key={inputValue}
              value={inputValue}
              className="rounded-lg mx-1 my-0.5"
              onSelect={() => {
                onCreate(inputValue);
                setOpen(false);
                setInputValue("");
              }}
            >
              {renderOnCreate ? renderOnCreate(inputValue) : null}
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (headless) {
    return Component;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between relative font-normal rounded-xl h-10 border-border/50 hover:bg-muted/30 transition-colors",
        )}
        aria-expanded={open}
      >
        <span className="truncate text-ellipsis pr-6">
          {selectedItem ? (
            <span className="items-center overflow-hidden whitespace-nowrap text-ellipsis block text-left">
              {renderSelectedItem
                ? renderSelectedItem(selectedItem)
                : selectedItem.label}
            </span>
          ) : (
            (placeholder ?? "Select item...")
          )}
        </span>
        <ChevronsUpDown className="size-4 opacity-50 absolute right-3 shrink-0" />
      </PopoverTrigger>

      <PopoverContent
        className="p-0 rounded-xl overflow-hidden border-border/40 shadow-2xl bg-popover"
        {...popoverProps}
        {...({
          onPointerDownOutside: (e: any) => {
             const target = e.target as HTMLElement;
             if (target.closest('[cmdk-root]')) e.preventDefault();
             
            if ((popoverProps as any)?.onPointerDownOutside) {
              (popoverProps as any).onPointerDownOutside(e);
            }
          },
          onOpenAutoFocus: (e: any) => {
            if ((popoverProps as any)?.onOpenAutoFocus) {
              (popoverProps as any).onOpenAutoFocus(e);
            }
          },
          onWheel: (e: any) => {
            e.stopPropagation();
          },
        } as any)}
        style={{
          width: "var(--radix-popover-trigger-width)",
          pointerEvents: "auto",
          zIndex: 9999,
          ...popoverProps?.style,
        }}
      >
        <div onKeyDown={(e) => e.stopPropagation()}>
          {Component}
        </div>
      </PopoverContent>
    </Popover>
  );
}
