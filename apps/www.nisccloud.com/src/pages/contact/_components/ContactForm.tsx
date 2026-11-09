import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { trpcMutation } from "@/lib/domain-search/api.ts";
import { trackEvent } from "@/lib/track.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  service: z.string().min(1, "Please select a service"),
  budget: z.string().optional(),
  message: z.string().min(20, "Please tell us a bit more (at least 20 characters)"),
  scale: z.string().max(120).optional(),
  environment: z.string().max(200).optional(),
  migration: z.string().optional(),
  startDate: z.string().optional(),
  website: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const services = [
  { value: "create", label: "Brand & Web Design" },
  { value: "launch", label: "Cloud Hosting" },
  { value: "market", label: "Digital Marketing" },
  { value: "automate", label: "Marketing Automation" },
  { value: "full", label: "Full Growth Stack" },
  { value: "custom", label: "Custom / Not sure yet" },
];

const budgets = [
  { value: "under-50k", label: "Under KES 50,000" },
  { value: "50k-150k", label: "KES 50,000 – 150,000" },
  { value: "150k-500k", label: "KES 150,000 – 500,000" },
  { value: "500k-plus", label: "KES 500,000+" },
  { value: "not-sure", label: "Not sure yet" },
];

const migrationOptions = [
  { value: "yes", label: "Yes, we need to move existing services" },
  { value: "no", label: "No, this is a new setup" },
  { value: "not-sure", label: "Not sure yet" },
];

const startOptions = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-month", label: "Within a month" },
  { value: "1-3-months", label: "In 1 to 3 months" },
  { value: "later", label: "Later / planning ahead" },
];

/** Bots that fill the hidden field or submit within seconds get a fake success and no lead. */
const MIN_FILL_MS = 3000;

function optionLabel(list: { value: string; label: string }[], value?: string) {
  return list.find((item) => item.value === value)?.label;
}

const nextSteps = [
  { step: "1", label: "Send this form" },
  { step: "2", label: "Free strategy call" },
  { step: "3", label: "Clear proposal" },
];

/** Only values from the service list are accepted from `?service=`; anything else is ignored. */
function allowedService(value: string | null): string {
  return value && services.some((item) => item.value === value) ? value : "";
}

