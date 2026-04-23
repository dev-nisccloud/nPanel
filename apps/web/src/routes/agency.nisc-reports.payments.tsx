"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, RefreshCw, AlertCircle } from "lucide-react";
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

export default function NiscPaymentsReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const filters = { from: dateRange?.from ?? subDays(new Date(), 30), to: dateRange?.to ?? new Date() };

  const methods = trpc.niscReports.payments.methodBreakdown.useQuery(filters, { staleTime: 120_000 });
  const perf = trpc.niscReports.payments.gatewayPerf.useQuery(filters, { staleTime: 120_000 });
  const pending = trpc.niscReports.payments.failedPending.useQuery({ ...filters, pageSize: 50 }, { staleTime: 120_000 });
  const refunds = trpc.niscReports.payments.refunds.useQuery({ ...filters, pageSize: 50 }, { staleTime: 120_000 });

  const utils = trpc.useUtils();
  const refresh = () => void utils.niscReports.payments.invalidate();

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Payments &amp; Collections</h1>
        <p className="text-sm text-muted-foreground">Payment method distribution, gateway performance, failures, and refunds.</p>
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
          onClick={refresh} disabled={methods.isFetching}>
          <RefreshCw className={cn("h-4 w-4", methods.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="methods">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 mb-6">
          <TabsTrigger value="methods">Method Breakdown</TabsTrigger>
          <TabsTrigger value="perf">Gateway Perf</TabsTrigger>
          <TabsTrigger value="pending">Failed &amp; Pending</TabsTrigger>
          <TabsTrigger value="refunds">Refunds</TabsTrigger>
        </TabsList>

        {/* ─── PY-01 METHOD BREAKDOWN ───────────────────────────────────── */}
        <TabsContent value="methods" className="space-y-4">
          {methods.isLoading ? <Skeleton className="h-48" /> : (
            <Card className="border-border/50 shadow-none max-w-3xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Payment Methods Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(methods.data ?? []).map(m => (
                    <div key={m.method} className="flex items-center gap-4">
                      <div className="w-32 font-semibold text-sm truncate uppercase tracking-widest">{m.method}</div>
                      <Progress value={m.percentOfTotal} className="flex-1 h-2" />
                      <div className="w-28 text-right font-mono font-semibold">{fmt(m.amount)}</div>
                      <div className="w-16 text-right text-xs text-muted-foreground">{m.count} tx</div>
                      <div className="w-12 text-right text-xs font-mono">{m.percentOfTotal.toFixed(1)}%</div>
                    </div>
                  ))}
                  {(methods.data ?? []).length === 0 && (
                    <div className="py-8 text-center text-muted-foreground text-sm italic">No successful payments in this period</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── PY-02 GATEWAY PERF ───────────────────────────────────────── */}
        <TabsContent value="perf" className="space-y-4">
          {perf.isLoading ? <Skeleton className="h-48" /> : (
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Gateway", "Total Trx", "Completed", "Failed", "Refunded", "Success Rate", "Avg Processing Time"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(perf.data ?? []).map(g => (
                      <tr key={g.gateway} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-bold uppercase tracking-widest text-xs">{g.gateway}</td>
                        <td className="px-4 py-2.5 font-mono">{g.totalInitiated}</td>
                        <td className="px-4 py-2.5 font-mono text-emerald-600 dark:text-emerald-400">{g.totalCompleted}</td>
                        <td className="px-4 py-2.5 font-mono text-red-600 dark:text-red-400">{g.totalFailed}</td>
                        <td className="px-4 py-2.5 font-mono text-purple-600 dark:text-purple-400">{g.totalRefunded}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("font-mono font-bold", g.successRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : g.successRate >= 70 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400")}>
                            {g.successRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{g.avgProcessingMinutes.toFixed(1)} min</td>
                      </tr>
                    ))}
                    {(perf.data ?? []).length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm italic">No gateway activity in this period</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── PY-03 FAILED & PENDING ───────────────────────────────────── */}
        <TabsContent value="pending" className="space-y-4">
          {pending.isLoading ? <Skeleton className="h-48" /> : pending.data && (
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Initiated At", "Gateway", "Client", "Phone", "Amount", "Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {pending.data.rows.map(r => (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 text-xs">{format(r.initiatedAt, "MMM dd HH:mm")}</td>
                        <td className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px]">{r.gateway}</td>
                        <td className="px-4 py-2.5 font-medium max-w-[140px] truncate">{r.teamName ?? " "}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{r.phoneNumber ?? " "}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{fmt(r.amount)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                              r.status === "FAILED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                            )}>
                              {r.status}
                            </span>
                            {r.flagged && <AlertCircle className="h-3.5 w-3.5 text-red-500" title="Stuck pending for >24 hours" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pending.data.rows.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm italic">No failed or pending transactions</td></tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── PY-04 REFUNDS ────────────────────────────────────────────── */}
        <TabsContent value="refunds" className="space-y-4">
          {refunds.isLoading ? <Skeleton className="h-48" /> : refunds.data && (
            <>
              <Card className="border-border/50 shadow-none max-w-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Refunded</p>
                  <p className="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{fmt(refunds.data.totalRefunded)}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr className="text-left">
                        {["Refunded At", "Gateway", "Client", "Receipt #", "Amount"].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {refunds.data.rows.map(r => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 text-xs">{r.refundedAt ? format(r.refundedAt, "MMM dd HH:mm") : " "}</td>
                          <td className="px-4 py-2.5 font-bold uppercase tracking-widest text-[10px]">{r.gateway}</td>
                          <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{r.teamName ?? " "}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.receiptNumber ?? " "}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold text-purple-600 dark:text-purple-400">{fmt(r.amount)}</td>
                        </tr>
                      ))}
                      {refunds.data.rows.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm italic">No refunds in this period</td></tr>
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
