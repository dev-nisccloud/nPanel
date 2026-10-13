import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { trpcMutation } from "@/lib/domain-search/api.ts";
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

const nextSteps = [
  { step: "1", label: "Send this form" },
  { step: "2", label: "Free strategy call" },
  { step: "3", label: "Clear proposal" },
];

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [searchParams] = useSearchParams();

  const prefilledServiceName = searchParams.get("serviceName");
  const prefilledPlan = searchParams.get("plan");
  const prefilledPlanPrice = searchParams.get("planPrice");
  const prefilledPlanPeriod = searchParams.get("planPeriod");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const service = searchParams.get("service");
    const message = searchParams.get("message");
    const updates: Partial<FormData> = {};
    if (service) updates.service = service;
    if (message) updates.message = message;
    if (Object.keys(updates).length > 0) {
      reset((current) => ({ ...current, ...updates }));
    }
  }, [searchParams, reset]);

  const serviceValue = watch("service");
  const budgetValue = watch("budget");

  const onSubmit = async (data: FormData) => {
    try {
      await trpcMutation("storefront.leads.submit", {
        name: data.name,
        email: data.email,
        company: data.company?.trim() || undefined,
        service: data.service,
        serviceName: prefilledServiceName ?? undefined,
        budget: data.budget || undefined,
        message: data.message,
        plan: prefilledPlan ?? undefined,
        planPrice: prefilledPlanPrice ?? undefined,
        source: "contact",
      });
      setSubmitted(true);
      toast.success("Message sent! We'll be in touch within 24 hours.");
    } catch (error) {
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
          A few details is enough  we&apos;ll get back with a clear plan.
        </p>

        {prefilledPlan && prefilledServiceName ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-medium text-foreground">
                Inquiring about: {prefilledServiceName} · {prefilledPlan}
              </p>
              {prefilledPlanPrice ? (
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                Email <span className="text-destructive">*</span>
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
            <Label htmlFor="company">Company / brand</Label>
            <Input id="company" placeholder="Optional" {...register("company")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>
                Service <span className="text-destructive">*</span>
              </Label>
              <Select
                value={serviceValue}
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
                value={budgetValue}
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

          <div className="space-y-1.5">
            <Label htmlFor="message">
              How can we help? <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Goals, timeline, or anything else we should know..."
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
