"use client";

import { format } from "date-fns";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, KpiCard, CollapsibleDetail } from "../primitives";
import { fmtKes } from "../utils";
import { NiscChartCard, StatusPieChart, MrrWaterfallChart, SimpleBarChart } from "../charts";

const SUB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  EXPIRED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  SUSPENDED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
};

export function SubscriptionsSection() {
  const { filters } = useNiscReportFilters();
  const mrrDash = trpc.niscReports.subscriptions.mrrDashboard.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const movement = trpc.niscReports.subscriptions.mrrMovement.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const statuses = trpc.niscReports.subscriptions.statusSummary.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const list = trpc.niscReports.subscriptions.list.useQuery({ ...filters, pageSize: 25 }, { staleTime: NISC_STALE_TIME });
  const renewals = trpc.niscReports.subscriptions.renewalForecast.useQuery({ ...filters, withinDays: 90 }, { staleTime: NISC_STALE_TIME });
  const churn = trpc.niscReports.subscriptions.churn.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const upgrades = trpc.niscReports.subscriptions.upgrades.useQuery(filters, { staleTime: NISC_STALE_TIME });

  const mrr = mrrDash.data;
  const mov = movement.data;

  return (
    <NiscSection
      id="subscriptions"
      title="Subscriptions & MRR"
      description="MRR dashboard, movement waterfall, churn, renewals, and subscription health."
    >
      {mrrDash.isLoading ? (
        <Skeleton className="h-48" />
      ) : (
        mrr && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard title="MRR" value={fmtKes(mrr.mrr)} sub={`ARR ${fmtKes(mrr.arr)}`} icon={<TrendingUp className="h-5 w-5" />} color="emerald" />
              <KpiCard title="Active subscriptions" value={String(mrr.totalActive)} icon={<BarChart3 className="h-5 w-5" />} />
              <KpiCard title="Avg MRR / sub" value={fmtKes(mrr.totalActive > 0 ? mrr.mrr / mrr.totalActive : 0)} icon={<TrendingUp className="h-5 w-5" />} color="blue" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NiscChartCard title="MRR by category">
                <SimpleBarChart
                  data={mrr.byCategory.map((c) => ({ category: c.category, mrr: c.mrr }))}
                  dataKey="mrr"
                  labelKey="category"
                />
              </NiscChartCard>
              <NiscChartCard title="Subscription status" isLoading={statuses.isLoading}>
                <StatusPieChart
                  data={(statuses.data ?? []).map((s) => ({ name: s.status, value: s.count }))}
                />
              </NiscChartCard>
            </div>

            {mov && (
              <NiscChartCard title="MRR movement" description={mov.periodLabel}>
                <MrrWaterfallChart
                  items={[
                    { label: "New", value: mov.newMrr },
                    { label: "Expansion", value: mov.expansionMrr },
                    { label: "Contraction", value: -mov.contractionMrr },
                    { label: "Churned", value: -mov.churnedMrr },
                    { label: "Net", value: mov.netChange },
                  ]}
                />
              </NiscChartCard>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {mov &&
                [
                  { label: "New MRR", value: mov.newMrr, icon: <TrendingUp className="h-4 w-4" /> },
                  { label: "Expansion", value: mov.expansionMrr, icon: <ArrowUpRight className="h-4 w-4" /> },
                  { label: "Contraction", value: -mov.contractionMrr, icon: <ArrowDownRight className="h-4 w-4" /> },
                  { label: "Churned", value: -mov.churnedMrr, icon: <TrendingDown className="h-4 w-4" /> },
                  { label: "Net", value: mov.netChange, icon: <BarChart3 className="h-4 w-4" /> },
                ].map((m) => (
                  <Card key={m.label} className="border-border/50 shadow-none">
                    <CardContent className="p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{m.label}</p>
                      <p className={cn("text-lg font-bold", m.value < 0 && "text-red-600")}>
                        {m.value >= 0 ? "+" : ""}
                        {fmtKes(m.value)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </>
        )
      )}

      <CollapsibleDetail title="Top clients by MRR">
        {mrr && (
          <Card className="border-border/50 shadow-none">
            <CardContent className="divide-y divide-border/50 p-4">
              {mrr.byClient.slice(0, 15).map((c) => (
                <div key={c.teamId} className="flex justify-between py-2">
                  <span className="text-sm font-medium truncate max-w-[240px]">{c.teamName}</span>
                  <span className="font-mono font-semibold">{fmtKes(c.mrr)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </CollapsibleDetail>

      <CollapsibleDetail title="Subscription list">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  {["Client", "Product", "Status", "Billing", "MRR", "Next renewal"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(list.data?.rows ?? []).map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 truncate max-w-[140px]">{s.teamName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs truncate">{s.productName ?? "—"}</td>
                    <td className="px-4 py-2.5"><span className={cn("px-2 py-0.5 rounded text-[11px] font-semibold", SUB_STATUS_COLORS[s.status])}>{s.status}</span></td>
                    <td className="px-4 py-2.5 text-xs">{s.billingCycle ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold">{fmtKes(s.mrr)}</td>
                    <td className="px-4 py-2.5 text-xs">{s.nextRenewalDate ? format(s.nextRenewalDate, "MMM dd") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="Renewals due (90 days)">
        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-bold opacity-70">Upcoming renewals</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr>{["Client", "Product", "Renewal", "Days", "Price", "Auto-renew"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(renewals.data ?? []).map((r) => (
                  <tr key={r.id}><td className="px-4 py-2.5 truncate">{r.teamName}</td><td className="px-4 py-2.5 text-xs truncate">{r.productName}</td><td className="px-4 py-2.5 text-xs">{r.renewalDate ? format(r.renewalDate, "MMM dd") : "—"}</td><td className={cn("px-4 py-2.5 font-bold", r.daysUntilRenewal <= 15 && "text-red-600")}>{r.daysUntilRenewal}d</td><td className="px-4 py-2.5 font-mono">{fmtKes(r.expectedPrice)}</td><td className="px-4 py-2.5 text-xs">{r.autoRenew ? "Yes" : "No"}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="Churn">
        {churn.data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card className="border-border/50 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Churned</p><p className="text-2xl font-bold">{churn.data.rows.length}</p></CardContent></Card>
              <Card className="border-border/50 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">MRR lost</p><p className="text-2xl font-bold text-red-600">{fmtKes(churn.data.totalChurnedMrr)}</p></CardContent></Card>
              <Card className="border-border/50 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">Churn rate</p><p className="text-2xl font-bold">{churn.data.churnRate.toFixed(1)}%</p></CardContent></Card>
            </div>
            <Card className="border-border/50 shadow-none">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/30"><tr>{["Client", "Product", "Churn date", "Tenure", "MRR lost"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}</tr></thead>
                  <tbody className="divide-y divide-border/40">
                    {churn.data.rows.map((r) => (
                      <tr key={r.id}><td className="px-4 py-2.5 truncate">{r.teamName}</td><td className="px-4 py-2.5 text-xs truncate">{r.productName}</td><td className="px-4 py-2.5 text-xs">{format(r.churnDate, "MMM dd")}</td><td className="px-4 py-2.5 font-mono">{r.tenureDays}d</td><td className="px-4 py-2.5 font-mono text-red-600">{fmtKes(r.mrrLost)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </CollapsibleDetail>

      <CollapsibleDetail title="Upgrades & downgrades">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30"><tr>{["Client", "Product", "Type", "MRR impact", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}</tr></thead>
              <tbody className="divide-y divide-border/40">
                {(upgrades.data ?? []).map((r) => (
                  <tr key={r.id}><td className="px-4 py-2.5 truncate">{r.teamName}</td><td className="px-4 py-2.5 text-xs truncate">{r.productName}</td><td className="px-4 py-2.5 text-xs">{r.changeType}</td><td className={cn("px-4 py-2.5 font-mono", r.priceDelta >= 0 ? "text-emerald-600" : "text-red-600")}>{r.priceDelta >= 0 ? "+" : ""}{fmtKes(r.priceDelta)}</td><td className="px-4 py-2.5 text-xs">{format(r.eventDate, "MMM dd")}</td></tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </CollapsibleDetail>
    </NiscSection>
  );
}
