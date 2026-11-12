import type { ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export function StoryRows({
  rows,
  active,
}: {
  rows: { label: string; detail: string; status?: ReactNode }[];
  active?: number;
}) {
  return (
    <div className="divide-y divide-border/70">
      {rows.map((row, index) => (
        <div
          key={row.label}
          className={cn(
            "flex min-h-10 items-center gap-2 px-2 py-2 transition-colors",
            active === index && "bg-primary/[0.07]",
          )}
        >
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md border text-[9px]",
              active === index
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground",
            )}
          >
            {active !== undefined && index <= active ? <Check className="size-3" /> : index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[10px] font-semibold text-foreground">{row.label}</span>
            <span className="block truncate text-[8px] text-muted-foreground">{row.detail}</span>
          </span>
          {row.status ?? <ChevronRight className="size-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  );
}

export function StoryStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/80 p-2">
      <p className="text-[8px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-bold text-foreground">{value}</p>
      {detail && <p className="truncate text-[8px] text-muted-foreground">{detail}</p>}
    </div>
  );
}

export function StatusLine({
  children,
  tone = "sky",
}: {
  children: ReactNode;
  tone?: "sky" | "green" | "amber";
}) {
  const toneClass = {
    sky: "bg-[#38b6ff]",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
  }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-medium text-foreground">
      <span className={cn("size-1.5 rounded-full", toneClass)} />
      {children}
    </span>
  );
}
