"use client";

import * as React from "react";
import { format, subDays } from "date-fns";
import { type DateRange } from "react-day-picker";
import { CalendarIcon, RefreshCw, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  CANCELLED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  CREDITED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

function StatusPill({ s }: { s: string }) {
  return (
    <span className={cn("inline-flex px-2 py-0.5 rounded text-[11px] font-semibold",
      STATUS_COLORS[s] ?? "bg-muted text-muted-foreground")}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

export default function NiscInvoicesReportPage() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30), to: new Date(),
  });
  const [open, setOpen] = React.useState(false);
  const filters = { from: dateRange?.from ?? subDays(new Date(), 30), to: dateRange?.to ?? new Date() };

  const statusSummary = trpc.niscReports.invoices.statusSummary.useQuery(filters, { staleTime: 120_000 });
  const invoiceList = trpc.niscReports.invoices.list.useQuery({ ...filters, pageSize: 25 }, { staleTime: 120_000 });
  const cycleTime = trpc.niscReports.invoices.cycleTime.useQuery(filters, { staleTime: 120_000 });
  const creditNotes = trpc.niscReports.invoices.creditNotes.useQuery({ ...filters, pageSize: 25 }, { staleTime: 120_000 });
  const kra = trpc.niscReports.invoices.kraCompliance.useQuery({ ...filters, pageSize: 25 }, { staleTime: 120_000 });

  const utils = trpc.useUtils();
  const refresh = () => void utils.niscReports.invoices.invalidate();

  return (
    <div className="flex flex-col gap-6 px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-widest">Nisc Sales Reporting</p>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Invoicing Reports</h1>
        <p className="text-sm text-muted-foreground">Status summary, invoice list, cycle times, credit notes and KRA/eTIMS compliance.</p>
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
          onClick={refresh} disabled={statusSummary.isFetching}>
          <RefreshCw className={cn("h-4 w-4", statusSummary.isFetching && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="status">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1 mb-6">
          <TabsTrigger value="status">Status Summary</TabsTrigger>
          <TabsTrigger value="list">Invoice List</TabsTrigger>
          <TabsTrigger value="cycle">Cycle Time</TabsTrigger>
          <TabsTrigger value="credit">Credit Notes</TabsTrigger>
          <TabsTrigger value="kra">KRA / eTIMS</TabsTrigger>
        </TabsList>

        {/* ─── I-01 STATUS SUMMARY ──────────────────────────────────────── */}
        <TabsContent value="status">
          {statusSummary.isLoading ? <Skeleton className="h-64" /> : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(statusSummary.data ?? []).map(s => (
                <Card key={s.status} className="border-border/50 shadow-none">
                  <CardContent className="p-4">
                    <StatusPill s={s.status} />
                    <p className="text-xl font-bold mt-2">{fmt(s.amount)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.count} invoices</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── I-02 INVOICE LIST ────────────────────────────────────────── */}
        <TabsContent value="list">
          <Card className="border-border/50 shadow-none">
            <CardContent className="p-0 overflow-x-auto">
              {invoiceList.isLoading ? <div className="p-6"><Skeleton className="h-48" /></div> : (
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/30">
                    <tr className="text-left">
                      {["Invoice #", "Client", "Amount", "Status", "Issue Date", "Due Date", "Paid At", "KRA"].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {(invoiceList.data?.rows ?? []).map(inv => (
                      <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{inv.invoiceNumber ?? " "}</td>
                        <td className="px-4 py-2.5 font-medium max-w-[140px] truncate">{(inv as any).teamName ?? " "}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold">{fmt(inv.amount)}</td>
                        <td className="px-4 py-2.5"><StatusPill s={inv.status} /></td>
                        <td className="px-4 py-2.5 text-xs">{inv.issueDate ? format(inv.issueDate, "MMM dd, yyyy") : " "}</td>
                        <td className="px-4 py-2.5 text-xs">{inv.dueDate ? format(inv.dueDate, "MMM dd, yyyy") : " "}</td>
                        <td className="px-4 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">{inv.paidAt ? format(inv.paidAt, "MMM dd") : " "}</td>
                        <td className="px-4 py-2.5 text-xs">
                          {inv.kraStatus
                            ? <span className="inline-flex items-center gap-1">
                              {inv.kraStatus === "VERIFIED" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                              {inv.kraStatus}
                            </span>
                            : <span className="text-muted-foreground"> </span>}
                        </td>
                      </tr>
                    ))}
                    {(invoiceList.data?.rows ?? []).length === 0 && (
                      <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm italic">No invoices for this period</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {invoiceList.data && (
                <p className="text-xs text-muted-foreground p-4">Showing {invoiceList.data.rows.length} of {invoiceList.data.total} invoices</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── I-03 CYCLE TIME ──────────────────────────────────────────── */}
        <TabsContent value="cycle">
          {cycleTime.isLoading ? <Skeleton className="h-48" /> : cycleTime.data && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Avg Time in Draft (before send)", value: `${cycleTime.data.avgTimeInDraftDays}d`, desc: "Days from created → sent" },
                { label: "Avg Time to Pay", value: `${cycleTime.data.avgTimeToPay}d`, desc: "Days from sent → paid" },
                { label: "Paid On Time", value: `${cycleTime.data.paidOnTimePercent.toFixed(1)}%`, desc: "Paid before or on due date" },
                { label: "Currently in Draft", value: String(cycleTime.data.currentlyInDraftCount), desc: "Not yet sent to any client" },
                { label: "Draft Value", value: fmt(cycleTime.data.currentlyInDraftAmount), desc: "Total value of draft invoices" },
              ].map(m => (
                <Card key={m.label} className="border-border/50 shadow-none">
                  <CardContent className="p-5">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{m.label}</p>
                    <p className="text-2xl font-bold mt-1">{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── I-04 CREDIT NOTES ────────────────────────────────────────── */}
        <TabsContent value="credit">
          {creditNotes.isLoading ? <Skeleton className="h-48" /> : creditNotes.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-border/50 shadow-none"><CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Issued</p>
                  <p className="text-2xl font-bold mt-1">{fmt(creditNotes.data.totalIssued)}</p>
                </CardContent></Card>
                <Card className="border-border/50 shadow-none"><CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Applied</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{fmt(creditNotes.data.totalApplied)}</p>
                </CardContent></Card>
                <Card className="border-border/50 shadow-none"><CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{fmt(creditNotes.data.totalPending)}</p>
                </CardContent></Card>
              </div>
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        {["Credit #", "Client", "Amount", "Reason", "Status", "Issued At"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {creditNotes.data.rows.map(cn => (
                        <tr key={cn.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs">{cn.creditNumber ?? " "}</td>
                          <td className="px-4 py-2.5 font-medium">{cn.teamName ?? " "}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold">{fmt(cn.amount)}</td>
                          <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{cn.reason ?? " "}</td>
                          <td className="px-4 py-2.5"><StatusPill s={cn.status} /></td>
                          <td className="px-4 py-2.5 text-xs">{cn.issuedAt ? format(cn.issuedAt, "MMM dd, yyyy") : " "}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ─── I-05 KRA ─────────────────────────────────────────────────── */}
        <TabsContent value="kra">
          {kra.isLoading ? <Skeleton className="h-48" /> : kra.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Verified", value: kra.data.buckets.VERIFIED, icon: <CheckCircle2 className="h-4 w-4" />, color: "emerald" },
                  { label: "Pending", value: kra.data.buckets.PENDING, icon: <Clock className="h-4 w-4" />, color: "amber" },
                  { label: "Failed / Error", value: kra.data.buckets.FAILED, icon: <XCircle className="h-4 w-4" />, color: "red" },
                  { label: "Not Submitted", value: kra.data.buckets.NOT_SUBMITTED, icon: <AlertCircle className="h-4 w-4" />, color: "slate" },
                ].map(b => (
                  <Card key={b.label} className="border-border/50 shadow-none">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg shrink-0",
                        b.color === "emerald" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          b.color === "amber" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                            b.color === "red" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
                              "bg-muted text-muted-foreground"
                      )}>{b.icon}</div>
                      <div>
                        <p className="text-xl font-bold">{b.value}</p>
                        <p className="text-xs text-muted-foreground">{b.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        {["Invoice #", "Client", "Amount", "KRA Status", "KRA Invoice #", "KRA Receipt #", "Verified At"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {kra.data.rows.map(r => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-mono text-xs">{r.invoiceNumber ?? " "}</td>
                          <td className="px-4 py-2.5 font-medium max-w-[140px] truncate">{r.teamName ?? " "}</td>
                          <td className="px-4 py-2.5 font-mono">{fmt(r.amount)}</td>
                          <td className="px-4 py-2.5">
                            {r.kraStatus
                              ? <span className={cn("text-xs font-semibold",
                                r.kraStatus === "VERIFIED" ? "text-emerald-600 dark:text-emerald-400" :
                                  r.kraStatus === "FAILED" ? "text-red-600 dark:text-red-400" :
                                    "text-amber-600 dark:text-amber-400"
                              )}>{r.kraStatus}</span>
                              : <span className="text-xs text-muted-foreground">Not Submitted</span>}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs">{r.kraInvoiceNumber ?? " "}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">{r.kraReceiptNumber ?? " "}</td>
                          <td className="px-4 py-2.5 text-xs">{r.kraVerifiedDate ? format(r.kraVerifiedDate, "MMM dd, yyyy") : " "}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
