"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { countries } from "@npanel/location/countries-intl";

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function CountrySelect({ value, onValueChange, placeholder = "Select country..." }: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCountry = countries.find((country) => country.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.emoji}</span>
              <span>{selectedCountry.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" 
        align="start"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking inside the command list
          const target = e.target as HTMLElement;
          if (target.closest('[cmdk-list]') || target.closest('[cmdk-item]') || target.closest('[cmdk-input]')) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          // Prevent closing when interacting with command items
          const target = e.target as HTMLElement;
          if (target.closest('[cmdk-list]') || target.closest('[cmdk-item]') || target.closest('[cmdk-input]')) {
            e.preventDefault();
          }
        }}
        style={{ pointerEvents: 'auto' }}
      >
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandList className="max-h-64 overflow-auto">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.alpha2}
                  value={country.name}
                  onSelect={(currentValue) => {
                    const selected = countries.find(
                      (c) => c.name.toLowerCase() === currentValue.toLowerCase()
                    );
                    if (selected) {
                      onValueChange(selected.name);
                      setOpen(false);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === country.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="mr-2 text-lg">{country.emoji}</span>
                  <span>{country.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {country.alpha2}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
