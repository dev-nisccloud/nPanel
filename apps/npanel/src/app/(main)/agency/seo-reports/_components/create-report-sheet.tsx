"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { MONTH_LABELS } from "./schema";

const topPageSchema = z.object({
  url: z.string().min(1, "URL is required"),
  pageTitle: z.string().optional(),
  clicks: z.string().optional(),
  impressions: z.string().optional(),
  sessions: z.string().optional(),
  conversions: z.string().optional(),
});

const formSchema = z.object({
  reportMonth: z.string().min(1, "Month is required"),
  reportYear: z.string().min(1, "Year is required"),
  websiteUrl: z.string().min(1, "Website is required"),
  teamId: z.string().optional(),
  comparisonType: z.enum(["PREVIOUS_MONTH", "SAME_MONTH_LAST_YEAR", "NONE"]).optional(),
  dataSource: z.string().optional(),
  status: z.enum(["DRAFT", "FINAL"]).optional(),
  executiveSummary: z.string().optional(),
  recommendations: z.string().optional(),

  organicSessions: z.string().optional(),
  organicSessionsPrevious: z.string().optional(),
  organicUsers: z.string().optional(),
  organicUsersPrevious: z.string().optional(),
  organicNewUsers: z.string().optional(),
  bounceRate: z.string().optional(),
  bounceRatePrevious: z.string().optional(),
  avgSessionDurationSeconds: z.string().optional(),
  pagesPerSession: z.string().optional(),
  engagedSessions: z.string().optional(),
  organicSessionsDesktop: z.string().optional(),
  organicSessionsMobile: z.string().optional(),
  organicSessionsTablet: z.string().optional(),
  organicSessionsUnbranded: z.string().optional(),

  keywordsTracked: z.string().optional(),
  keywordsTop3: z.string().optional(),
  keywordsTop10: z.string().optional(),
  keywordsTop20: z.string().optional(),
  avgPosition: z.string().optional(),
  avgPositionPrevious: z.string().optional(),
  searchVisibility: z.string().optional(),
  impressions: z.string().optional(),
  impressionsPrevious: z.string().optional(),
  clicks: z.string().optional(),
  clicksPrevious: z.string().optional(),
  avgCtr: z.string().optional(),
  keywordsGained: z.string().optional(),
  keywordsLost: z.string().optional(),

  conversions: z.string().optional(),
  conversionsPrevious: z.string().optional(),
  conversionRate: z.string().optional(),
  conversionRatePrevious: z.string().optional(),
  conversionsFromOrganic: z.string().optional(),
  leadsOrFormSubmissions: z.string().optional(),
  costPerConversion: z.string().optional(),
  bestConvertingPageUrl: z.string().optional(),

  totalBacklinks: z.string().optional(),
  referringDomains: z.string().optional(),
  referringDomainsPrevious: z.string().optional(),
  newReferringDomains: z.string().optional(),
  lostReferringDomains: z.string().optional(),
  newBacklinks: z.string().optional(),
  lostBacklinks: z.string().optional(),
  dofollowBacklinks: z.string().optional(),
  domainRating: z.string().optional(),
  domainRatingPrevious: z.string().optional(),
  domainAuthority: z.string().optional(),
  domainAuthorityPrevious: z.string().optional(),
  urlRating: z.string().optional(),
  spamScore: z.string().optional(),

  siteAuditScore: z.string().optional(),
  siteAuditScorePrevious: z.string().optional(),
  pagesCrawled: z.string().optional(),
  pagesWithErrors: z.string().optional(),
  pagesWithErrorsPrevious: z.string().optional(),
  pagesWithWarnings: z.string().optional(),
  indexedPages: z.string().optional(),
  lcpMs: z.string().optional(),
  inpMs: z.string().optional(),
  cls: z.string().optional(),
  coreWebVitalsPassed: z.boolean().optional().nullable(),
  mobileUsabilityIssues: z.string().optional(),
  avgPageLoadTimeMs: z.string().optional(),

  gmbViews: z.string().optional(),
  gmbSearches: z.string().optional(),
  gmbActions: z.string().optional(),
  gmbCalls: z.string().optional(),
  gmbDirectionRequests: z.string().optional(),
  gmbWebsiteClicks: z.string().optional(),
  gmbReviewsCount: z.string().optional(),
  gmbAverageRating: z.string().optional(),
  localRanking: z.string().optional(),

  topPages: z.array(topPageSchema).optional(),
});
type FormData = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: "Context & period" },
  { id: 2, title: "Traffic & engagement" },
  { id: 3, title: "Keywords & rankings" },
  { id: 4, title: "Conversions & backlinks" },
  { id: 5, title: "Technical, local & top pages" },
] as const;

