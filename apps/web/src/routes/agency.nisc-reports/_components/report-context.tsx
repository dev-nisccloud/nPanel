"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { trpc } from "@/utils/trpc";

export type NiscReportFilters = { from: Date; to: Date };

const ReportFiltersContext = React.createContext<{
  filters: NiscReportFilters;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  dateLabel: string;
  refreshAll: () => void;
  isRefreshing: boolean;
} | null>(null);

export function NiscReportProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const filters: NiscReportFilters = {
    from: dateRange?.from ?? subDays(new Date(), 30),
    to: dateRange?.to ?? new Date(),
  };

  const utils = trpc.useUtils();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refreshAll = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        utils.niscReports.revenue.invalidate(),
        utils.niscReports.invoices.invalidate(),
        utils.niscReports.quotations.invalidate(),
        utils.niscReports.subscriptions.invalidate(),
        utils.niscReports.clients.invalidate(),
        utils.niscReports.profitability.invalidate(),
        utils.niscReports.payments.invalidate(),
        utils.niscReports.tax.invalidate(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [utils]);

  const dateLabel =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, "MMM dd")} – ${format(dateRange.to, "MMM dd, yyyy")}`
      : "Pick a date range";

  return (
    <ReportFiltersContext.Provider
      value={{ filters, dateRange, setDateRange, dateLabel, refreshAll, isRefreshing }}
    >
      {children}
    </ReportFiltersContext.Provider>
  );
}

export function useNiscReportFilters() {
  const ctx = React.useContext(ReportFiltersContext);
  if (!ctx) throw new Error("useNiscReportFilters must be used within NiscReportProvider");
  return ctx;
}

export const NISC_STALE_TIME = 120_000;
