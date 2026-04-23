"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import {
  CalendarIcon, RefreshCw, TrendingUp, TrendingDown, DollarSign,
  AlertTriangle, Clock, BarChart2, Users, Receipt, CreditCard, FileText,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) { return `${n.toFixed(1)}%`; }

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    CANCELLED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    CREDITED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold", colors[status] ?? "bg-muted text-muted-foreground")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function KpiCard({ title, value, sub, icon, color = "primary" }: {
  title: string; value: string; sub?: string;
  icon: React.ReactNode; color?: "primary" | "emerald" | "red" | "amber" | "blue";
}) {
  const colors: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
  return (
    <Card className="border-border/50 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={cn("p-2 rounded-lg shrink-0", colors[color])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NiscRevenueReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [open, setOpen] = React.useState(false);

  const filters = {
    from: dateRange?.from ?? subDays(new Date(), 30),
    to: dateRange?.to ?? new Date(),
  };

  const overview = trpc.niscReports.revenue.overview.useQuery(filters, { staleTime: 2 * 60 * 1000 });
  const trend = trpc.niscReports.revenue.trend.useQuery(filters, { staleTime: 2 * 60 * 1000 });
  const byClient = trpc.niscReports.revenue.byClient.useQuery(filters, { staleTime: 2 * 60 * 1000 });
  const aging = trpc.niscReports.revenue.aging.useQuery(filters, { staleTime: 2 * 60 * 1000 });
  const outstanding = trpc.niscReports.revenue.outstandingList.useQuery(
    { ...filters, pageSize: 20 }, { staleTime: 2 * 60 * 1000 }
  );

  const utils = trpc.useUtils();
  const refresh = () => {
    void utils.niscReports.revenue.invalidate();
  };

  const ov = overview.data;
  const isLoading = overview.isLoading;

  const dateLabel = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "MMM dd")} – ${format(dateRange.to, "MMM dd, yyyy")}`
    : "Pick a date range";

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue &amp; Collections</h1>
        <p className="text-sm text-muted-foreground">Live-queried financials covering all invoice statuses, cash collected, and receivables.</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2 shadow-none border-border/60">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{dateLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={dateRange} onSelect={setDateRange}
              defaultMonth={dateRange?.from} numberOfMonths={2}
              disabled={d => d > new Date()} />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" className="h-9 w-9 shadow-none border-border/60"
          onClick={refresh} disabled={overview.isFetching}>
          <RefreshCw className={cn("h-4 w-4", overview.isFetching && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="clients">By Client</TabsTrigger>
            <TabsTrigger value="aging">A/R Aging</TabsTrigger>
            <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            {ov && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard title="Total Invoiced" value={fmt(ov.totalInvoiced)}
                    icon={<FileText className="h-5 w-5" />} />
                  <KpiCard title="Cash Collected" value={fmt(ov.collected)}
                    icon={<DollarSign className="h-5 w-5" />} color="emerald" />
                  <KpiCard title="Billed Unpaid" value={fmt(ov.billedUnpaid)}
                    icon={<Clock className="h-5 w-5" />} color="amber" />
                  <KpiCard title="In Draft" value={fmt(ov.inDraft)}
                    icon={<Receipt className="h-5 w-5" />} />
                  <KpiCard title="Net Collected" value={fmt(ov.netCollected)}
                    sub="After credit notes"
                    icon={<TrendingUp className="h-5 w-5" />} color="blue" />
                  <KpiCard title="Overdue / Outstanding" value={fmt(ov.outstanding)}
                    icon={<AlertTriangle className="h-5 w-5" />} color="red" />
                  <KpiCard title="Tax Collected" value={fmt(ov.taxCollected)}
                    icon={<BarChart2 className="h-5 w-5" />} />
                  <KpiCard title="Payment Rate" value={pct(ov.paymentRate)}
                    sub={`Avg invoice: ${fmt(ov.avgInvoiceValue)}`}
                    icon={<CreditCard className="h-5 w-5" />} color="emerald" />
                </div>

                {/* Status breakdown */}
                <Card className="border-border/50 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">
                      Invoice Breakdown by Status
                    </CardTitle>
                    <CardDescription className="text-xs">All statuses included   DRAFT documents are real business activity.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-border/50">
                      {ov.byStatus.map(s => (
                        <div key={s.status} className="flex items-center justify-between py-2.5 gap-4">
                          <StatusBadge status={s.status} />
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-muted-foreground">{s.count} invoices</span>
                            <span className="font-mono font-semibold">{fmt(s.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ─── TREND ────────────────────────────────────────────────────── */}
          <TabsContent value="trend" className="space-y-6">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Revenue Trend Over Time</CardTitle>
                <CardDescription className="text-xs">Invoiced vs. collected vs. draft by period</CardDescription>
              </CardHeader>
              <CardContent>
                {trend.isLoading ? <Skeleton className="h-48" /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-border">
                          <th className="pb-2 font-semibold text-muted-foreground text-xs pr-4">Period</th>
                          <th className="pb-2 font-semibold text-muted-foreground text-xs pr-4">Invoiced</th>
                          <th className="pb-2 font-semibold text-muted-foreground text-xs pr-4">Collected</th>
                          <th className="pb-2 font-semibold text-muted-foreground text-xs pr-4">Overdue</th>
                          <th className="pb-2 font-semibold text-muted-foreground text-xs pr-4">Draft</th>
                          <th className="pb-2 font-semibold text-muted-foreground text-xs"># Invoices</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {(trend.data ?? []).map(t => (
                          <tr key={t.period} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-4 font-medium">{t.period}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmt(t.invoiced)}</td>
                            <td className="py-2.5 pr-4 font-mono text-emerald-600 dark:text-emerald-400">{fmt(t.collected)}</td>
                            <td className="py-2.5 pr-4 font-mono text-red-600 dark:text-red-400">{fmt(t.overdue)}</td>
                            <td className="py-2.5 pr-4 font-mono text-muted-foreground">{fmt(t.draft)}</td>
                            <td className="py-2.5 font-mono">{t.invoiceCount}</td>
                          </tr>
                        ))}
                        {(trend.data ?? []).length === 0 && (
                          <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm italic">No data for this period</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── BY CLIENT ────────────────────────────────────────────────── */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Revenue by Client</CardTitle>
              </CardHeader>
              <CardContent>
                {byClient.isLoading ? <Skeleton className="h-48" /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          {["Client", "Invoiced", "Collected", "Outstanding", "Overdue", "Invoices", "Avg Days to Pay"].map(h => (
                            <th key={h} className="pb-2 pr-4 text-xs font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {(byClient.data ?? []).slice(0, 30).map(c => (
                          <tr key={c.teamId} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-4 font-medium max-w-[180px] truncate">{c.teamName}</td>
                            <td className="py-2.5 pr-4 font-mono">{fmt(c.totalInvoiced)}</td>
                            <td className="py-2.5 pr-4 font-mono text-emerald-600 dark:text-emerald-400">{fmt(c.totalCollected)}</td>
                            <td className="py-2.5 pr-4 font-mono text-amber-600 dark:text-amber-400">{fmt(c.outstanding)}</td>
                            <td className="py-2.5 pr-4 font-mono text-red-600 dark:text-red-400">{fmt(c.overdueAmount)}</td>
                            <td className="py-2.5 pr-4 font-mono">{c.invoiceCount}</td>
                            <td className="py-2.5 font-mono">{c.avgDaysToPay > 0 ? `${c.avgDaysToPay.toFixed(0)}d` : " "}</td>
                          </tr>
                        ))}
                        {(byClient.data ?? []).length === 0 && (
                          <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm italic">No data for this period</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── A/R AGING ────────────────────────────────────────────────── */}
          <TabsContent value="aging" className="space-y-6">
            {aging.isLoading ? <Skeleton className="h-64" /> : aging.data && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Current (not due)", ...aging.data.current, color: "emerald" },
                  { label: "1–30 days", ...aging.data.days1_30, color: "yellow" },
                  { label: "31–60 days", ...aging.data.days31_60, color: "orange" },
                  { label: "61–90 days", ...aging.data.days61_90, color: "red" },
                  { label: "91–120 days", ...aging.data.days91_120, color: "red" },
                  { label: "120+ days", ...aging.data.days120plus, color: "rose" },
                ].map(b => (
                  <Card key={b.label} className="border-border/50 shadow-none">
                    <CardContent className="p-4">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{b.label}</p>
                      <p className="text-xl font-bold mt-1">{fmt(b.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.count} invoices</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-5">
                <p className="text-sm font-bold">Total Outstanding: {aging.data ? fmt(aging.data.total.amount) : " "}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {aging.data?.total.count} invoices with SENT, OVERDUE, or PARTIALLY_PAID status
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── OUTSTANDING LIST ─────────────────────────────────────────── */}
          <TabsContent value="outstanding" className="space-y-6">
            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Outstanding Invoices</CardTitle>
                <CardDescription className="text-xs">Sorted by days overdue descending</CardDescription>
              </CardHeader>
              <CardContent>
                {outstanding.isLoading ? <Skeleton className="h-48" /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          {["Invoice #", "Client", "Amount", "Due Date", "Status", "Days Overdue"].map(h => (
                            <th key={h} className="pb-2 pr-4 text-xs font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {(outstanding.data?.rows ?? []).map(inv => (
                          <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{inv.invoiceNumber ?? " "}</td>
                            <td className="py-2.5 pr-4 font-medium max-w-[160px] truncate">{inv.teamName ?? " "}</td>
                            <td className="py-2.5 pr-4 font-mono font-semibold">{fmt(inv.amount)}</td>
                            <td className="py-2.5 pr-4 text-xs">{inv.dueDate ? format(inv.dueDate, "MMM dd, yyyy") : " "}</td>
                            <td className="py-2.5 pr-4"><StatusBadge status={inv.status} /></td>
                            <td className="py-2.5 font-mono font-bold text-red-600 dark:text-red-400">
                              {inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : " "}
                            </td>
                          </tr>
                        ))}
                        {(outstanding.data?.rows ?? []).length === 0 && (
                          <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm italic">No outstanding invoices</td></tr>
                        )}
                      </tbody>
                    </table>
                    {outstanding.data && outstanding.data.total > 20 && (
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Showing 20 of {outstanding.data.total}. Use filters to narrow results.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
