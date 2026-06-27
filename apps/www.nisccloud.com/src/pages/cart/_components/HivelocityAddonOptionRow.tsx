import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import type { HivelocityAddonDisabledDetails } from "@/lib/hivelocity-option-compatibility.ts";
import { cn } from "@/lib/utils.ts";

interface HivelocityAddonOptionRowProps {
  name: string;
  checked: boolean;
  disabled: boolean;
  disabledDetails: HivelocityAddonDisabledDetails | null;
  displayPriceLabel: string;
  onSelect: () => void;
}

export function HivelocityAddonOptionRow({
  name,
  checked,
  disabled,
  disabledDetails,
  displayPriceLabel,
  onSelect,
}: HivelocityAddonOptionRowProps) {
  const showTooltip = disabled && Boolean(disabledDetails);

  const card = (
    <button
      type="button"
      onClick={onSelect}
      aria-disabled={disabled}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition",
        disabled
          ? "opacity-60 cursor-not-allowed bg-muted/20"
          : checked
            ? "border-primary bg-primary/5"
            : "hover:border-primary/40",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="block font-medium line-clamp-2">{name}</span>
          {showTooltip ? (
            <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
        </span>
        <span className="block text-xs font-semibold text-primary mt-1">{displayPriceLabel}</span>
        {showTooltip && disabledDetails ? (
          <span className="block mt-1.5 text-xs text-muted-foreground line-clamp-2">
            {disabledDetails.reason}
          </span>
        ) : null}
      </span>
      <span className="text-xs shrink-0 text-muted-foreground">
        {checked ? "Selected" : disabled ? "Unavailable" : "Select"}
      </span>
    </button>
  );

  if (!showTooltip || !disabledDetails) {
    return card;
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1.5 p-3 text-left">
        <p className="font-medium">{disabledDetails.reason}</p>
        <p className="text-primary-foreground/90">{disabledDetails.fix}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function HivelocityAddonNoSelectionRow({
  checked,
  onSelect,
  label = "No selection",
  description = "Skip this category  no add-on will be included.",
}: {
  checked: boolean;
  onSelect: () => void;
  label?: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center justify-between gap-3 rounded-lg border border-dashed px-3 py-2.5 text-left text-sm transition",
        checked ? "border-primary bg-primary/5" : "hover:border-primary/40 bg-muted/10",
      )}
    >
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      </span>
      <span className="text-xs shrink-0 text-muted-foreground">{checked ? "Selected" : "Skip"}</span>
    </button>
  );
}