interface CreateReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

export function CreateReportSheet({ open, onOpenChange, onSuccess }: CreateReportSheetProps) {
  const [step, setStep] = React.useState(1);
  const utils = trpc.useUtils();

  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery(undefined, { enabled: open });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportMonth: "",
      reportYear: String(currentYear),
      websiteUrl: "",
      teamId: "",
      comparisonType: "NONE",
      dataSource: "",
      status: "DRAFT",
      executiveSummary: "",
      recommendations: "",
      organicSessions: "",
      organicSessionsPrevious: "",
      organicUsers: "",
      organicUsersPrevious: "",
      organicNewUsers: "",
      bounceRate: "",
      bounceRatePrevious: "",
      avgSessionDurationSeconds: "",
      pagesPerSession: "",
      engagedSessions: "",
      organicSessionsDesktop: "",
      organicSessionsMobile: "",
      organicSessionsTablet: "",
      organicSessionsUnbranded: "",
      keywordsTracked: "",
      keywordsTop3: "",
      keywordsTop10: "",
      keywordsTop20: "",
      avgPosition: "",
      avgPositionPrevious: "",
      searchVisibility: "",
      impressions: "",
      impressionsPrevious: "",
      clicks: "",
      clicksPrevious: "",
      avgCtr: "",
      keywordsGained: "",
      keywordsLost: "",
      conversions: "",
      conversionsPrevious: "",
      conversionRate: "",
      conversionRatePrevious: "",
      conversionsFromOrganic: "",
      leadsOrFormSubmissions: "",
      costPerConversion: "",
      bestConvertingPageUrl: "",
      totalBacklinks: "",
      referringDomains: "",
      referringDomainsPrevious: "",
      newReferringDomains: "",
      lostReferringDomains: "",
      newBacklinks: "",
      lostBacklinks: "",
      dofollowBacklinks: "",
      domainRating: "",
      domainRatingPrevious: "",
      domainAuthority: "",
      domainAuthorityPrevious: "",
      urlRating: "",
      spamScore: "",
      siteAuditScore: "",
      siteAuditScorePrevious: "",
      pagesCrawled: "",
      pagesWithErrors: "",
      pagesWithErrorsPrevious: "",
      pagesWithWarnings: "",
      indexedPages: "",
      lcpMs: "",
      inpMs: "",
      cls: "",
      coreWebVitalsPassed: null,
      mobileUsabilityIssues: "",
      avgPageLoadTimeMs: "",
      gmbViews: "",
      gmbSearches: "",
      gmbActions: "",
      gmbCalls: "",
      gmbDirectionRequests: "",
      gmbWebsiteClicks: "",
      gmbReviewsCount: "",
      gmbAverageRating: "",
      localRanking: "",
      topPages: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "topPages" });

  const createMutation = trpc.seoReports.create.useMutation({
    onSuccess: () => {
      toast.success("SEO report created");
      form.reset();
      setStep(1);
      onOpenChange(false);
      utils.seoReports.list.invalidate();
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || "Failed to create report"),
  });

  const toPayload = (d: FormData) => {
    const strip = (s: string | undefined) => (s == null || s === "" ? undefined : s);
    return {
      teamId: d.teamId && d.teamId !== "" ? d.teamId : undefined,
      reportMonth: d.reportMonth,
      reportYear: d.reportYear,
      websiteUrl: d.websiteUrl,
      comparisonType: d.comparisonType,
      dataSource: strip(d.dataSource),
      status: d.status,
      executiveSummary: strip(d.executiveSummary),
      recommendations: strip(d.recommendations),
      organicSessions: strip(d.organicSessions),
      organicSessionsPrevious: strip(d.organicSessionsPrevious),
      organicUsers: strip(d.organicUsers),
      organicUsersPrevious: strip(d.organicUsersPrevious),
      organicNewUsers: strip(d.organicNewUsers),
      bounceRate: strip(d.bounceRate),
      bounceRatePrevious: strip(d.bounceRatePrevious),
      avgSessionDurationSeconds: strip(d.avgSessionDurationSeconds),
      pagesPerSession: strip(d.pagesPerSession),
      engagedSessions: strip(d.engagedSessions),
      organicSessionsDesktop: strip(d.organicSessionsDesktop),
      organicSessionsMobile: strip(d.organicSessionsMobile),
      organicSessionsTablet: strip(d.organicSessionsTablet),
      organicSessionsUnbranded: strip(d.organicSessionsUnbranded),
      keywordsTracked: strip(d.keywordsTracked),
      keywordsTop3: strip(d.keywordsTop3),
      keywordsTop10: strip(d.keywordsTop10),
      keywordsTop20: strip(d.keywordsTop20),
      avgPosition: strip(d.avgPosition),
      avgPositionPrevious: strip(d.avgPositionPrevious),
      searchVisibility: strip(d.searchVisibility),
      impressions: strip(d.impressions),
      impressionsPrevious: strip(d.impressionsPrevious),
      clicks: strip(d.clicks),
      clicksPrevious: strip(d.clicksPrevious),
      avgCtr: strip(d.avgCtr),
      keywordsGained: strip(d.keywordsGained),
      keywordsLost: strip(d.keywordsLost),
      conversions: strip(d.conversions),
      conversionsPrevious: strip(d.conversionsPrevious),
      conversionRate: strip(d.conversionRate),
      conversionRatePrevious: strip(d.conversionRatePrevious),
      conversionsFromOrganic: strip(d.conversionsFromOrganic),
      leadsOrFormSubmissions: strip(d.leadsOrFormSubmissions),
      costPerConversion: strip(d.costPerConversion),
      bestConvertingPageUrl: strip(d.bestConvertingPageUrl),
      totalBacklinks: strip(d.totalBacklinks),
      referringDomains: strip(d.referringDomains),
      referringDomainsPrevious: strip(d.referringDomainsPrevious),
      newReferringDomains: strip(d.newReferringDomains),
      lostReferringDomains: strip(d.lostReferringDomains),
      newBacklinks: strip(d.newBacklinks),
      lostBacklinks: strip(d.lostBacklinks),
      dofollowBacklinks: strip(d.dofollowBacklinks),
      domainRating: strip(d.domainRating),
      domainRatingPrevious: strip(d.domainRatingPrevious),
      domainAuthority: strip(d.domainAuthority),
      domainAuthorityPrevious: strip(d.domainAuthorityPrevious),
      urlRating: strip(d.urlRating),
      spamScore: strip(d.spamScore),
      siteAuditScore: strip(d.siteAuditScore),
      siteAuditScorePrevious: strip(d.siteAuditScorePrevious),
      pagesCrawled: strip(d.pagesCrawled),
      pagesWithErrors: strip(d.pagesWithErrors),
      pagesWithErrorsPrevious: strip(d.pagesWithErrorsPrevious),
      pagesWithWarnings: strip(d.pagesWithWarnings),
      indexedPages: strip(d.indexedPages),
      lcpMs: strip(d.lcpMs),
      inpMs: strip(d.inpMs),
      cls: strip(d.cls),
      coreWebVitalsPassed: d.coreWebVitalsPassed ?? undefined,
      mobileUsabilityIssues: strip(d.mobileUsabilityIssues),
      avgPageLoadTimeMs: strip(d.avgPageLoadTimeMs),
      gmbViews: strip(d.gmbViews),
      gmbSearches: strip(d.gmbSearches),
      gmbActions: strip(d.gmbActions),
      gmbCalls: strip(d.gmbCalls),
      gmbDirectionRequests: strip(d.gmbDirectionRequests),
      gmbWebsiteClicks: strip(d.gmbWebsiteClicks),
      gmbReviewsCount: strip(d.gmbReviewsCount),
      gmbAverageRating: strip(d.gmbAverageRating),
      localRanking: strip(d.localRanking),
      topPages: (d.topPages ?? []).map((p, i) => ({
        url: p.url,
        pageTitle: p.pageTitle || undefined,
        clicks: p.clicks || undefined,
        impressions: p.impressions || undefined,
        sessions: p.sessions || undefined,
        conversions: p.conversions || undefined,
        order: i,
      })),
    };
  };

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(toPayload(data));
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) setStep(1);
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <SheetTitle>Create SEO report</SheetTitle>
          <SheetDescription>
            Step {step} of 5: {STEPS[step - 1]?.title}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6 pr-4">
          <Form {...form}>
            <form id="seo-create-form" onSubmit={onSubmit} className="space-y-6 pb-6">
              {/* Step 1: Context */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="reportMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Month</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select month" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(MONTH_LABELS).map(([v, l]) => (
                                <SelectItem key={v} value={v}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reportYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {YEARS.map((y) => (
                                <SelectItem key={y} value={y}>{y}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com or https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teamId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team (optional)</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                          value={field.value && field.value !== "" ? field.value : "__none__"}
                          disabled={teamsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {teams?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="comparisonType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comparison</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "NONE"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="NONE">None</SelectItem>
                              <SelectItem value="PREVIOUS_MONTH">Previous month</SelectItem>
                              <SelectItem value="SAME_MONTH_LAST_YEAR">Same month last year</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "DRAFT"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="FINAL">Final</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="dataSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data source (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Google Search Console, Ahrefs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="executiveSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Executive summary (optional)</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="High-level overview…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="recommendations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recommendations (optional)</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder="Next steps…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Traffic */}
              {step === 2 && (
                <div className="space-y-4">
                  {["organicSessions", "organicSessionsPrevious", "organicUsers", "organicUsersPrevious", "organicNewUsers", "bounceRate", "bounceRatePrevious", "avgSessionDurationSeconds", "pagesPerSession", "engagedSessions", "organicSessionsDesktop", "organicSessionsMobile", "organicSessionsTablet", "organicSessionsUnbranded"].map((n) => (
                    <FormField
                      key={n}
                      control={form.control}
                      name={n as keyof FormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{n.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="—" onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Step 3: Keywords */}
              {step === 3 && (
                <div className="space-y-4">
                  {["keywordsTracked", "keywordsTop3", "keywordsTop10", "keywordsTop20", "avgPosition", "avgPositionPrevious", "searchVisibility", "impressions", "impressionsPrevious", "clicks", "clicksPrevious", "avgCtr", "keywordsGained", "keywordsLost"].map((n) => (
                    <FormField
                      key={n}
                      control={form.control}
                      name={n as keyof FormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{n.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="—" onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Step 4: Conversions & Backlinks */}
              {step === 4 && (
                <div className="space-y-4">
                  {["conversions", "conversionsPrevious", "conversionRate", "conversionRatePrevious", "conversionsFromOrganic", "leadsOrFormSubmissions", "costPerConversion", "bestConvertingPageUrl", "totalBacklinks", "referringDomains", "referringDomainsPrevious", "newReferringDomains", "lostReferringDomains", "newBacklinks", "lostBacklinks", "dofollowBacklinks", "domainRating", "domainRatingPrevious", "domainAuthority", "domainAuthorityPrevious", "urlRating", "spamScore"].map((n) => (
                    <FormField
                      key={n}
                      control={form.control}
                      name={n as keyof FormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{n.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="—" onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Step 5: Technical, Local, Top pages */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {["siteAuditScore", "siteAuditScorePrevious", "pagesCrawled", "pagesWithErrors", "pagesWithErrorsPrevious", "pagesWithWarnings", "indexedPages", "lcpMs", "inpMs", "cls", "mobileUsabilityIssues", "avgPageLoadTimeMs"].map((n) => (
                      <FormField
                        key={n}
                        control={form.control}
                        name={n as keyof FormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{n.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="—" onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                    <FormField
                      control={form.control}
                      name="coreWebVitalsPassed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Core Web Vitals passed</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(v === "yes" ? true : v === "no" ? false : null)}
                            value={field.value === true ? "yes" : field.value === false ? "no" : "—"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="—">—</SelectItem>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Local SEO (GMB)</h4>
                    {["gmbViews", "gmbSearches", "gmbActions", "gmbCalls", "gmbDirectionRequests", "gmbWebsiteClicks", "gmbReviewsCount", "gmbAverageRating", "localRanking"].map((n) => (
                      <FormField
                        key={n}
                        control={form.control}
                        name={n as keyof FormData}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{n.replace(/^gmb/, "GMB ").replace(/([A-Z])/g, " $1")}</FormLabel>
                            <FormControl>
                              <Input type="text" placeholder="—" onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Top landing pages</h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ url: "" })}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>
                    {fields.map((f, i) => (
                      <div key={f.id} className="flex gap-2 items-start rounded border p-3">
                        <div className="flex-1 grid grid-cols-1 gap-2">
                          <FormField
                            control={form.control}
                            name={`topPages.${i}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">URL</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://…" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`topPages.${i}.pageTitle`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Title</FormLabel>
                                <FormControl>
                                  <Input onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-4 gap-2">
                            {(["clicks", "impressions", "sessions", "conversions"] as const).map((k) => (
                              <FormField
                                key={k}
                                control={form.control}
                                name={`topPages.${i}.${k}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">{k}</FormLabel>
                                    <FormControl>
                                      <Input onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} className="shrink-0">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 flex-shrink-0 border-t flex-row justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < 5 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button form="seo-create-form" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <><Spinner size={16} className="mr-2" /> Creating…</> : "Create report"}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
