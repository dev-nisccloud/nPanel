"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@nPanel/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { type SeoReportView } from "./schema";
import { MONTH_LABELS } from "./schema";

function Field({ label, value }: { label: string; value: string | number | boolean | null | undefined }) {
  const v = value == null || value === "" ? "—" : String(value);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-2 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words">{v}</span>
    </div>
  );
}

interface SeoReportViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string | null;
}

const TRAFFIC_FIELDS = [
  { key: "sessions", label: "Sessions" },
  { key: "totalWebTraffic", label: "Total web traffic" },
  { key: "totalViews", label: "Total views" },
  { key: "bounceRate", label: "Bounce rate" },
  { key: "users", label: "Users" },
  { key: "returningUsers", label: "Returning users" },
  { key: "sessionDuration", label: "Session duration" },
  { key: "engagedSessions", label: "Engaged sessions" },
  { key: "sessionsDesktop", label: "Sessions (desktop)" },
  { key: "sessionsMobile", label: "Sessions (mobile)" },
  { key: "sessionsTablet", label: "Sessions (tablet)" },
] as const;

const GOALS_FIELDS = [
  { key: "eventCount", label: "Event count" },
  { key: "conversions", label: "Conversions" },
  { key: "formSubmissions", label: "Form submissions" },
  { key: "impressions", label: "Impressions" },
  { key: "clicks", label: "Clicks" },
] as const;

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

        <div className="flex flex-col h-full">
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
            <div className="flex-1 flex items-center justify-center">
              <Spinner size={32} />
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center text-destructive">
              {error.message || "Failed to load report"}
            </div>
          )}

          {report && !isLoading && !error && (
            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
              <TabsList className="flex-shrink-0 w-full justify-start rounded-none border-b bg-transparent p-0 h-auto flex flex-wrap gap-0">
                {["overview", "traffic", "goals"].map((v) => (
                  <TabsTrigger key={v} value={v} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="p-4 md:p-6">
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <div className="flex gap-2 items-center">
                      <Badge variant={report.status === "FINAL" ? "default" : "secondary"}>{report.status}</Badge>
                    </div>
                    <Field label="Report name" value={report.reportName} />
                    <Field label="Website" value={report.websiteUrl} />
                    <Field label="Period" value={`${MONTH_LABELS[report.reportMonth] ?? report.reportMonth} ${report.reportYear}`} />
                    {report.recommendations && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-1">Recommendations</p>
                        <p className="text-sm whitespace-pre-wrap">{report.recommendations}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="traffic" className="mt-0 space-y-1">
                    {TRAFFIC_FIELDS.map(({ key, label }) => (
                      <Field key={key} label={label} value={(report as Record<string, unknown>)[key] as string} />
                    ))}
                  </TabsContent>

                  <TabsContent value="goals" className="mt-0 space-y-1">
                    {GOALS_FIELDS.map(({ key, label }) => (
                      <Field key={key} label={label} value={(report as Record<string, unknown>)[key] as string} />
                    ))}
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
