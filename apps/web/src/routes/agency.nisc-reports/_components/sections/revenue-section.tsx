"use client";

import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart2,
  CreditCard,
  FileText,
  Receipt,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, KpiCard, StatusBadge, CollapsibleDetail } from "../primitives";
import { fmtKes, pct } from "../utils";
import { NiscChartCard, RevenueTrendAreaChart, SimpleBarChart } from "../charts";

export function RevenueSection() {
  const { filters } = useNiscReportFilters();
  const overview = trpc.niscReports.revenue.overview.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const trend = trpc.niscReports.revenue.trend.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const byClient = trpc.niscReports.revenue.byClient.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const aging = trpc.niscReports.revenue.aging.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const outstanding = trpc.niscReports.revenue.outstandingList.useQuery(
    { ...filters, pageSize: 20 },
    { staleTime: NISC_STALE_TIME }
  );

  const ov = overview.data;

  return (
    <NiscSection
      id="revenue"
      title="Revenue & collections"
      description="Live financials covering all invoice statuses, cash collected, receivables, and aging."
    >
      {overview.isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        ov && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Total Invoiced" value={fmtKes(ov.totalInvoiced)} icon={<FileText className="h-5 w-5" />} />
              <KpiCard title="Cash Collected" value={fmtKes(ov.collected)} icon={<DollarSign className="h-5 w-5" />} color="emerald" />
              <KpiCard title="Billed Unpaid" value={fmtKes(ov.billedUnpaid)} icon={<Clock className="h-5 w-5" />} color="amber" />
              <KpiCard title="In Draft" value={fmtKes(ov.inDraft)} icon={<Receipt className="h-5 w-5" />} />
              <KpiCard title="Net Collected" value={fmtKes(ov.netCollected)} sub="After credit notes" icon={<TrendingUp className="h-5 w-5" />} color="blue" />
              <KpiCard title="Overdue" value={fmtKes(ov.outstanding)} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
              <KpiCard title="Tax Collected" value={fmtKes(ov.taxCollected)} icon={<BarChart2 className="h-5 w-5" />} />
              <KpiCard title="Payment Rate" value={pct(ov.paymentRate)} sub={`Avg ${fmtKes(ov.avgInvoiceValue)}`} icon={<CreditCard className="h-5 w-5" />} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NiscChartCard title="Revenue trend" isLoading={trend.isLoading} height={320}>
                <RevenueTrendAreaChart data={trend.data ?? []} />
              </NiscChartCard>
              {aging.data && (
                <NiscChartCard title="A/R aging" description="Outstanding by bucket">
                  <SimpleBarChart
                    data={[
                      { label: "Current", amount: aging.data.current.amount },
                      { label: "1–30d", amount: aging.data.days1_30.amount },
                      { label: "31–60d", amount: aging.data.days31_60.amount },
                      { label: "61–90d", amount: aging.data.days61_90.amount },
                      { label: "91–120d", amount: aging.data.days91_120.amount },
                      { label: "120+d", amount: aging.data.days120plus.amount },
                    ]}
                    dataKey="amount"
                    labelKey="label"
                  />
                </NiscChartCard>
              )}
            </div>

            <Card className="border-border/50 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase tracking-tight opacity-70">Invoice breakdown by status</CardTitle>
                <CardDescription className="text-xs">All statuses included - DRAFT is real business activity.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/50">
                  {ov.byStatus.map((s) => (
                    <div key={s.status} className="flex items-center justify-between py-2.5 gap-4">
                      <StatusBadge status={s.status} />
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-muted-foreground">{s.count} invoices</span>
                        <span className="font-mono font-semibold">{fmtKes(s.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <CollapsibleDetail title="Revenue by client (top 30)">
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  {byClient.isLoading ? (
                    <Skeleton className="h-48 m-4" />
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left bg-muted/30">
                          {["Client", "Invoiced", "Collected", "Outstanding", "Overdue", "Invoices", "Avg Days to Pay"].map((h) => (
                            <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {(byClient.data ?? []).slice(0, 30).map((c) => (
                          <tr key={c.teamId} className="hover:bg-muted/30">
                            <td className="px-4 py-2.5 font-medium max-w-[180px] truncate">{c.teamName}</td>
                            <td className="px-4 py-2.5 font-mono">{fmtKes(c.totalInvoiced)}</td>
                            <td className="px-4 py-2.5 font-mono text-emerald-600 dark:text-emerald-400">{fmtKes(c.totalCollected)}</td>
                            <td className="px-4 py-2.5 font-mono text-amber-600">{fmtKes(c.outstanding)}</td>
                            <td className="px-4 py-2.5 font-mono text-red-600">{fmtKes(c.overdueAmount)}</td>
                            <td className="px-4 py-2.5 font-mono">{c.invoiceCount}</td>
                            <td className="px-4 py-2.5 font-mono">{c.avgDaysToPay > 0 ? `${c.avgDaysToPay.toFixed(0)}d` : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </CollapsibleDetail>

            <CollapsibleDetail title="Outstanding invoices">
              <Card className="border-border/50 shadow-none">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left bg-muted/30">
                        {["Invoice #", "Client", "Amount", "Due Date", "Status", "Days Overdue"].map((h) => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {(outstanding.data?.rows ?? []).map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 font-mono text-xs">{inv.invoiceNumber ?? "-"}</td>
                          <td className="px-4 py-2.5 font-medium truncate max-w-[160px]">{inv.teamName ?? "-"}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold">{fmtKes(inv.amount)}</td>
                          <td className="px-4 py-2.5 text-xs">{inv.dueDate ? format(inv.dueDate, "MMM dd, yyyy") : "-"}</td>
                          <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                          <td className="px-4 py-2.5 font-mono text-red-600">{inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {aging.data && (
                    <p className="text-xs text-muted-foreground p-4">
                      Total outstanding: {fmtKes(aging.data.total.amount)} ({aging.data.total.count} invoices)
                    </p>
                  )}
                </CardContent>
              </Card>
            </CollapsibleDetail>
          </>
        )
      )}
    </NiscSection>
  );
}
