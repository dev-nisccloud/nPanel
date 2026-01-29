"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@nPanel/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { type SeoReportView } from "./schema";
import { MONTH_LABELS } from "./schema";

interface SeoReportViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string | null;
}

const METRIC_CARD_CLASSES: Record<string, { card: string; label: string; value: string }> = {
  blue: { card: "p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900", label: "text-[10px] font-medium mb-1 text-blue-700 dark:text-blue-300", value: "text-sm font-semibold break-words text-blue-900 dark:text-blue-100" },
  purple: { card: "p-3 rounded-lg border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900", label: "text-[10px] font-medium mb-1 text-purple-700 dark:text-purple-300", value: "text-sm font-semibold break-words text-purple-900 dark:text-purple-100" },
  green: { card: "p-3 rounded-lg border bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900", label: "text-[10px] font-medium mb-1 text-green-700 dark:text-green-300", value: "text-sm font-semibold break-words text-green-900 dark:text-green-100" },
  orange: { card: "p-3 rounded-lg border bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900", label: "text-[10px] font-medium mb-1 text-orange-700 dark:text-orange-300", value: "text-sm font-semibold break-words text-orange-900 dark:text-orange-100" },
  indigo: { card: "p-3 rounded-lg border bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900", label: "text-[10px] font-medium mb-1 text-indigo-700 dark:text-indigo-300", value: "text-sm font-semibold break-words text-indigo-900 dark:text-indigo-100" },
  emerald: { card: "p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900", label: "text-[10px] font-medium mb-1 text-emerald-700 dark:text-emerald-300", value: "text-sm font-semibold break-words text-emerald-900 dark:text-emerald-100" },
  slate: { card: "p-3 rounded-lg border bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-900", label: "text-[10px] font-medium mb-1 text-slate-700 dark:text-slate-300", value: "text-sm font-semibold break-words text-slate-900 dark:text-slate-100" },
  teal: { card: "p-3 rounded-lg border bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900", label: "text-[10px] font-medium mb-1 text-teal-700 dark:text-teal-300", value: "text-sm font-semibold break-words text-teal-900 dark:text-teal-100" },
  cyan: { card: "p-3 rounded-lg border bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-900", label: "text-[10px] font-medium mb-1 text-cyan-700 dark:text-cyan-300", value: "text-sm font-semibold break-words text-cyan-900 dark:text-cyan-100" },
  amber: { card: "p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900", label: "text-[10px] font-medium mb-1 text-amber-700 dark:text-amber-300", value: "text-sm font-semibold break-words text-amber-900 dark:text-amber-100" },
  violet: { card: "p-3 rounded-lg border bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900", label: "text-[10px] font-medium mb-1 text-violet-700 dark:text-violet-300", value: "text-sm font-semibold break-words text-violet-900 dark:text-violet-100" },
  fuchsia: { card: "p-3 rounded-lg border bg-fuchsia-50 dark:bg-fuchsia-950/30 border-fuchsia-200 dark:border-fuchsia-900", label: "text-[10px] font-medium mb-1 text-fuchsia-700 dark:text-fuchsia-300", value: "text-sm font-semibold break-words text-fuchsia-900 dark:text-fuchsia-100" },
  rose: { card: "p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900", label: "text-[10px] font-medium mb-1 text-rose-700 dark:text-rose-300", value: "text-sm font-semibold break-words text-rose-900 dark:text-rose-100" },
  lime: { card: "p-3 rounded-lg border bg-lime-50 dark:bg-lime-950/30 border-lime-200 dark:border-lime-900", label: "text-[10px] font-medium mb-1 text-lime-700 dark:text-lime-300", value: "text-sm font-semibold break-words text-lime-900 dark:text-lime-100" },
};

