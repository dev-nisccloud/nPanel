"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, RefreshCw, TrendingUp, TrendingDown, Users, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const SUB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  EXPIRED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  SUSPENDED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  UPGRADED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  DOWNGRADED: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

export default function NiscSubscriptionsReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const filters = { from: dateRange?.from ?? subDays(new Date(), 30), to: dateRange?.to ?? new Date() };

  const mrrDash = trpc.niscReports.subscriptions.mrrDashboard.useQuery(filters, { staleTime: 120_000 });
  const movement = trpc.niscReports.subscriptions.mrrMovement.useQuery(filters, { staleTime: 120_000 });
  const statuses = trpc.niscReports.subscriptions.statusSummary.useQuery(filters, { staleTime: 120_000 });
  const list = trpc.niscReports.subscriptions.list.useQuery({ ...filters, pageSize: 25 }, { staleTime: 120_000 });
  const renewals = trpc.niscReports.subscriptions.renewalForecast.useQuery({ ...filters, withinDays: 90 }, { staleTime: 120_000 });
  const churn = trpc.niscReports.subscriptions.churn.useQuery(filters, { staleTime: 120_000 });
  const upgrades = trpc.niscReports.subscriptions.upgrades.useQuery(filters, { staleTime: 120_000 });

  const utils = trpc.useUtils();
  const refresh = () => void utils.niscReports.subscriptions.invalidate();

  const mrr = mrrDash.data;
  const mov = movement.data;

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions &amp; MRR</h1>
        <p className="text-sm text-muted-foreground">MRR dashboard, movement waterfall, churn, renewal forecast, and upgrade activity.</p>
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
          onClick={refresh} disabled={mrrDash.isFetching}>
          <RefreshCw className={cn("h-4 w-4", mrrDash.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="mrr">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 mb-6">
          <TabsTrigger value="mrr">MRR Dashboard</TabsTrigger>
          <TabsTrigger value="movement">MRR Movement</TabsTrigger>
          <TabsTrigger value="status">Status Summary</TabsTrigger>
          <TabsTrigger value="list">Subscription List</TabsTrigger>
          <TabsTrigger value="renewals">Renewals Due</TabsTrigger>
          <TabsTrigger value="churn">Churn</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
        </TabsList>

        {/* ─── S-01 MRR DASHBOARD ───────────────────────────────────────── */}
        <TabsContent value="mrr" className="space-y-6">
          {mrrDash.isLoading ? <Skeleton className="h-48" /> : mrr && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-border/50 shadow-none col-span-2 lg:col-span-1">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monthly Recurring Revenue</p>
                    <p className="text-3xl font-bold mt-1">{fmt(mrr.mrr)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ARR: {fmt(mrr.arr)}</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Active Subscriptions</p>
                    <p className="text-3xl font-bold mt-1">{mrr.totalActive}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">ACTIVE status only</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg MRR / Subscription</p>
                    <p className="text-3xl font-bold mt-1">{fmt(mrr.totalActive > 0 ? mrr.mrr / mrr.totalActive : 0)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Per active subscription</p>
                  </CardContent>
                </Card>
              </div>

              {/* By Category */}
              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">MRR by Product Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mrr.byCategory.map(c => (
                      <div key={c.category} className="flex items-center gap-3">
                        <div className="w-24 text-xs font-semibold text-muted-foreground truncate">{c.category}</div>
                        <Progress value={mrr.mrr > 0 ? (c.mrr / mrr.mrr) * 100 : 0} className="flex-1 h-2" />
                        <div className="w-32 text-right font-mono text-sm font-semibold">{fmt(c.mrr)}</div>
                        <div className="w-12 text-right text-xs text-muted-foreground">{c.count}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Clients by MRR */}
              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Top Clients by MRR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/50">
                    {mrr.byClient.slice(0, 15).map(c => (
                      <div key={c.teamId} className="flex items-center justify-between py-2.5">
                        <span className="text-sm font-medium truncate max-w-[240px]">{c.teamName}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{c.count} subs</span>
                          <span className="font-mono font-semibold text-sm">{fmt(c.mrr)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ─── S-02 MRR MOVEMENT ────────────────────────────────────────── */}
        <TabsContent value="movement" className="space-y-6">
          {movement.isLoading ? <Skeleton className="h-48" /> : mov && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: "New MRR", value: mov.newMrr, icon: <TrendingUp className="h-4 w-4" />, color: "emerald" },
                  { label: "Expansion", value: mov.expansionMrr, icon: <ArrowUpRight className="h-4 w-4" />, color: "blue" },
                  { label: "Contraction", value: -mov.contractionMrr, icon: <ArrowDownRight className="h-4 w-4" />, color: "amber" },
                  { label: "Churned MRR", value: -mov.churnedMrr, icon: <TrendingDown className="h-4 w-4" />, color: "red" },
                  { label: "Net Change", value: mov.netChange, icon: <BarChart3 className="h-4 w-4" />, color: mov.netChange >= 0 ? "emerald" : "red" },
                ].map(m => {
                  const colorMap: Record<string, string> = {
                    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    red: "bg-red-500/10 text-red-600 dark:text-red-400",
                  };
                  return (
                    <Card key={m.label} className="border-border/50 shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                          <div className={cn("p-1.5 rounded-lg", colorMap[m.color] ?? "bg-muted text-muted-foreground")}>{m.icon}</div>
                        </div>
                        <p className={cn("text-xl font-bold", m.value >= 0 ? "" : "text-red-600 dark:text-red-400")}>
                          {m.value >= 0 ? "+" : ""}{fmt(m.value)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Period: {mov.periodLabel}</p>
            </>
          )}
        </TabsContent>

        {/* ─── S-03 STATUS SUMMARY ──────────────────────────────────────── */}
        <TabsContent value="status">
          {statuses.isLoading ? <Skeleton className="h-48" /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(statuses.data ?? []).map(s => (
                <Card key={s.status} className="border-border/50 shadow-none">
                  <CardContent className="p-4">
                    <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                      SUB_STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground")}>{s.status}</span>
                    <p className="text-xl font-bold mt-2">{s.count}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">MRR: {fmt(s.mrr)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── S-04 SUBSCRIPTION LIST ───────────────────────────────────── */}
        <TabsContent value="list">
          <Card className="border-border/50 shadow-none">
            <CardContent className="p-0 overflow-x-auto">
              {list.isLoading ? <div className="p-6"><Skeleton className="h-48" /></div> : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Client", "Product", "Status", "Billing Cycle", "MRR", "Next Renewal", "Expiry"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(list.data?.rows ?? []).map(s => (
                      <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{s.teamName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs max-w-[160px] truncate">{s.productName ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                            SUB_STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground")}>{s.status}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.billingCycle ?? "—"}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{fmt(s.mrr)}</td>
                        <td className="px-4 py-2.5 text-xs">{s.nextRenewalDate ? format(s.nextRenewalDate, "MMM dd, yyyy") : "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{s.expiryDate ? format(s.expiryDate, "MMM dd, yyyy") : "—"}</td>
                      </tr>
                    ))}
                    {(list.data?.rows ?? []).length === 0 && (
                      <tr><td colSpan={7} className="py-8 text-center text-muted-foreground text-sm italic">No subscriptions found</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {list.data && <p className="text-xs text-muted-foreground p-4">Showing {list.data.rows.length} of {list.data.total}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── S-05 RENEWALS DUE ────────────────────────────────────────── */}
        <TabsContent value="renewals">
          <Card className="border-border/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Renewals Due in Next 90 Days</CardTitle>
              <CardDescription className="text-xs">ACTIVE subscriptions with upcoming renewal dates</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {renewals.isLoading ? <div className="p-6"><Skeleton className="h-48" /></div> : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Client", "Product", "Renewal Date", "Days Away", "Expected Price", "Auto-Renew"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(renewals.data ?? []).map(r => (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{r.teamName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs max-w-[160px] truncate">{r.productName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{r.renewalDate ? format(r.renewalDate, "MMM dd, yyyy") : "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("font-bold text-sm", r.daysUntilRenewal <= 15 ? "text-red-600 dark:text-red-400" : r.daysUntilRenewal <= 30 ? "text-amber-600 dark:text-amber-400" : "")}>
                            {r.daysUntilRenewal}d
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{fmt(r.expectedPrice)}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                            r.autoRenew ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300")}>
                            {r.autoRenew ? "YES" : "NO"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(renewals.data ?? []).length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm italic">No renewals due in next 90 days</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── S-06 CHURN ───────────────────────────────────────────────── */}
        <TabsContent value="churn" className="space-y-4">
          {churn.isLoading ? <Skeleton className="h-48" /> : churn.data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/50 shadow-none"><CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Churned Subscriptions</p>
                  <p className="text-2xl font-bold mt-1">{churn.data.rows.length}</p>
                </CardContent></Card>
                <Card className="border-border/50 shadow-none"><CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">MRR Lost</p>
                  <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{fmt(churn.data.totalChurnedMrr)}</p>
                </CardContent></Card>
                <Card className="border-border/50 shadow-none"><CardContent className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Churn Rate</p>
                  <p className="text-2xl font-bold mt-1">{churn.data.churnRate.toFixed(1)}%</p>
                </CardContent></Card>
              </div>
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr className="text-left">
                        {["Client", "Product", "Churn Date", "Tenure", "MRR Lost"].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {churn.data.rows.map(r => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium truncate max-w-[160px]">{r.teamName ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs truncate max-w-[160px]">{r.productName ?? "—"}</td>
                          <td className="px-4 py-2.5 text-xs">{format(r.churnDate, "MMM dd, yyyy")}</td>
                          <td className="px-4 py-2.5 text-xs font-mono">{r.tenureDays}d</td>
                          <td className="px-4 py-2.5 font-mono font-semibold text-red-600 dark:text-red-400">{fmt(r.mrrLost)}</td>
                        </tr>
                      ))}
                      {churn.data.rows.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm italic">No churn in this period — great!</td></tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ─── S-07 UPGRADES ────────────────────────────────────────────── */}
        <TabsContent value="upgrades">
          <Card className="border-border/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Upgrades &amp; Downgrades</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {upgrades.isLoading ? <div className="p-6"><Skeleton className="h-48" /></div> : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Client", "Product", "Type", "MRR Impact", "Event Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(upgrades.data ?? []).map(r => (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium truncate max-w-[160px]">{r.teamName ?? "—"}</td>
                        <td className="px-4 py-2.5 text-xs truncate max-w-[160px]">{r.productName ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                            r.changeType === "UPGRADE" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300")}>
                            {r.changeType}
                          </span>
                        </td>
                        <td className={cn("px-4 py-2.5 font-mono font-semibold", r.priceDelta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                          {r.priceDelta >= 0 ? "+" : ""}{fmt(r.priceDelta)}
                        </td>
                        <td className="px-4 py-2.5 text-xs">{format(r.eventDate, "MMM dd, yyyy")}</td>
                      </tr>
                    ))}
                    {(upgrades.data ?? []).length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm italic">No upgrades or downgrades in this period</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
