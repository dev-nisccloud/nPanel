import * as React from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { countries } from "@npanel/location/countries-intl";
import { Button } from "@/components/ui/button.tsx";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}

/** Resolve stored profile values (name or ISO alpha-2) to the catalog country name. */
export function resolveCountryName(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  const byName = countries.find(
    (c) => c.name.toLowerCase() === value.toLowerCase(),
  );
  if (byName) return byName.name;
  const byCode = countries.find(
    (c) => c.alpha2.toLowerCase() === value.toLowerCase(),
  );
  return byCode?.name ?? "";
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country…",
  className,
  invalid,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const resolved = resolveCountryName(value);
  const selectedCountry = countries.find((country) => country.name === resolved);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-full justify-between rounded-xl text-sm font-normal",
            !selectedCountry && "text-muted-foreground",
            invalid && "border-destructive focus-visible:ring-destructive",
            className,
          )}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2 truncate">
              <span className="text-base leading-none">{selectedCountry.emoji}</span>
              <span className="truncate">{selectedCountry.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{placeholder}</span>
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]"
        align="start"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest("[cmdk-list]") ||
            target.closest("[cmdk-item]") ||
            target.closest("[cmdk-input]")
          ) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (
            target.closest("[cmdk-list]") ||
            target.closest("[cmdk-item]") ||
            target.closest("[cmdk-input]")
          ) {
            e.preventDefault();
          }
        }}
        style={{ pointerEvents: "auto" }}
      >
        <Command>
          <CommandInput placeholder="Search countries…" />
          <CommandList className="max-h-64 overflow-auto">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.alpha2}
                  value={`${country.name} ${country.alpha2}`}
                  onSelect={() => {
                    onValueChange(country.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      resolved === country.name ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="mr-2 text-lg leading-none">{country.emoji}</span>
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
