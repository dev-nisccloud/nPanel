"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
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

const formSchema = z.object({
  reportName: z.string().min(1, "Report name is required"),
  reportMonth: z.string().min(1, "Month is required"),
  reportYear: z.string().min(1, "Year is required"),
  websiteUrl: z.string().optional(),
  teamId: z.string().optional(),
  status: z.enum(["DRAFT", "FINAL"]).optional(),
  recommendations: z.string().optional(),

  sessions: z.string().optional(),
  totalWebTraffic: z.string().optional(),
  totalViews: z.string().optional(),
  bounceRate: z.string().optional(),
  users: z.string().optional(),
  returningUsers: z.string().optional(),
  eventCount: z.string().optional(),
  conversions: z.string().optional(),
  sessionDuration: z.string().optional(),
  engagedSessions: z.string().optional(),
  sessionsDesktop: z.string().optional(),
  sessionsMobile: z.string().optional(),
  sessionsTablet: z.string().optional(),
  formSubmissions: z.string().optional(),
  impressions: z.string().optional(),
  clicks: z.string().optional(),
});
type FormData = z.infer<typeof formSchema>;

interface EditReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: string | null;
  onSuccess?: () => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

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

function strip(s: string | undefined): string | undefined {
  if (s == null || s === "") return undefined;
  return s;
}

export function EditReportSheet({ open, onOpenChange, reportId, onSuccess }: EditReportSheetProps) {
  const utils = trpc.useUtils();

  const { data: report, isLoading: isLoadingReport } = trpc.seoReports.getById.useQuery(
    { id: reportId! },
    { enabled: open && !!reportId }
  );

  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery(undefined, { enabled: open });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reportName: "",
      reportMonth: "",
      reportYear: String(currentYear),
      websiteUrl: "",
      teamId: "",
      status: "DRAFT",
      recommendations: "",
      sessions: "",
      totalWebTraffic: "",
      totalViews: "",
      bounceRate: "",
      users: "",
      returningUsers: "",
      eventCount: "",
      conversions: "",
      sessionDuration: "",
      engagedSessions: "",
      sessionsDesktop: "",
      sessionsMobile: "",
      sessionsTablet: "",
      formSubmissions: "",
      impressions: "",
      clicks: "",
    },
  });

  // Reset form when report loads
  React.useEffect(() => {
    if (!report) return;
    form.reset({
      reportName: report.reportName ?? "",
      reportMonth: report.reportMonth ?? "",
      reportYear: report.reportYear ?? "",
      websiteUrl: report.websiteUrl ?? "",
      teamId: report.teamId ?? "",
      status: report.status ?? "DRAFT",
      recommendations: report.recommendations ?? "",
      sessions: report.sessions ?? "",
      totalWebTraffic: report.totalWebTraffic ?? "",
      totalViews: report.totalViews ?? "",
      bounceRate: report.bounceRate ?? "",
      users: report.users ?? "",
      returningUsers: report.returningUsers ?? "",
      eventCount: report.eventCount ?? "",
      conversions: report.conversions ?? "",
      sessionDuration: report.sessionDuration ?? "",
      engagedSessions: report.engagedSessions ?? "",
      sessionsDesktop: report.sessionsDesktop ?? "",
      sessionsMobile: report.sessionsMobile ?? "",
      sessionsTablet: report.sessionsTablet ?? "",
      formSubmissions: report.formSubmissions ?? "",
      impressions: report.impressions ?? "",
      clicks: report.clicks ?? "",
    });
  }, [report, form.reset]);

  const updateMutation = trpc.seoReports.update.useMutation({
    onSuccess: () => {
      toast.success("Report updated");
      onOpenChange(false);
      utils.seoReports.list.invalidate();
      utils.seoReports.getById.invalidate({ id: reportId! });
      onSuccess?.();
    },
    onError: (e) => toast.error(e.message || "Failed to update report"),
  });

  const onSubmit = form.handleSubmit((data) => {
    if (!reportId) return;
    const dirtyFields = form.formState.dirtyFields as Partial<Record<keyof FormData, boolean>>;
    // Build partial payload: id + only dirty fields. Skip required fields if empty (partial update = leave unchanged).
    const payload: Record<string, unknown> = { id: reportId };
    (Object.keys(dirtyFields) as (keyof FormData)[]).forEach((k) => {
      if (!dirtyFields[k]) return;
      const v = data[k];
      if (k === "reportName" || k === "reportMonth" || k === "reportYear") {
        if (v == null || String(v).trim() === "") return; // don't send empty required fields
        payload[k] = v;
      } else if (k === "teamId") {
        payload[k] = v && v !== "" ? v : null;
      } else if (k === "websiteUrl" || k === "recommendations" || k.startsWith("sessions") || k === "totalWebTraffic" || k === "totalViews" || k === "bounceRate" || k === "users" || k === "returningUsers" || k === "eventCount" || k === "conversions" || k === "sessionDuration" || k === "engagedSessions" || k === "formSubmissions" || k === "impressions" || k === "clicks") {
        payload[k] = strip(v as string) ?? null;
      } else {
        payload[k] = v;
      }
    });
    updateMutation.mutate(payload as { id: string } & Partial<FormData>);
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const isEmpty = !reportId || !open;
  const isFormReady = report && !isLoadingReport;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <SheetTitle>Edit SEO report</SheetTitle>
          <SheetDescription>
            Update any fields you need. Only changed fields are sent (partial update).
          </SheetDescription>
        </SheetHeader>

        {isLoadingReport && (
          <div className="flex-1 flex items-center justify-center py-12">
            <Spinner size={32} />
          </div>
        )}

        {!isEmpty && !isLoadingReport && !report && (
          <div className="flex-1 flex items-center justify-center py-12 text-destructive text-sm">
            Report not found.
          </div>
        )}

        {isFormReady && (
          <ScrollArea className="flex-1 min-h-0 px-6 pr-4">
            <Form {...form}>
              <form id="seo-edit-form" onSubmit={onSubmit} className="space-y-6 pb-6">
                {/* Report name & period */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Report name & period</h4>
                  <FormField
                    control={form.control}
                    name="reportName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Report name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Acme Corp — January 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <FormLabel>Website (optional)</FormLabel>
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

                {/* Traffic & engagement */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Traffic & engagement</h4>
                  {TRAFFIC_FIELDS.map(({ key, label }) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key as keyof FormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="—" {...field} value={String(field.value ?? "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                {/* Goals & search */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Goals & search</h4>
                  {GOALS_FIELDS.map(({ key, label }) => (
                    <FormField
                      key={key}
                      control={form.control}
                      name={key as keyof FormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="—" {...field} value={String(field.value ?? "")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </form>
            </Form>
          </ScrollArea>
        )}

        {isFormReady && (
          <SheetFooter className="px-6 py-4 flex-shrink-0 border-t">
            <Button
              form="seo-edit-form"
              type="submit"
              disabled={updateMutation.isPending || !form.formState.isDirty}
            >
              {updateMutation.isPending ? (
                <><Spinner size={16} className="mr-2" /> Saving…</>
              ) : (
                "Save changes"
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
