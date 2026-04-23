"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, RefreshCw } from "lucide-react";
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

export default function NiscClientsReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const filters = { from: dateRange?.from ?? subDays(new Date(), 30), to: dateRange?.to ?? new Date() };

  const summary = trpc.niscReports.clients.summary.useQuery(filters, { staleTime: 120_000 });
  const cohort = trpc.niscReports.clients.cohortRetention.useQuery(filters, { staleTime: 120_000 });
  const newReturn = trpc.niscReports.clients.newVsReturning.useQuery(filters, { staleTime: 120_000 });

  const utils = trpc.useUtils();
  const refresh = () => void utils.niscReports.clients.invalidate();

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Client Intelligence</h1>
        <p className="text-sm text-muted-foreground">360° client financials, cohort retention, and new vs returning client breakdown.</p>
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
          onClick={refresh} disabled={summary.isFetching}>
          <RefreshCw className={cn("h-4 w-4", summary.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 mb-6">
          <TabsTrigger value="summary">Client Summary</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Retention</TabsTrigger>
          <TabsTrigger value="newreturn">New vs Returning</TabsTrigger>
        </TabsList>

        {/* ─── C-01 CLIENT SUMMARY ──────────────────────────────────────── */}
        <TabsContent value="summary">
          <Card className="border-border/50 shadow-none">
            <CardContent className="p-0 overflow-x-auto">
              {summary.isLoading ? <div className="p-6"><Skeleton className="h-64" /></div> : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Client", "Invoiced", "Paid", "Outstanding", "Active Subs", "MRR", "Orders", "Pipeline"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(summary.data ?? []).map(c => (
                      <tr key={c.teamId} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{c.teamName}</td>
                        <td className="px-4 py-2.5 font-mono">{fmt(c.totalInvoiced)}</td>
                        <td className="px-4 py-2.5 font-mono text-emerald-600 dark:text-emerald-400">{fmt(c.totalPaid)}</td>
                        <td className="px-4 py-2.5 font-mono text-amber-600 dark:text-amber-400">{fmt(c.outstanding)}</td>
                        <td className="px-4 py-2.5 font-mono text-center">{c.activeSubs}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{fmt(c.mrr)}</td>
                        <td className="px-4 py-2.5 font-mono text-center">{c.totalOrders}</td>
                        <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400">{fmt(c.pipelineValue)}</td>
                      </tr>
                    ))}
                    {(summary.data ?? []).length === 0 && (
                      <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm italic">No client data for this period</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── C-02 COHORT RETENTION ────────────────────────────────────── */}
        <TabsContent value="cohort">
          <Card className="border-border/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Subscription Cohort Retention</CardTitle>
              <CardDescription className="text-xs">How many subscriptions from each cohort month are still active after 1, 3, 6, and 12 months</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {cohort.isLoading ? <div className="p-6"><Skeleton className="h-48" /></div> : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Cohort", "Started", "1 Month", "3 Months", "6 Months", "12 Months"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(cohort.data ?? []).map(c => {
                      const pct = (n: number) => c.startCount > 0 ? Math.round((n / c.startCount) * 100) : 0;
                      return (
                        <tr key={c.cohortMonth} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-mono font-semibold">{c.cohortMonth}</td>
                          <td className="px-4 py-2.5 font-mono">{c.startCount}</td>
                          {[c.at1Month, c.at3Months, c.at6Months, c.at12Months].map((v, i) => (
                            <td key={i} className="px-4 py-2.5">
                              {v === -1
                                ? <span className="text-xs text-muted-foreground"> </span>
                                : <span className={cn("font-mono font-semibold", pct(v) >= 80 ? "text-emerald-600 dark:text-emerald-400" : pct(v) >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                                  {v} <span className="font-normal text-xs text-muted-foreground">({pct(v)}%)</span>
                                </span>}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                    {(cohort.data ?? []).length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm italic">No cohort data   subscriptions will appear here as they age</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── C-03 NEW vs RETURNING ────────────────────────────────────── */}
        <TabsContent value="newreturn" className="space-y-4">
          {newReturn.isLoading ? <Skeleton className="h-48" /> : newReturn.data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "New Clients", value: String(newReturn.data.newClients), sub: "First invoice in period", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                  { label: "New Client Revenue", value: fmt(newReturn.data.newClientsRevenue), sub: "Paid invoices from new clients", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                  { label: "Returning Clients", value: String(newReturn.data.returningClients), sub: "Had invoices before this period", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                  { label: "Returning Revenue", value: fmt(newReturn.data.returningClientsRevenue), sub: "Paid invoices from returning", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                ].map(m => (
                  <Card key={m.label} className="border-border/50 shadow-none">
                    <CardContent className="p-5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                      <p className="text-2xl font-bold mt-1">{m.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">Period: {newReturn.data.periodLabel}</div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