/** Prefilled text is capped so a crafted URL cannot inject an oversized message. */
function sanitizedMessage(value: string | null): string {
  let clean = "";
  for (const char of value ?? "") {
    const code = char.charCodeAt(0);
    clean += code < 0x20 || code === 0x7f ? " " : char;
  }
  return clean.trim().slice(0, 2000);
}

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);
  const [searchParams] = useSearchParams();

  const prefilledServiceName = searchParams.get("serviceName")?.slice(0, 80) ?? null;
  const prefilledPlan = searchParams.get("plan")?.slice(0, 80) ?? null;
  const prefilledPlanPrice = searchParams.get("planPrice");
  const prefilledPlanPeriod = searchParams.get("planPeriod");
  const isCorporate = searchParams.get("tier") === "corporate";
  const [openedAt] = useState(() => Date.now());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      service: allowedService(searchParams.get("service")),
      budget: "",
      message: sanitizedMessage(searchParams.get("message")),
      scale: "",
      environment: "",
      migration: "",
      startDate: "",
      website: "",
    },
  });

  useEffect(() => {
    const service = allowedService(searchParams.get("service"));
    const message = sanitizedMessage(searchParams.get("message"));
    const updates: Partial<FormData> = {};
    if (service) updates.service = service;
    if (message) updates.message = message;
    if (Object.keys(updates).length > 0) {
      reset((current) => ({ ...current, ...updates }));
    }
  }, [searchParams, reset]);

  const serviceValue = watch("service");
  const budgetValue = watch("budget");
  const migrationValue = watch("migration");
  const startValue = watch("startDate");

  const markStarted = () => {
    if (started) return;
    setStarted(true);
    trackEvent("contact_form_start", {
      prefilled_service: allowedService(searchParams.get("service")) || "none",
      has_plan: Boolean(prefilledPlan),
    });
  };

  const onSubmit = async (data: FormData) => {
    if (data.website || Date.now() - openedAt < MIN_FILL_MS) {
      setSubmitted(true);
      return;
    }
    const details = isCorporate
      ? [
          ["Users, mailboxes or sites", data.scale?.trim()],
          ["Current environment", data.environment?.trim()],
          ["Migration needed", optionLabel(migrationOptions, data.migration)],
          ["Preferred start", optionLabel(startOptions, data.startDate)],
        ].filter((row): row is [string, string] => Boolean(row[1]))
      : [];
    const message = details.length
      ? `${data.message}\n\nOrganisation details\n${details.map(([k, v]) => `${k}: ${v}`).join("\n")}`
      : data.message;
    try {
      await trpcMutation("storefront.leads.submit", {
        name: data.name,
        email: data.email,
        company: data.company?.trim() || undefined,
        service: data.service,
        serviceName: prefilledServiceName ?? undefined,
        budget: data.budget || undefined,
        message,
        plan: prefilledPlan ?? undefined,
        planPrice: prefilledPlanPrice ?? undefined,
        source: "contact",
      });
      setSubmitted(true);
      trackEvent("contact_form_submit_success", {
        service: data.service,
        budget: data.budget || "unspecified",
        has_plan: Boolean(prefilledPlan),
      });
      toast.success("Message sent! We'll be in touch within 24 hours.");
    } catch (error) {
      trackEvent("contact_form_submit_error", { service: data.service });
      toast.error(error instanceof Error ? error.message : "Could not send your message. Please try again.");
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-border/60 bg-card px-8 py-12 text-center"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle size={28} className="text-primary" />
        </div>
        <h3 className="mb-2 text-xl font-bold tracking-tight">Message received</h3>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
          Thanks for reaching out. Someone on our team will review your message and follow up within
          24 hours.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
        <h2 className="mb-1 text-lg font-bold tracking-tight md:text-xl">Send us a message</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {isCorporate
            ? "Tell us what you need and we will come back with a tailored proposal. Only the starred fields are required."
            : "A few details are enough. We will get back to you with a clear plan."}
        </p>

        {prefilledPlan && prefilledServiceName ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Inquiring about: {prefilledServiceName} · {prefilledPlan}
              </p>
              {isCorporate ? (
                <p className="mt-0.5 text-muted-foreground">Custom pricing · tailored proposal</p>
              ) : prefilledPlanPrice ? (
                <p className="mt-0.5 text-muted-foreground">
                  KES {Number(prefilledPlanPrice).toLocaleString()}
                  {prefilledPlanPeriod
                    ? `/${prefilledPlanPeriod.replace(/^mo$/i, "month").replace(/^yr$/i, "year")}`
                    : ""}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} onFocusCapture={markStarted} className="relative space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Full name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Jane Wanjiku"
                {...register("name")}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">
                {isCorporate ? "Business email" : "Email"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                {...register("email")}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">{isCorporate ? "Company" : "Company / brand"}</Label>
            <Input id="company" placeholder={isCorporate ? "Organisation name" : "Optional"} {...register("company")} />
          </div>

          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Service <span className="text-destructive">*</span>
              </Label>
              <Select
                value={serviceValue ?? ""}
                onValueChange={(v) => setValue("service", v, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.service ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service && (
                <p className="text-xs text-destructive">{errors.service.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Budget range</Label>
              <Select
                value={budgetValue ?? ""}
                onValueChange={(v) => setValue("budget", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isCorporate ? (
            <fieldset className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <legend className="px-1 text-sm font-semibold">Organisation details (optional)</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="scale">Users, mailboxes or sites</Label>
                  <Input id="scale" placeholder="e.g. 150 mailboxes, 12 websites" {...register("scale")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="environment">Current environment</Label>
                  <Input id="environment" placeholder="e.g. Microsoft 365, another host" {...register("environment")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Migration needed?</Label>
                  <Select value={migrationValue ?? ""} onValueChange={(v) => setValue("migration", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {migrationOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Preferred start</Label>
                  <Select value={startValue ?? ""} onValueChange={(v) => setValue("startDate", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {startOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </fieldset>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="message">
              {isCorporate ? "Your requirements" : "How can we help?"} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder={
                isCorporate
                  ? "What you need, the outcome you are after, and any compliance or security requirements..."
                  : "Goals, timeline, or anything else we should know..."
              }
              rows={5}
              {...register("message")}
              className={errors.message ? "border-destructive" : ""}
            />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full cursor-pointer gap-2 font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              "Send message"
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            We typically respond within 24 hours. No spam, ever.
          </p>
        </form>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
        {nextSteps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
              {s.step}
            </span>
            <span className="text-sm text-muted-foreground">{s.label}</span>
            {i < nextSteps.length - 1 ? (
              <span className="ml-1 hidden h-px w-8 bg-border sm:inline-block" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
