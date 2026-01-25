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
                  {report.websiteUrl} — {MONTH_LABELS[report.reportMonth] ?? report.reportMonth} {report.reportYear}
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
                {["overview", "traffic", "keywords", "conversions", "backlinks", "technical", "local", "top-pages"].map((v) => (
                  <TabsTrigger key={v} value={v} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    {v === "top-pages" ? "Top pages" : v.charAt(0).toUpperCase() + v.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="flex-1">
                <div className="p-4 md:p-6">
                  <TabsContent value="overview" className="mt-0 space-y-4">
                    <div className="flex gap-2 items-center">
                      <Badge variant={report.status === "FINAL" ? "default" : "secondary"}>{report.status}</Badge>
                      {report.dataSource && <Badge variant="outline">{report.dataSource}</Badge>}
                    </div>
                    <Field label="Website" value={report.websiteUrl} />
                    <Field label="Period" value={`${MONTH_LABELS[report.reportMonth] ?? report.reportMonth} ${report.reportYear}`} />
                    <Field label="Comparison" value={report.comparisonType} />
                    <Field label="Data source" value={report.dataSource} />
                    {report.executiveSummary && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-1">Executive summary</p>
                        <p className="text-sm whitespace-pre-wrap">{report.executiveSummary}</p>
                      </div>
                    )}
                    {report.recommendations && (
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-1">Recommendations</p>
                        <p className="text-sm whitespace-pre-wrap">{report.recommendations}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="traffic" className="mt-0 space-y-1">
                    {["organicSessions", "organicSessionsPrevious", "organicUsers", "organicUsersPrevious", "organicNewUsers", "bounceRate", "bounceRatePrevious", "avgSessionDurationSeconds", "pagesPerSession", "engagedSessions", "organicSessionsDesktop", "organicSessionsMobile", "organicSessionsTablet", "organicSessionsUnbranded"].map((k) => (
                      <Field key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} value={(report as Record<string, unknown>)[k] as string} />
                    ))}
                  </TabsContent>

                  <TabsContent value="keywords" className="mt-0 space-y-1">
                    {["keywordsTracked", "keywordsTop3", "keywordsTop10", "keywordsTop20", "avgPosition", "avgPositionPrevious", "searchVisibility", "impressions", "impressionsPrevious", "clicks", "clicksPrevious", "avgCtr", "keywordsGained", "keywordsLost"].map((k) => (
                      <Field key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} value={(report as Record<string, unknown>)[k] as string} />
                    ))}
                  </TabsContent>

                  <TabsContent value="conversions" className="mt-0 space-y-1">
                    {["conversions", "conversionsPrevious", "conversionRate", "conversionRatePrevious", "conversionsFromOrganic", "leadsOrFormSubmissions", "costPerConversion", "bestConvertingPageUrl"].map((k) => (
                      <Field key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} value={(report as Record<string, unknown>)[k] as string} />
                    ))}
                  </TabsContent>

                  <TabsContent value="backlinks" className="mt-0 space-y-1">
                    {["totalBacklinks", "referringDomains", "referringDomainsPrevious", "newReferringDomains", "lostReferringDomains", "newBacklinks", "lostBacklinks", "dofollowBacklinks", "domainRating", "domainRatingPrevious", "domainAuthority", "domainAuthorityPrevious", "urlRating", "spamScore"].map((k) => (
                      <Field key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} value={(report as Record<string, unknown>)[k] as string} />
                    ))}
                  </TabsContent>

                  <TabsContent value="technical" className="mt-0 space-y-1">
                    {["siteAuditScore", "siteAuditScorePrevious", "pagesCrawled", "pagesWithErrors", "pagesWithErrorsPrevious", "pagesWithWarnings", "indexedPages", "lcpMs", "inpMs", "cls", "coreWebVitalsPassed", "mobileUsabilityIssues", "avgPageLoadTimeMs"].map((k) => (
                      <Field
                        key={k}
                        label={k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                        value={k === "coreWebVitalsPassed" ? (report.coreWebVitalsPassed == null ? undefined : report.coreWebVitalsPassed ? "Yes" : "No") : (report as Record<string, unknown>)[k] as string}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="local" className="mt-0 space-y-1">
                    {["gmbViews", "gmbSearches", "gmbActions", "gmbCalls", "gmbDirectionRequests", "gmbWebsiteClicks", "gmbReviewsCount", "gmbAverageRating", "localRanking"].map((k) => (
                      <Field key={k} label={k.replace(/^gmb/, "GMB ").replace(/([A-Z])/g, " $1")} value={(report as Record<string, unknown>)[k] as string} />
                    ))}
                  </TabsContent>

                  <TabsContent value="top-pages" className="mt-0">
                    {report.topPages && report.topPages.length > 0 ? (
                      <div className="space-y-3">
                        {report.topPages.map((p, i) => (
                          <div key={p.id} className="rounded border p-3 space-y-1">
                            <div className="font-medium text-sm truncate">{p.url}</div>
                            {p.pageTitle && <div className="text-muted-foreground text-sm">{p.pageTitle}</div>}
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              {p.clicks != null && p.clicks !== "" && <span>Clicks: {p.clicks}</span>}
                              {p.impressions != null && p.impressions !== "" && <span>Impressions: {p.impressions}</span>}
                              {p.sessions != null && p.sessions !== "" && <span>Sessions: {p.sessions}</span>}
                              {p.conversions != null && p.conversions !== "" && <span>Conversions: {p.conversions}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No top pages added.</p>
                    )}
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
