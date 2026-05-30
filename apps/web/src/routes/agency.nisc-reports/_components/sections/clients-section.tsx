"use client";

import { Users, UserPlus, UserCheck, Wallet } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, KpiCard, CollapsibleDetail } from "../primitives";
import { fmtKes } from "../utils";
import { NiscChartCard, SimpleBarChart } from "../charts";

export function ClientsSection() {
  const { filters } = useNiscReportFilters();
  const summary = trpc.niscReports.clients.summary.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const cohort = trpc.niscReports.clients.cohortRetention.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const newReturn = trpc.niscReports.clients.newVsReturning.useQuery(filters, { staleTime: NISC_STALE_TIME });

  const topClients = (summary.data ?? []).slice(0, 10);

  return (
    <NiscSection
      id="clients"
      title="Client intelligence"
      description="360° client financials, cohort retention, and new vs returning breakdown."
    >
      {newReturn.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title="New clients" value={String(newReturn.data.newClients)} sub="First invoice in period" icon={<UserPlus className="h-5 w-5" />} />
          <KpiCard title="New client revenue" value={fmtKes(newReturn.data.newClientsRevenue)} color="blue" icon={<Wallet className="h-5 w-5" />} />
          <KpiCard title="Returning clients" value={String(newReturn.data.returningClients)} color="emerald" icon={<Users className="h-5 w-5" />} />
          <KpiCard title="Returning revenue" value={fmtKes(newReturn.data.returningClientsRevenue)} color="emerald" icon={<UserCheck className="h-5 w-5" />} />
        </div>
      )}

      <NiscChartCard title="Top clients by invoiced" isLoading={summary.isLoading}>
        <SimpleBarChart
          data={topClients.map((c) => ({ name: c.teamName, invoiced: c.totalInvoiced }))}
          dataKey="invoiced"
          labelKey="name"
        />
      </NiscChartCard>

      <CollapsibleDetail title="Client summary (full table)">
        <Card className="border-border/50 shadow-none">
          <CardContent className="p-0 overflow-x-auto">
            {summary.isLoading ? <Skeleton className="h-64 m-4" /> : (
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    {["Client", "Invoiced", "Paid", "Outstanding", "Active subs", "MRR", "Orders", "Pipeline"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(summary.data ?? []).map((c) => (
                    <tr key={c.teamId} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium truncate max-w-[160px]">{c.teamName}</td>
                      <td className="px-4 py-2.5 font-mono">{fmtKes(c.totalInvoiced)}</td>
                      <td className="px-4 py-2.5 font-mono text-emerald-600">{fmtKes(c.totalPaid)}</td>
                      <td className="px-4 py-2.5 font-mono text-amber-600">{fmtKes(c.outstanding)}</td>
                      <td className="px-4 py-2.5 text-center">{c.activeSubs}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold">{fmtKes(c.mrr)}</td>
                      <td className="px-4 py-2.5 text-center">{c.totalOrders}</td>
                      <td className="px-4 py-2.5 font-mono text-blue-600">{fmtKes(c.pipelineValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </CollapsibleDetail>

      <CollapsibleDetail title="Cohort retention">
        <Card className="border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold opacity-70">Subscription cohort retention</CardTitle>
            <CardDescription className="text-xs">Active % at 1, 3, 6, and 12 months after cohort start</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {cohort.isLoading ? <Skeleton className="h-48 m-4" /> : (
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    {["Cohort", "Started", "1 mo", "3 mo", "6 mo", "12 mo"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(cohort.data ?? []).map((c) => {
                    const pct = (n: number) => (c.startCount > 0 ? Math.round((n / c.startCount) * 100) : 0);
                    return (
                      <tr key={c.cohortMonth} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono font-semibold">{c.cohortMonth}</td>
                        <td className="px-4 py-2.5 font-mono">{c.startCount}</td>
                        {[c.at1Month, c.at3Months, c.at6Months, c.at12Months].map((v, i) => (
                          <td key={i} className="px-4 py-2.5">
                            {v === -1 ? "-" : (
                              <span className={cn("font-mono font-semibold", pct(v) >= 80 ? "text-emerald-600" : pct(v) >= 50 ? "text-amber-600" : "text-red-600")}>
                                {v} ({pct(v)}%)
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </CollapsibleDetail>
    </NiscSection>
  );
}
