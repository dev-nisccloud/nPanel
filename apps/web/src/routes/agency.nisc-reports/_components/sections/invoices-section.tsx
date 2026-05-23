"use client";

import { format } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, StatusBadge, CollapsibleDetail } from "../primitives";
import { fmtKes } from "../utils";
import { NiscChartCard, StatusPieChart } from "../charts";

export function InvoicesSection() {
  const { filters } = useNiscReportFilters();
  const statusSummary = trpc.niscReports.invoices.statusSummary.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const invoiceList = trpc.niscReports.invoices.list.useQuery({ ...filters, pageSize: 25 }, { staleTime: NISC_STALE_TIME });
  const cycleTime = trpc.niscReports.invoices.cycleTime.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const creditNotes = trpc.niscReports.invoices.creditNotes.useQuery({ ...filters, pageSize: 25 }, { staleTime: NISC_STALE_TIME });
  const kra = trpc.niscReports.invoices.kraCompliance.useQuery({ ...filters, pageSize: 25 }, { staleTime: NISC_STALE_TIME });

  return (
    <NiscSection
      id="invoices"
      title="Invoicing"
      description="Status summary, cycle times, credit notes, and KRA/eTIMS compliance."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NiscChartCard title="Invoice status distribution" isLoading={statusSummary.isLoading}>
          <StatusPieChart
            data={(statusSummary.data ?? []).map((s) => ({ name: s.status, value: s.amount }))}
          />
        </NiscChartCard>
        {cycleTime.data && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Avg time in draft", value: `${cycleTime.data.avgTimeInDraftDays}d` },
              { label: "Avg time to pay", value: `${cycleTime.data.avgTimeToPay}d` },
              { label: "Paid on time", value: `${cycleTime.data.paidOnTimePercent.toFixed(1)}%` },
              { label: "Currently in draft", value: String(cycleTime.data.currentlyInDraftCount) },
            ].map((m) => (
              <Card key={m.label} className="border-border/50 shadow-none">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">{m.label}</p>
                  <p className="text-xl font-bold mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CollapsibleDetail title="Invoice list">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            {invoiceList.isLoading ? <Skeleton className="h-48 m-4" /> : (
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    {["Invoice #", "Client", "Amount", "Status", "Issue", "Due", "Paid", "KRA"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(invoiceList.data?.rows ?? []).map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs">{inv.invoiceNumber ?? "—"}</td>
                      <td className="px-4 py-2.5 truncate max-w-[140px]">{(inv as { teamName?: string }).teamName ?? "—"}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold">{fmtKes(inv.amount)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                      <td className="px-4 py-2.5 text-xs">{inv.issueDate ? format(inv.issueDate, "MMM dd") : "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{inv.dueDate ? format(inv.dueDate, "MMM dd") : "—"}</td>
                      <td className="px-4 py-2.5 text-xs text-emerald-600">{inv.paidAt ? format(inv.paidAt, "MMM dd") : "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{inv.kraStatus ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {invoiceList.data && (
              <p className="text-xs text-muted-foreground p-4">
                Showing {invoiceList.data.rows.length} of {invoiceList.data.total}
              </p>
            )}
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="Credit notes">
        {creditNotes.data && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="border-border/50 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Issued</p><p className="text-xl font-bold">{fmtKes(creditNotes.data.totalIssued)}</p></CardContent></Card>
            <Card className="border-border/50 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Applied</p><p className="text-xl font-bold text-emerald-600">{fmtKes(creditNotes.data.totalApplied)}</p></CardContent></Card>
            <Card className="border-border/50 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Pending</p><p className="text-xl font-bold text-amber-600">{fmtKes(creditNotes.data.totalPending)}</p></CardContent></Card>
          </div>
        )}
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>{["Credit #", "Client", "Amount", "Reason", "Status", "Issued"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(creditNotes.data?.rows ?? []).map((cn) => (
                  <tr key={cn.id}><td className="px-4 py-2.5 font-mono text-xs">{cn.creditNumber ?? "—"}</td><td className="px-4 py-2.5">{cn.teamName ?? "—"}</td><td className="px-4 py-2.5 font-mono">{fmtKes(cn.amount)}</td><td className="px-4 py-2.5 text-xs truncate max-w-[200px]">{cn.reason ?? "—"}</td><td className="px-4 py-2.5"><StatusBadge status={cn.status} /></td><td className="px-4 py-2.5 text-xs">{cn.issuedAt ? format(cn.issuedAt, "MMM dd") : "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="KRA / eTIMS compliance">
        {kra.data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Verified", value: kra.data.buckets.VERIFIED, icon: <CheckCircle2 className="h-4 w-4" />, color: "emerald" },
                { label: "Pending", value: kra.data.buckets.PENDING, icon: <Clock className="h-4 w-4" />, color: "amber" },
                { label: "Failed", value: kra.data.buckets.FAILED, icon: <XCircle className="h-4 w-4" />, color: "red" },
                { label: "Not submitted", value: kra.data.buckets.NOT_SUBMITTED, icon: <AlertCircle className="h-4 w-4" />, color: "slate" },
              ].map((b) => (
                <Card key={b.label} className="border-border/50 shadow-none">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", b.color === "emerald" ? "bg-emerald-100 text-emerald-600" : b.color === "amber" ? "bg-amber-100 text-amber-600" : b.color === "red" ? "bg-red-100 text-red-600" : "bg-muted")}>{b.icon}</div>
                    <div><p className="text-xl font-bold">{b.value}</p><p className="text-xs text-muted-foreground">{b.label}</p></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30">
                    <tr>{["Invoice #", "Client", "Amount", "KRA Status", "KRA Invoice #", "Verified"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {kra.data.rows.map((r) => (
                      <tr key={r.id}><td className="px-4 py-2.5 font-mono text-xs">{r.invoiceNumber ?? "—"}</td><td className="px-4 py-2.5 truncate">{r.teamName ?? "—"}</td><td className="px-4 py-2.5 font-mono">{fmtKes(r.amount)}</td><td className="px-4 py-2.5 text-xs">{r.kraStatus ?? "Not Submitted"}</td><td className="px-4 py-2.5 font-mono text-xs">{r.kraInvoiceNumber ?? "—"}</td><td className="px-4 py-2.5 text-xs">{r.kraVerifiedDate ? format(r.kraVerifiedDate, "MMM dd") : "—"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </CollapsibleDetail>
    </NiscSection>
  );
}
