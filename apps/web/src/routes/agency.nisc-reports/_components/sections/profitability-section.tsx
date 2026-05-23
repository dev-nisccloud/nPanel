"use client";

import { TrendingUp, Wallet, Percent, Coins } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, KpiCard, CollapsibleDetail } from "../primitives";
import { fmtKes } from "../utils";
import { NiscChartCard, StatusPieChart } from "../charts";

export function ProfitabilitySection() {
  const { filters } = useNiscReportFilters();
  const margin = trpc.niscReports.profitability.grossMargin.useQuery({ ...filters, pageSize: 50 }, { staleTime: NISC_STALE_TIME });
  const commission = trpc.niscReports.profitability.commission.useQuery({ ...filters, pageSize: 50 }, { staleTime: NISC_STALE_TIME });

  return (
    <NiscSection
      id="profitability"
      title="Profitability"
      description="Gross margin by subscription and commission entries."
    >
      {margin.data && (
        <div className="grid grid-cols-3 gap-4">
          <KpiCard title="Total MRR (active)" value={fmtKes(margin.data.totalRevenue)} icon={<TrendingUp className="h-5 w-5" />} />
          <KpiCard title="Total cost" value={fmtKes(margin.data.totalCost)} color="red" icon={<Wallet className="h-5 w-5" />} />
          <KpiCard title="Avg gross margin" value={`${margin.data.avgMarginPct.toFixed(1)}%`} color="emerald" icon={<Percent className="h-5 w-5" />} />
        </div>
      )}

      {commission.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="Earned" value={fmtKes(commission.data.totalEarned)} icon={<Coins className="h-5 w-5" />} />
          <KpiCard title="Billed" value={fmtKes(commission.data.totalBilled)} color="blue" icon={<Wallet className="h-5 w-5" />} />
          <KpiCard title="Paid" value={fmtKes(commission.data.totalPaid)} color="emerald" icon={<TrendingUp className="h-5 w-5" />} />
          <KpiCard title="Pending" value={fmtKes(commission.data.totalPending)} color="amber" icon={<Percent className="h-5 w-5" />} />
        </div>
      )}

      {commission.data && (
        <NiscChartCard title="Commission by status">
          <StatusPieChart
            data={[
              { name: "Earned", value: commission.data.totalEarned },
              { name: "Billed", value: commission.data.totalBilled },
              { name: "Paid", value: commission.data.totalPaid },
              { name: "Pending", value: commission.data.totalPending },
            ].filter((d) => d.value > 0)}
          />
        </NiscChartCard>
      )}

      <CollapsibleDetail title="Gross margin detail">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            {margin.isLoading ? <Skeleton className="h-48 m-4" /> : (
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    {["Client", "Product", "Category", "Revenue", "Cost", "Margin", "Margin %"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(margin.data?.rows ?? []).map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 truncate max-w-[140px]">{r.teamName ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs truncate">{r.productName ?? "—"}</td>
                      <td className="px-4 py-2.5 text-xs">{r.category ?? "—"}</td>
                      <td className="px-4 py-2.5 font-mono">{fmtKes(r.revenue)}</td>
                      <td className="px-4 py-2.5 font-mono text-red-600">{fmtKes(r.cost)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{fmtKes(r.grossMargin)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Progress value={r.marginPct} className="h-1.5 w-16" />
                          <span className="font-mono text-xs">{r.marginPct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="Commission entries">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/30">
                <tr className="text-left">
                  {["Client", "Period", "Base", "Rate", "Commission", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(commission.data?.rows ?? []).map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 truncate max-w-[160px]">{r.teamName ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs">{r.period ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono">{fmtKes(r.baseAmount)}</td>
                    <td className="px-4 py-2.5 font-mono">{r.commissionRate.toFixed(2)}%</td>
                    <td className="px-4 py-2.5 font-mono text-emerald-600">{fmtKes(r.commissionAmount)}</td>
                    <td className="px-4 py-2.5 text-xs">{r.status}</td>
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
