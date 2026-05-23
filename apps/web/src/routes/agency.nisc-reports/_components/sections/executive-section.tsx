"use client";

import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  Users,
  Receipt,
  CreditCard,
} from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection } from "../primitives";
import { KpiCard } from "../primitives";
import { fmtKes, pct } from "../utils";
import {
  NiscChartCard,
  RevenueTrendAreaChart,
  StatusPieChart,
  SimpleBarChart,
} from "../charts";

export function ExecutiveSection() {
  const { filters } = useNiscReportFilters();

  const overview = trpc.niscReports.revenue.overview.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const trend = trpc.niscReports.revenue.trend.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const mrr = trpc.niscReports.subscriptions.mrrDashboard.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const pipeline = trpc.niscReports.quotations.pipeline.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const methods = trpc.niscReports.payments.methodBreakdown.useQuery(filters, { staleTime: NISC_STALE_TIME });

  const ov = overview.data;
  const loading = overview.isLoading;

  return (
    <NiscSection
      id="executive"
      title="Executive summary"
      description="Top-line health across cash, recurring revenue, pipeline, and collections for the selected period."
    >
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        ov && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Cash Collected" value={fmtKes(ov.collected)} icon={<DollarSign className="h-5 w-5" />} color="emerald" />
              <KpiCard title="MRR" value={fmtKes(mrr.data?.mrr ?? 0)} sub={`ARR ${fmtKes(mrr.data?.arr ?? 0)}`} icon={<TrendingUp className="h-5 w-5" />} color="blue" />
              <KpiCard title="Active Pipeline" value={fmtKes(pipeline.data?.activePipeline ?? 0)} sub="Quotations sent" icon={<FileText className="h-5 w-5" />} />
              <KpiCard title="Overdue" value={fmtKes(ov.outstanding)} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
              <KpiCard title="Total Invoiced" value={fmtKes(ov.totalInvoiced)} icon={<Receipt className="h-5 w-5" />} />
              <KpiCard title="Billed Unpaid" value={fmtKes(ov.billedUnpaid)} icon={<CreditCard className="h-5 w-5" />} color="amber" />
              <KpiCard title="Active Subscriptions" value={String(mrr.data?.totalActive ?? 0)} icon={<Users className="h-5 w-5" />} color="emerald" />
              <KpiCard title="Payment Rate" value={pct(ov.paymentRate)} sub={`Net ${fmtKes(ov.netCollected)}`} icon={<DollarSign className="h-5 w-5" />} color="emerald" />
            </div>

            <NiscChartCard title="Revenue trend" description="Invoiced vs collected vs overdue over time" isLoading={trend.isLoading} height={350}>
              <RevenueTrendAreaChart data={trend.data ?? []} />
            </NiscChartCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NiscChartCard title="Invoice status mix" isLoading={overview.isLoading}>
                <StatusPieChart
                  data={(ov.byStatus ?? []).map((s) => ({ name: s.status, value: s.amount }))}
                />
              </NiscChartCard>
              <NiscChartCard title="MRR by category" isLoading={mrr.isLoading}>
                <SimpleBarChart
                  data={(mrr.data?.byCategory ?? []).map((c) => ({
                    category: c.category,
                    mrr: c.mrr,
                  }))}
                  dataKey="mrr"
                  labelKey="category"
                />
              </NiscChartCard>
              <NiscChartCard title="Payment methods" isLoading={methods.isLoading}>
                <StatusPieChart
                  data={(methods.data ?? []).map((m) => ({ name: m.method, value: m.amount }))}
                />
              </NiscChartCard>
            </div>
          </>
        )
      )}
    </NiscSection>
  );
}
