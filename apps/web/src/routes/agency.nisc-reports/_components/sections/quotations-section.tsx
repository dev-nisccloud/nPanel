"use client";

import { format } from "date-fns";
import { FileText, Send, CheckCircle2, Percent } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, KpiCard, CollapsibleDetail } from "../primitives";
import { fmtKes } from "../utils";
import { NiscChartCard, StatusPieChart, FunnelBarChart } from "../charts";

const QUOTE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ACCEPTED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  EXPIRED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function QuotationsSection() {
  const { filters } = useNiscReportFilters();
  const pipeline = trpc.niscReports.quotations.pipeline.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const funnel = trpc.niscReports.quotations.conversionFunnel.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const list = trpc.niscReports.quotations.list.useQuery({ ...filters, pageSize: 25 }, { staleTime: NISC_STALE_TIME });

  const p = pipeline.data;

  return (
    <NiscSection
      id="quotations"
      title="Quotation pipeline"
      description="Pipeline overview, conversion funnel, and full quotation list — all statuses included."
    >
      {pipeline.isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        p && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="In preparation (DRAFT)" value={fmtKes(p.inPreparation)} sub={`${p.byStatus.find((s) => s.status === "DRAFT")?.count ?? 0} quotes`} icon={<FileText className="h-5 w-5" />} />
              <KpiCard title="Active pipeline (SENT)" value={fmtKes(p.activePipeline)} color="blue" icon={<Send className="h-5 w-5" />} />
              <KpiCard title="Won (ACCEPTED)" value={fmtKes(p.wonValue)} color="emerald" icon={<CheckCircle2 className="h-5 w-5" />} />
              <KpiCard title="Win rate" value={`${p.winRate.toFixed(1)}%`} sub={`Avg won ${fmtKes(p.avgQuoteValue)}`} icon={<Percent className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NiscChartCard title="Pipeline by status">
                <StatusPieChart data={p.byStatus.map((s) => ({ name: s.status, value: s.amount }))} />
              </NiscChartCard>
              <NiscChartCard title="Conversion funnel" isLoading={funnel.isLoading}>
                <FunnelBarChart stages={funnel.data ?? []} />
              </NiscChartCard>
            </div>

            <Card className="border-border/50 shadow-none">
              <CardContent className="p-4">
                <div className="divide-y divide-border/50">
                  {p.byStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between py-3">
                      <span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", QUOTE_STATUS_COLORS[s.status] ?? "bg-muted")}>{s.status}</span>
                      <div className="flex gap-6 text-sm">
                        <span className="text-muted-foreground">{s.count} quotes</span>
                        <span className="font-mono font-semibold">{fmtKes(s.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}

      <CollapsibleDetail title="Quotation list">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  {["Quote #", "Customer", "Amount", "Status", "Issue Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(list.data?.rows ?? []).map((q) => (
                  <tr key={q.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs">{q.quotationNumber ?? "—"}</td>
                    <td className="px-4 py-2.5 truncate max-w-[160px]">{q.customerName ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold">{fmtKes(q.amount)}</td>
                    <td className="px-4 py-2.5"><span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", QUOTE_STATUS_COLORS[q.status])}>{q.status}</span></td>
                    <td className="px-4 py-2.5 text-xs">{q.issueDate ? format(q.issueDate, "MMM dd, yyyy") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.data && <p className="text-xs text-muted-foreground p-4">Showing {list.data.rows.length} of {list.data.total}</p>}
          </CardContent>
        </Card>
      </CollapsibleDetail>
    </NiscSection>
  );
}
