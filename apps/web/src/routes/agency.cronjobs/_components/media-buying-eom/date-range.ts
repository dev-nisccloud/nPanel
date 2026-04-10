"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";

export function useDefaultLast30DaysRange() {
  return React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
}

export function toTimeRange(dateRange: DateRange | undefined) {
  if (!dateRange?.from || !dateRange?.to) return undefined;
  return {
    since: format(dateRange.from, "yyyy-MM-dd"),
    until: format(dateRange.to, "yyyy-MM-dd"),
  };
}

