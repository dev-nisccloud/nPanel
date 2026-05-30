"use client";

import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, CollapsibleDetail } from "../primitives";
import { fmtKes } from "../utils";
import { NiscChartCard, StatusPieChart, SimpleBarChart } from "../charts";

export function PaymentsSection() {
  const { filters } = useNiscReportFilters();
  const methods = trpc.niscReports.payments.methodBreakdown.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const perf = trpc.niscReports.payments.gatewayPerf.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const pending = trpc.niscReports.payments.failedPending.useQuery({ ...filters, pageSize: 50 }, { staleTime: NISC_STALE_TIME });
  const refunds = trpc.niscReports.payments.refunds.useQuery({ ...filters, pageSize: 50 }, { staleTime: NISC_STALE_TIME });

  return (
    <NiscSection
      id="payments"
      title="Payments & cash"
      description="Payment method distribution, gateway performance, failures, and refunds."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NiscChartCard title="Payment methods" isLoading={methods.isLoading}>
          <StatusPieChart data={(methods.data ?? []).map((m) => ({ name: m.method, value: m.amount }))} />
        </NiscChartCard>
        <NiscChartCard title="Gateway success rate" isLoading={perf.isLoading}>
          <SimpleBarChart
            data={(perf.data ?? []).map((g) => ({ gateway: g.gateway, rate: g.successRate }))}
            dataKey="rate"
            labelKey="gateway"
            formatValue={(n) => `${n.toFixed(1)}%`}
          />
        </NiscChartCard>
      </div>

      <CollapsibleDetail title="Gateway performance detail">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            {perf.isLoading ? <Skeleton className="h-32 m-4" /> : (
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    {["Gateway", "Total", "Completed", "Failed", "Refunded", "Success %", "Avg Time"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(perf.data ?? []).map((g) => (
                    <tr key={g.gateway} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-bold uppercase text-xs">{g.gateway}</td>
                      <td className="px-4 py-2.5 font-mono">{g.totalInitiated}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{g.totalCompleted}</td>
                      <td className="px-4 py-2.5 font-mono text-red-600">{g.totalFailed}</td>
                      <td className="px-4 py-2.5 font-mono text-purple-600">{g.totalRefunded}</td>
                      <td className={cn("px-4 py-2.5 font-mono font-bold", g.successRate >= 90 ? "text-emerald-600" : g.successRate >= 70 ? "text-amber-600" : "text-red-600")}>
                        {g.successRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 font-mono">{g.avgProcessingMinutes.toFixed(1)} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="Failed & pending transactions">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  {["Initiated", "Gateway", "Client", "Phone", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(pending.data?.rows ?? []).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xs">{format(r.initiatedAt, "MMM dd HH:mm")}</td>
                    <td className="px-4 py-2.5 text-[10px] font-bold uppercase">{r.gateway}</td>
                    <td className="px-4 py-2.5 truncate max-w-[140px]">{r.teamName ?? "-"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.phoneNumber ?? "-"}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold">{fmtKes(r.amount)}</td>
                    <td className="px-4 py-2.5 flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", r.status === "FAILED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" : "bg-amber-100 text-amber-800")}>{r.status}</span>
                      {r.flagged && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="Refunds">
        {refunds.data && (
          <Card className="border-border/50 shadow-none max-w-sm mb-3">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Total refunded</p>
              <p className="text-2xl font-bold text-purple-600">{fmtKes(refunds.data.totalRefunded)}</p>
            </CardContent>
          </Card>
        )}
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  {["Refunded At", "Gateway", "Client", "Receipt #", "Amount"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(refunds.data?.rows ?? []).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-xs">{r.refundedAt ? format(r.refundedAt, "MMM dd HH:mm") : "-"}</td>
                    <td className="px-4 py-2.5 text-[10px] font-bold uppercase">{r.gateway}</td>
                    <td className="px-4 py-2.5 truncate max-w-[160px]">{r.teamName ?? "-"}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.receiptNumber ?? "-"}</td>
                    <td className="px-4 py-2.5 font-mono text-purple-600 font-semibold">{fmtKes(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </CollapsibleDetail>
    </NiscSection>
  );
}
