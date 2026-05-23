"use client";

import * as React from "react";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useNiscReportFilters } from "./report-context";
import { SectionNav } from "./section-nav";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { dateRange, setDateRange, dateLabel, refreshAll, isRefreshing } = useNiscReportFilters();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto xl:pr-44">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-border pb-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Company Overview</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Live reports on system operations: revenue, billing, subscriptions, clients, payments, and compliance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:ml-4 sm:pt-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 shadow-none border-border/60">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium whitespace-nowrap">{dateLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                defaultMonth={dateRange?.from}
                numberOfMonths={2}
                disabled={(d) => d > new Date()}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shadow-none border-border/60"
            onClick={() => void refreshAll()}
            disabled={isRefreshing}
            aria-label="Refresh reports"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      <SectionNav />

      <div className="flex flex-col divide-y divide-border/60 [&>section]:py-10 [&>section:first-child]:pt-6">
        {children}
      </div>
    </div>
  );
}