const METRIC_CARDS: { key: keyof SeoReportView; label: string; color: string }[] = [
  { key: "sessions", label: "Sessions", color: "blue" },
  { key: "totalWebTraffic", label: "Total web traffic", color: "purple" },
  { key: "totalViews", label: "Total views", color: "slate" },
  { key: "bounceRate", label: "Bounce rate", color: "green" },
  { key: "users", label: "Users", color: "teal" },
  { key: "returningUsers", label: "Returning users", color: "cyan" },
  { key: "sessionDuration", label: "Session duration", color: "amber" },
  { key: "engagedSessions", label: "Engaged sessions", color: "orange" },
  { key: "sessionsDesktop", label: "Sessions (desktop)", color: "indigo" },
  { key: "sessionsMobile", label: "Sessions (mobile)", color: "violet" },
  { key: "sessionsTablet", label: "Sessions (tablet)", color: "fuchsia" },
  { key: "eventCount", label: "Event count", color: "rose" },
  { key: "conversions", label: "Conversions", color: "emerald" },
  { key: "formSubmissions", label: "Form submissions", color: "lime" },
  { key: "impressions", label: "Impressions", color: "orange" },
  { key: "clicks", label: "Clicks", color: "indigo" },
];

function formatMetric(value: string | null | undefined, suffix = ""): string {
  if (value == null || value === "") return "—";
  const num = parseFloat(String(value));
  if (Number.isNaN(num)) return value + suffix;
  if (num % 1 === 0) return num.toLocaleString("en-US", { maximumFractionDigits: 0 }) + suffix;
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix;
}

export function SeoReportViewDialog({ open, onOpenChange, reportId }: SeoReportViewDialogProps) {
  const { data, isLoading, error } = trpc.seoReports.getById.useQuery(
    { id: reportId! },
    { enabled: open && !!reportId }
  );

  const report: SeoReportView | null = React.useMemo(() => {
    if (!data) return null;
    return data as unknown as SeoReportView;
  }, [data]);

  if (!reportId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] w-[90vw] h-[85vh] p-0 gap-0 overflow-hidden flex flex-col"
        hideClose
      >
        <DialogTitle className="sr-only">SEO Report</DialogTitle>
        <DialogDescription className="sr-only">View SEO report details</DialogDescription>

        <div className="flex flex-col h-full min-h-0">
          <div className="flex-shrink-0 px-4 py-3 border-b flex items-center justify-between bg-background">
            <div className="min-w-0">
              {report ? (
                <h2 className="font-semibold truncate">
                  {report.reportName} — {MONTH_LABELS[report.reportMonth] ?? report.reportMonth} {report.reportYear}
                </h2>
              ) : (
                <h2 className="font-semibold">SEO Report</h2>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {isLoading && (
            <div className="flex-1 flex items-center justify-center min-h-[200px]">
              <Spinner size={32} />
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center text-destructive min-h-[200px]">
              {error.message || "Failed to load report"}
            </div>
          )}

          {report && !isLoading && !error && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 md:p-6 pb-8">
                <div className="flex gap-2 items-center mb-4">
                  <Badge variant={report.status === "FINAL" ? "default" : "secondary"}>{report.status}</Badge>
                  {report.websiteUrl && (
                    <span className="text-sm text-muted-foreground truncate" title={report.websiteUrl}>
                      {report.websiteUrl}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {METRIC_CARDS.map(({ key, label, color }) => {
                    const value = report[key];
                    const isBounceRate = key === "bounceRate";
                    const displayValue =
                      typeof value === "string" || value == null
                        ? formatMetric(value ?? null, isBounceRate && value != null && value !== "" ? "%" : "")
                        : String(value);
                    const classes = METRIC_CARD_CLASSES[color];
                    if (!classes) return null;
                    return (
                      <div key={key} className={classes.card}>
                        <div className={classes.label}>{label}</div>
                        <div className={classes.value}>{displayValue}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Recommendations</h3>
                  <div className="text-sm whitespace-pre-wrap rounded-md bg-muted/50 p-4 min-h-[80px]">
                    {report.recommendations && report.recommendations.trim() !== ""
                      ? report.recommendations
                      : "—"}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
