"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

// Steps grouped by new data format (no top pages)
const STEPS = [
  { id: 1, title: "Report name & period" },
  { id: 2, title: "Traffic & engagement" },
  { id: 3, title: "Goals & search" },
] as const;

interface CreateReportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

const STEP2_FIELDS = [
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

const STEP3_FIELDS = [
  { key: "eventCount", label: "Event count" },
  { key: "conversions", label: "Conversions" },
  { key: "formSubmissions", label: "Form submissions" },
  { key: "impressions", label: "Impressions" },
  { key: "clicks", label: "Clicks" },
] as const;

export function CreateReportSheet({ open, onOpenChange, onSuccess }: CreateReportSheetProps) {
  const [step, setStep] = React.useState(1);
  const utils = trpc.useUtils();

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
      reportName: d.reportName ?? "",
      reportMonth: d.reportMonth ?? "",
      reportYear: d.reportYear ?? "",
      websiteUrl: strip(d.websiteUrl),
      status: d.status,
      recommendations: strip(d.recommendations),
      sessions: strip(d.sessions),
      totalWebTraffic: strip(d.totalWebTraffic),
      totalViews: strip(d.totalViews),
      bounceRate: strip(d.bounceRate),
      users: strip(d.users),
      returningUsers: strip(d.returningUsers),
      eventCount: strip(d.eventCount),
      conversions: strip(d.conversions),
      sessionDuration: strip(d.sessionDuration),
      engagedSessions: strip(d.engagedSessions),
      sessionsDesktop: strip(d.sessionsDesktop),
      sessionsMobile: strip(d.sessionsMobile),
      sessionsTablet: strip(d.sessionsTablet),
      formSubmissions: strip(d.formSubmissions),
      impressions: strip(d.impressions),
      clicks: strip(d.clicks),
    };
  };

  const onSubmit = form.handleSubmit((data) => {
    createMutation.mutate(toPayload(data));
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) setStep(1);
    onOpenChange(next);
  };

  const totalSteps = STEPS.length;
  const isLastStep = step === totalSteps;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <SheetTitle>Create SEO report</SheetTitle>
          <SheetDescription>
            Step {step} of {totalSteps}: {STEPS[step - 1]?.title}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-6 pr-4">
          <Form {...form}>
            <form id="seo-create-form" onSubmit={onSubmit} className="space-y-6 pb-6">
              {/* Step 1: Report name & period — always mounted so values persist on submit */}
              <div className="space-y-4" style={{ display: step === 1 ? undefined : "none" }}>
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

              {/* Step 2: Traffic & engagement — always mounted */}
              <div className="space-y-4" style={{ display: step === 2 ? undefined : "none" }}>
                {STEP2_FIELDS.map(({ key, label }) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="—" onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              {/* Step 3: Goals & search — always mounted */}
              <div className="space-y-4" style={{ display: step === 3 ? undefined : "none" }}>
                {STEP3_FIELDS.map(({ key, label }) => (
                  <FormField
                    key={key}
                    control={form.control}
                    name={key as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="—" onChange={field.onChange} onBlur={field.onBlur} ref={field.ref} value={String(field.value ?? "")} />
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

        <SheetFooter className="px-6 py-4 flex-shrink-0 border-t flex-row justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!isLastStep ? (
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
