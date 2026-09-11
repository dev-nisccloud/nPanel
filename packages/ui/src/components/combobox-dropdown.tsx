"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { cn } from "@npanel/ui/lib/utils/index";
import { buttonVariants } from "@npanel/ui/components/button";
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
  /** Extra strings included in client-side search (e.g. slug, email). */
  keywords?: string[];
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
  /** Render popover inside the nearest open dialog so search inputs stay interactive in sheets. */
  inDialog?: boolean;
};

function itemMatchesQuery<T extends ComboboxItem>(item: T, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (item.label.toLowerCase().includes(q)) return true;
  if (item.id.toLowerCase().includes(q)) return true;
  return item.keywords?.some((keyword) => keyword.toLowerCase().includes(q)) ?? false;
}

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
  inDialog = false,
}: Props<T>) {
  const [open, setOpen] = React.useState(false);
  const [internalSelectedItem, setInternalSelectedItem] = React.useState<
    T | undefined
  >();
  const [inputValue, setInputValue] = React.useState("");
  const [portalContainer, setPortalContainer] = React.useState<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const selectedItem = incomingSelectedItem ?? internalSelectedItem;

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setInputValue("");
  }, []);

  React.useEffect(() => {
    if (!open) {
      setPortalContainer(null);
      return;
    }
    const fromTrigger = triggerRef.current?.closest("[role='dialog']");
    if (fromTrigger instanceof HTMLElement) {
      setPortalContainer(fromTrigger);
      return;
    }
    if (inDialog) {
      const dialog = document.querySelector("[role='dialog']");
      setPortalContainer(dialog instanceof HTMLElement ? dialog : null);
      return;
    }
    setPortalContainer(null);
  }, [inDialog, open]);

  const filteredItems = React.useMemo(
    () => items.filter((item) => itemMatchesQuery(item, inputValue)),
    [items, inputValue],
  );

  const showCreate = onCreate && Boolean(inputValue) && !filteredItems.length;

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
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

      <CommandList
        className="max-h-[min(18rem,var(--available-height,18rem))] overflow-y-auto overscroll-contain scrollbar-thin overflow-x-hidden p-1"
        onWheel={(e) => e.stopPropagation()}
      >
        <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
          {emptyResults ?? "No item found"}
        </CommandEmpty>

        <CommandGroup className="overflow-visible p-0">
          {filteredItems.map((item) => {
            const isChecked = selectedItem?.id === item.id;

            return (
              <CommandItem
                disabled={item.disabled}
                className={cn("cursor-pointer rounded-lg mx-1 my-0.5", className)}
                key={item.id}
                value={`${item.label} ${item.id}`}
                keywords={item.keywords}
                onSelect={() => {
                  onSelect(item);
                  setInternalSelectedItem(item);
                  handleOpenChange(false);
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
                handleOpenChange(false);
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
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        ref={triggerRef}
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
        container={portalContainer}
        className="p-0 rounded-xl overflow-hidden border-border/40 shadow-2xl bg-popover"
        {...popoverProps}
        style={{
          width: "var(--anchor-width, var(--radix-popover-trigger-width, 100%))",
          pointerEvents: "auto",
          ...popoverProps?.style,
        }}
      >
        <div
          onKeyDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {Component}
        </div>
      </PopoverContent>
    </Popover>
  );
}
