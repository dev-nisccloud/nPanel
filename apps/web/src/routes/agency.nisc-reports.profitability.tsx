"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, RefreshCw, TrendingUp } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function NiscProfitabilityReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const filters = { from: dateRange?.from ?? subDays(new Date(), 30), to: dateRange?.to ?? new Date() };

  const margin = trpc.niscReports.profitability.grossMargin.useQuery({ ...filters, pageSize: 50 }, { staleTime: 120_000 });
  const commission = trpc.niscReports.profitability.commission.useQuery({ ...filters, pageSize: 50 }, { staleTime: 120_000 });

  const utils = trpc.useUtils();
  const refresh = () => void utils.niscReports.profitability.invalidate();

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Profitability</h1>
        <p className="text-sm text-muted-foreground">Gross margin by subscription, commission entries and revenue/cost analysis.</p>
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
              defaultMonth={dateRange?.from} numberOfMonths={2} disabled={d => d > new Date()} />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" className="h-9 w-9 shadow-none border-border/60"
          onClick={refresh} disabled={margin.isFetching}>
          <RefreshCw className={cn("h-4 w-4", margin.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="margin">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 mb-6">
          <TabsTrigger value="margin">Gross Margin</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
        </TabsList>

        {/* ─── M-01 GROSS MARGIN ────────────────────────────────────────── */}
        <TabsContent value="margin" className="space-y-4">
          {margin.isLoading ? <Skeleton className="h-48" /> : margin.data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/50 shadow-none"><CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total MRR (Active)</p>
                  <p className="text-2xl font-bold mt-1">{fmt(margin.data.totalRevenue)}</p>
                </CardContent></Card>
                <Card className="border-border/50 shadow-none"><CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Cost</p>
                  <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{fmt(margin.data.totalCost)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">0 if agreedCost not set</p>
                </CardContent></Card>
                <Card className="border-border/50 shadow-none"><CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg Gross Margin %</p>
                  <p className={cn("text-2xl font-bold mt-1",
                    margin.data.avgMarginPct >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                    {margin.data.avgMarginPct.toFixed(1)}%
                  </p>
                </CardContent></Card>
              </div>
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr className="text-left">
                        {["Client", "Product", "Category", "Billing", "Revenue (MRR)", "Cost", "Gross Margin", "Margin %"].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {margin.data.rows.map(r => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium max-w-[140px] truncate">{r.teamName ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs max-w-[140px] truncate">{r.productName ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.category ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.billingCycle ?? "—"}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold">{fmt(r.revenue)}</td>
                          <td className="px-4 py-2.5 font-mono text-red-600 dark:text-red-400">{fmt(r.cost)}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fmt(r.grossMargin)}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Progress value={r.marginPct} className="h-1.5 w-16" />
                              <span className="font-mono text-xs">{r.marginPct.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {margin.data.rows.length === 0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm italic">No active FIXED-price subscriptions found</td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ─── M-02 COMMISSION ──────────────────────────────────────────── */}
        <TabsContent value="commission" className="space-y-4">
          {commission.isLoading ? <Skeleton className="h-48" /> : commission.data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Earned", value: fmt(commission.data.totalEarned), color: "" },
                  { label: "Billed", value: fmt(commission.data.totalBilled), color: "text-blue-600 dark:text-blue-400" },
                  { label: "Paid", value: fmt(commission.data.totalPaid), color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Pending", value: fmt(commission.data.totalPending), color: "text-amber-600 dark:text-amber-400" },
                ].map(m => (
                  <Card key={m.label} className="border-border/50 shadow-none">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{m.label}</p>
                      <p className={cn("text-xl font-bold mt-1", m.color)}>{m.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr className="text-left">
                        {["Client", "Period", "Base Amount", "Rate", "Commission", "Status"].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {commission.data.rows.map(r => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{r.teamName ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.period ?? "—"}</td>
                          <td className="px-4 py-2.5 font-mono">{fmt(r.baseAmount)}</td>
                          <td className="px-4 py-2.5 font-mono">{r.commissionRate.toFixed(2)}%</td>
                          <td className="px-4 py-2.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">{fmt(r.commissionAmount)}</td>
                          <td className="px-4 py-2.5 text-xs">{r.status}</td>
                        </tr>
                      ))}
                      {commission.data.rows.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm italic">No commission entries for this period</td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
