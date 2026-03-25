"use client";

import { useInvoiceParams } from "@/hooks/use-invoice-params";
import { useCustomersQuery } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React from "react";

export function SelectCustomer() {
  const { data: customers } = useCustomersQuery();
  const { setParams: setInvoiceParams } = useInvoiceParams();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  const formatData = customers?.data?.map((item) => ({
    value: item.name,
    label: item.name,
    id: item.id,
  }));

  const handleSelect = (id: string) => {
    if (id === "create-customer") {
      // For now, just show a placeholder - you can implement customer creation later
      console.log("Create customer:", value);
    } else {
      setInvoiceParams({ selectedCustomerId: id });
    }

    setOpen(false);
  };

  if (!customers?.data?.length) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={() => console.log("Create customer")}
        className="font-mono text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
      >
        Select customer
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-expanded={open}
          className="font-mono text-[#434343] p-0 text-[11px] h-auto hover:bg-transparent"
        >
          Select customer
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[200px] p-0"
        side="bottom"
        sideOffset={10}
        align="start"
      >
        <Command>
          <CommandInput
            value={value}
            onValueChange={setValue}
            placeholder="Search customer..."
            className="p-2 text-xs"
          />
          <CommandList className="max-h-[180px] overflow-auto">
            <CommandEmpty className="text-xs border-t-[1px] border-border p-2">
              <button
                type="button"
                onClick={() => console.log("Create customer:", value)}
              >
                Create customer
              </button>
            </CommandEmpty>
            <CommandGroup>
              {formatData?.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  onSelect={() => handleSelect(item.id)}
                  className="group text-xs"
                >
                  {item.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Edit customer:", item.id);
                    }}
                    className="ml-auto text-xs opacity-0 group-hover:opacity-50 hover:opacity-100"
                  >
                    Edit
                  </button>
                </CommandItem>
              ))}
              <CommandItem
                value="create-customer"
                onSelect={handleSelect}
                className="text-xs border-t-[1px] border-border pt-2 mt-2"
              >
                Create customer
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
