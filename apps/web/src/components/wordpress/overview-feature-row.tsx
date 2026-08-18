"use client";

import { AlertTriangle, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function OverviewFeatureRow({
  label,
  hint,
  warning,
  danger,
  value,
  action,
  toggle,
  onConfigure,
}: {
  label: string;
  hint?: string;
  warning?: boolean;
  danger?: boolean;
  value?: string;
  action?: { label: string; onClick: () => void };
  toggle?: {
    checked: boolean;
    onCheckedChange: (value: boolean) => void;
    disabled?: boolean;
  };
  onConfigure?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {danger ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
        ) : warning ? (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        ) : null}
        <div className="min-w-0">
          {hint ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate text-sm font-medium text-primary">{label}</span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {hint}
              </TooltipContent>
            </Tooltip>
          ) : (
            <p className="truncate text-sm font-medium text-primary">{label}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {value ? (
          <span className="text-xs text-muted-foreground">{value}</span>
        ) : null}
        {action ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className={cn(
              "h-auto px-0 text-xs",
              (warning || danger) && "text-primary",
            )}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ) : null}
        {toggle ? (
          <Switch
            checked={toggle.checked}
            disabled={toggle.disabled}
            onCheckedChange={toggle.onCheckedChange}
          />
        ) : null}
        {onConfigure ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={onConfigure}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only">Configure {label}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
