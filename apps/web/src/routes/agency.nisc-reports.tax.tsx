"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, RefreshCw, Layers } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";

function fmt(n: number, curr: string = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: curr, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function NiscTaxReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const filters = { from: dateRange?.from ?? subDays(new Date(), 30), to: dateRange?.to ?? new Date() };

  const tax = trpc.niscReports.tax.summary.useQuery(filters, { staleTime: 120_000 });
  const utils = trpc.useUtils();
  const refresh = () => void utils.niscReports.tax.invalidate();

  const d = tax.data;

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Tax &amp; VAT Liability</h1>
        <p className="text-sm text-muted-foreground">Cash-basis tax collected and pending liabilities from unpaid invoices.</p>
      </div>

      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 shadow-none border-border/60">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              {dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, "MMM dd")} – ${format(dateRange.to, "MMM dd, yyyy")}`
                : "Pick date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={dateRange} onSelect={setDateRange}
              defaultMonth={dateRange?.from} numberOfMonths={2} disabled={dt => dt > new Date()} />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" className="h-9 w-9 shadow-none border-border/60"
          onClick={refresh} disabled={tax.isFetching}>
          <RefreshCw className={cn("h-4 w-4", tax.isFetching && "animate-spin")} />
        </Button>
      </div>

      {d ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 shadow-none bg-emerald-50/50 dark:bg-emerald-900/10">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Collected Tax (All)</p>
                <p className="text-3xl font-bold mt-1">{fmt(d.taxCollected, d.currency)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">From PAID invoices</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Collected VAT Only</p>
                <p className="text-3xl font-bold mt-1">{fmt(d.vatCollected, d.currency)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">From PAID invoices</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Taxable Subtotal</p>
                <p className="text-3xl font-bold mt-1">{fmt(d.taxableAmount, d.currency)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Base amount of PAID invoices</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-5">
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pending Tax Liab.</p>
                <p className="text-3xl font-bold mt-1">{fmt(d.pendingTaxAmount, d.currency)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">From Draft/Sent/Overdue</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-none max-w-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Collected Tax by Rate
              </CardTitle>
              <CardDescription className="text-xs">Breakdown of the {fmt(d.taxCollected)} collected tax</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {d.byTaxRate.map(r => (
                  <div key={r.taxPercentage} className="flex items-center gap-4">
                    <div className="w-16 font-mono font-bold text-sm bg-muted/50 rounded text-center py-1">
                      {r.taxPercentage}%
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Taxable: {fmt(r.taxableAmount, d.currency)}</span>
                        <span className="font-semibold">{fmt(r.taxAmount, d.currency)}</span>
                      </div>
                      <Progress value={d.taxCollected > 0 ? (r.taxAmount / d.taxCollected) * 100 : 0} className="h-2" />
                    </div>
                    <div className="w-16 text-right text-xs text-muted-foreground">{r.count} inv</div>
                  </div>
                ))}
                {d.byTaxRate.length === 0 && (
                  <div className="py-4 text-center text-muted-foreground text-sm italic">No tax collected in this period</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" />
        </div>
      )}
    </div>
  );
}
