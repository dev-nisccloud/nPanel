"use client";

import { Layers } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNiscReportFilters, NISC_STALE_TIME } from "../report-context";
import { NiscSection, KpiCard } from "../primitives";
import { fmtKes } from "../utils";
import { NiscChartCard, SimpleBarChart } from "../charts";

export function TaxSection() {
  const { filters } = useNiscReportFilters();
  const tax = trpc.niscReports.tax.summary.useQuery(filters, { staleTime: NISC_STALE_TIME });
  const d = tax.data;

  return (
    <NiscSection
      id="tax"
      title="Tax & compliance"
      description="Cash-basis tax collected and pending liabilities from unpaid invoices."
    >
      {tax.isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        d && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard title="Collected tax" value={fmtKes(d.taxCollected, d.currency)} sub="From PAID invoices" color="emerald" icon={<Layers className="h-5 w-5" />} />
              <KpiCard title="Collected VAT" value={fmtKes(d.vatCollected, d.currency)} icon={<Layers className="h-5 w-5" />} />
              <KpiCard title="Taxable subtotal" value={fmtKes(d.taxableAmount, d.currency)} icon={<Layers className="h-5 w-5" />} />
              <KpiCard title="Pending tax liability" value={fmtKes(d.pendingTaxAmount, d.currency)} color="amber" icon={<Layers className="h-5 w-5" />} />
            </div>

            <NiscChartCard title="Tax collected by rate">
              <SimpleBarChart
                data={d.byTaxRate.map((r) => ({
                  rate: `${r.taxPercentage}%`,
                  tax: r.taxAmount,
                }))}
                dataKey="tax"
                labelKey="rate"
                formatValue={(n) => fmtKes(n, d.currency)}
              />
            </NiscChartCard>

            <Card className="border-border/50 shadow-none max-w-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase opacity-70 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Collected tax by rate
                </CardTitle>
                <CardDescription className="text-xs">Breakdown of {fmtKes(d.taxCollected, d.currency)} collected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {d.byTaxRate.map((r) => (
                    <div key={r.taxPercentage} className="flex items-center gap-4">
                      <div className="w-16 font-mono font-bold text-sm bg-muted/50 rounded text-center py-1">{r.taxPercentage}%</div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Taxable: {fmtKes(r.taxableAmount, d.currency)}</span>
                          <span className="font-semibold">{fmtKes(r.taxAmount, d.currency)}</span>
                        </div>
                        <Progress value={d.taxCollected > 0 ? (r.taxAmount / d.taxCollected) * 100 : 0} className="h-2" />
                      </div>
                      <div className="w-16 text-right text-xs text-muted-foreground">{r.count} inv</div>
                    </div>
                  ))}
                  {d.byTaxRate.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">No tax collected in this period</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}
    </NiscSection>
  );
}
