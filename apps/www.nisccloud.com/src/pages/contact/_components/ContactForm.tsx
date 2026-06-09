import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
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
  budget: z.string().min(1, "Please select a budget range"),
  message: z.string().min(20, "Please tell us a bit more (at least 20 characters)"),
});

type FormData = z.infer<typeof schema>;

const services = [
  { value: "create", label: "01 — Create (Brand & Web Design)" },
  { value: "launch", label: "02 — Launch (Cloud Hosting)" },
  { value: "market", label: "03 — Market (Digital Marketing)" },
  { value: "automate", label: "04 — Automate (Marketing Automation)" },
  { value: "full", label: "Full Growth Stack (All 4 Pillars)" },
  { value: "custom", label: "Custom / Not Sure Yet" },
];

const budgets = [
  { value: "under-1k", label: "Under $1,000" },
  { value: "1k-5k", label: "$1,000 – $5,000" },
  { value: "5k-15k", label: "$5,000 – $15,000" },
  { value: "15k-50k", label: "$15,000 – $50,000" },
  { value: "50k-plus", label: "$50,000+" },
];

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const serviceValue = watch("service");
  const budgetValue = watch("budget");

  const onSubmit = async (_data: FormData) => {
    // Simulate async submission
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitted(true);
    toast.success("Message sent! We'll be in touch within 24 hours.");
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border/60 rounded-2xl p-12 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-3">Message Received!</h3>
        <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
          Thanks for reaching out. A member of the Nisc Cloud team will review your submission and follow up within 24 hours.
        </p>
        <div className="mt-8 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono">
          ORBIT INITIATED
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border/60 rounded-2xl p-8"
    >
      <h2 className="text-xl font-bold mb-1">Send Us a Message</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Fill in the details below and we&apos;ll get back to you with a tailored strategy.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name + Email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="John Smith"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>

        {/* Company */}
        <div className="space-y-1.5">
          <Label htmlFor="company">Company / Brand Name</Label>
          <Input
            id="company"
            placeholder="Acme Inc. (optional)"
            {...register("company")}
          />
        </div>

        {/* Service + Budget */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Service Interested In <span className="text-destructive">*</span></Label>
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
            <Label>Budget Range <span className="text-destructive">*</span></Label>
            <Select
              value={budgetValue}
              onValueChange={(v) => setValue("budget", v, { shouldValidate: true })}
            >
              <SelectTrigger className={errors.budget ? "border-destructive" : ""}>
                <SelectValue placeholder="Select budget..." />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.budget && (
              <p className="text-xs text-destructive">{errors.budget.message}</p>
            )}
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <Label htmlFor="message">Tell Us About Your Project <span className="text-destructive">*</span></Label>
          <Textarea
            id="message"
            placeholder="Describe your brand, goals, timeline, and anything else we should know..."
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
          className="w-full bg-primary text-primary-foreground hover:opacity-90 cursor-pointer font-semibold gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Sending...
            </>
          ) : (
            "Get a Digital Growth Plan"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          We typically respond within 24 hours. No spam, ever.
        </p>
      </form>
    </motion.div>
  );
}
