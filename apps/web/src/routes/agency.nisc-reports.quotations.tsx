"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  EXPIRED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function NiscQuotationsReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const filters = { from: dateRange?.from ?? subDays(new Date(), 30), to: dateRange?.to ?? new Date() };

  const pipeline = trpc.niscReports.quotations.pipeline.useQuery(filters, { staleTime: 120_000 });
  const funnel = trpc.niscReports.quotations.conversionFunnel.useQuery(filters, { staleTime: 120_000 });
  const list = trpc.niscReports.quotations.list.useQuery({ ...filters, pageSize: 25 }, { staleTime: 120_000 });

  const utils = trpc.useUtils();
  const refresh = () => void utils.niscReports.quotations.invalidate();

  const p = pipeline.data;

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Quotation Pipeline</h1>
        <p className="text-sm text-muted-foreground">Pipeline overview, conversion funnel, and full quotation list   all statuses included.</p>
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
          onClick={refresh} disabled={pipeline.isFetching}>
          <RefreshCw className={cn("h-4 w-4", pipeline.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 mb-6">
          <TabsTrigger value="pipeline">Pipeline Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="list">Quotation List</TabsTrigger>
        </TabsList>

        {/* ─── Q-01 PIPELINE OVERVIEW ───────────────────────────────────── */}
        <TabsContent value="pipeline" className="space-y-6">
          {pipeline.isLoading ? <Skeleton className="h-48" /> : p && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "In Preparation (DRAFT)", value: fmt(p.inPreparation), sub: `${p.byStatus.find(s => s.status === "DRAFT")?.count ?? 0} quotes`, color: "bg-slate-500/10 text-slate-600 dark:text-slate-300" },
                  { label: "Active Pipeline (SENT)", value: fmt(p.activePipeline), sub: `${p.byStatus.find(s => s.status === "SENT")?.count ?? 0} quotes`, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                  { label: "Won (ACCEPTED)", value: fmt(p.wonValue), sub: `${p.byStatus.find(s => s.status === "ACCEPTED")?.count ?? 0} quotes`, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                  { label: "Lost (REJ + EXP)", value: fmt(p.lostValue + p.expiredValue), sub: "Rejected + expired", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
                ].map(m => (
                  <Card key={m.label} className="border-border/50 shadow-none">
                    <CardContent className="p-5">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                      <p className="text-2xl font-bold mt-1">{m.value}</p>
                      <p className={cn("text-xs font-semibold mt-1", m.color)}>{m.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Win Rate", value: `${p.winRate.toFixed(1)}%`, desc: "Accepted / (ACC+REJ+EXP)" },
                  { label: "Avg Quote Value", value: fmt(p.avgQuoteValue), desc: "Won quotes only" },
                  { label: "Avg Time to Decision", value: `${p.avgTimeToDecision}d`, desc: "From issue date to decision" },
                  { label: "Total by Status", value: `${p.byStatus.reduce((s, b) => s + b.count, 0)}`, desc: "All quotations in period" },
                ].map(m => (
                  <Card key={m.label} className="border-border/50 shadow-none">
                    <CardContent className="p-4">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{m.label}</p>
                      <p className="text-xl font-bold mt-1">{m.value}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* By Status detail */}
              <Card className="border-border/50 shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Breakdown by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/50">
                    {p.byStatus.map(s => (
                      <div key={s.status} className="flex items-center justify-between py-3 gap-4">
                        <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                          STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground")}>
                          {s.status}
                        </span>
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-muted-foreground">{s.count} quotes</span>
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

        {/* ─── Q-02 CONVERSION FUNNEL ───────────────────────────────────── */}
        <TabsContent value="funnel">
          {funnel.isLoading ? <Skeleton className="h-48" /> : (
            <div className="space-y-3 max-w-2xl">
              {(funnel.data ?? []).map((stage, i) => {
                const maxCount = Math.max(...(funnel.data ?? []).map(s => s.count), 1);
                return (
                  <Card key={stage.stage} className="border-border/50 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">{i + 1}.</span>
                          <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                            STATUS_COLORS[stage.stage] ?? "bg-muted text-muted-foreground")}>
                            {stage.stage}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-mono font-semibold">{stage.count} quotes</span>
                          <span className="font-mono text-muted-foreground">{fmt(stage.amount)}</span>
                        </div>
                      </div>
                      <Progress value={(stage.count / maxCount) * 100} className="h-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ─── Q-03 QUOTATION LIST ──────────────────────────────────────── */}
        <TabsContent value="list">
          <Card className="border-border/50 shadow-none">
            <CardContent className="p-0 overflow-x-auto">
              {list.isLoading ? <div className="p-6"><Skeleton className="h-48" /></div> : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Quote #", "Customer", "Amount", "Status", "Issue Date", "Created By"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(list.data?.rows ?? []).map(q => (
                      <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{q.quotationNumber ?? " "}</td>
                        <td className="px-4 py-2.5 font-medium max-w-[160px] truncate">{q.customerName ?? " "}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{fmt(q.amount)}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
                            STATUS_COLORS[q.status] ?? "bg-muted text-muted-foreground")}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs">{q.issueDate ? format(q.issueDate, "MMM dd, yyyy") : " "}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">{q.createdBy.slice(0, 8)}…</td>
                      </tr>
                    ))}
                    {(list.data?.rows ?? []).length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm italic">No quotations for this period</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {list.data && (
                <p className="text-xs text-muted-foreground p-4">Showing {list.data.rows.length} of {list.data.total} quotations</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
