import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils.ts";

type Option = { value: string; label: string };

/** Filter and sort controls above a plan list. On phones the filters fold behind one button. */
export function PlanFilterBar({
  resultText,
  activeCount,
  onClear,
  sort,
  children,
}: {
  resultText: string;
  activeCount: number;
  onClear: () => void;
  sort?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();

  return (
    <div className="mb-6 rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 text-base font-medium text-foreground transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary md:hidden"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>
        <p className="hidden items-center gap-2 text-base font-medium text-foreground md:flex">
          <SlidersHorizontal className="size-4 text-primary dark:text-primary" aria-hidden />
          Filter
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {resultText}
          </p>
          {activeCount ? (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-primary"
            >
              Clear filters
            </button>
          ) : null}
          {sort}
        </div>
      </div>
      <div id={panelId} className={cn("mt-4 flex-wrap gap-x-6 gap-y-4 border-t border-border pt-4 md:flex", open ? "flex" : "hidden")}>
        {children}
      </div>
    </div>
  );
}

export function ChipGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 cursor-pointer rounded-full border px-3.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              option.value === value
                ? "border-primary bg-primary text-[#02070a]"
                : "border-border bg-background text-foreground hover:border-primary/50",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SelectFilter({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "text-sm font-medium text-muted-foreground"}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-40 cursor-pointer rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
