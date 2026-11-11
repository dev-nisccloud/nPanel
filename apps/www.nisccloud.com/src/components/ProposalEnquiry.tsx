import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { trpcMutation } from "@/lib/domain-search/api.ts";
import { getAttribution } from "@/lib/attribution.ts";
import { trackEvent } from "@/lib/track.ts";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { cn } from "@/lib/utils.ts";

/** Values map onto the service keys the existing lead API already receives from the contact form. */
const serviceOptions = [
  { id: "web", value: "create", label: "Website or online store" },
  { id: "software", value: "custom", label: "Custom software or app" },
  { id: "cloud", value: "launch", label: "Cloud infrastructure" },
  { id: "growth", value: "market", label: "Marketing and growth" },
  { id: "ai", value: "automate", label: "AI and automation" },
  { id: "multiple", value: "full", label: "Several of these" },
  { id: "unsure", value: "custom", label: "Not sure yet" },
] as const;

const budgetOptions = [
  { value: "under-50k", label: "Under KES 50,000" },
  { value: "50k-150k", label: "KES 50,000 – 150,000" },
  { value: "150k-500k", label: "KES 150,000 – 500,000" },
  { value: "500k-plus", label: "KES 500,000+" },
  { value: "not-sure", label: "Not sure yet" },
] as const;

const timeframeOptions = ["Immediately", "1–3 months", "Later / exploring"] as const;

const stepTitles = ["Your project", "Budget and timing", "Your details"] as const;

type Status = "idle" | "submitting" | "success" | "error";

function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: readonly { value: T; label: string; key?: string }[];
  value: T | "";
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">
        {legend} <span className="text-destructive">*</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.key ?? option.value}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                checked
                  ? "border-primary bg-primary/10 font-semibold text-foreground"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="size-4 accent-[var(--color-primary)]"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function ProposalEnquiry({ source = "homepage" }: { source?: string }) {
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<(typeof serviceOptions)[number]["id"] | "">("");
  const [scope, setScope] = useState("");
  const [budget, setBudget] = useState<(typeof budgetOptions)[number]["value"] | "">("");
  const [timeframe, setTimeframe] = useState<(typeof timeframeOptions)[number] | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const started = useRef(false);
  const openedAt = useRef(Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("proposal_form_start", { source });
  };

  const validate = (): string | null => {
    if (step === 0) {
      if (!serviceId) return "Choose the service you are interested in.";
      if (scope.trim().length < 15) return "Tell us a little more about what you need (at least 15 characters).";
    }
    if (step === 1) {
      if (!budget) return "Choose a budget range, or select “Not sure yet”.";
      if (!timeframe) return "Choose when you would like to start.";
    }
    if (step === 2) {
      if (name.trim().length < 2) return "Please enter your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
    }
    return null;
  };

  const goTo = (next: number) => {
    setError(null);
    setStep(next);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    trackEvent("proposal_form_step_complete", { source, step: step + 1 });
    goTo(step + 1);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step < 2) {
      next();
      return;
    }
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (website || Date.now() - openedAt.current < 3000) {
      setStatus("success");
      return;
    }
    const service = serviceOptions.find((option) => option.id === serviceId)!;
    const attribution = getAttribution();
    const attributionLines = Object.entries(attribution)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`);
    const message = [
      scope.trim(),
      "",
      `Timeframe: ${timeframe}`,
      `Enquiry source: ${source} (${window.location.pathname})`,
      ...attributionLines,
    ].join("\n");

    setStatus("submitting");
    setError(null);
    try {
      await trpcMutation("storefront.leads.submit", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        company: company.trim() || undefined,
        service: service.value,
        serviceName: `Project enquiry: ${service.label}`,
        budget,
        message,
        source: "contact",
      });
      setStatus("success");
      trackEvent("proposal_form_submit_success", { source, service: service.id });
    } catch {
      setStatus("error");
      setError(
        "We could not send your request. Please try again, or email sales@nisccloud.com.",
      );
      trackEvent("proposal_form_submit_error", { source });
    }
  };

  if (status === "success") {
    return (
      <div role="status" className="rounded-3xl border border-primary/30 bg-card p-6 text-center md:p-8">
        <CheckCircle2 className="mx-auto mb-3 size-10 text-primary" aria-hidden />
        <h3 className="type-h3">Thank you, {name.trim().split(" ")[0]}.</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your requirements have been sent to our team. We will contact you at{" "}
          <span className="font-semibold text-foreground">{email.trim()}</span> to discuss the next steps.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      onFocusCapture={markStarted}
      className="relative rounded-3xl border border-border bg-card p-5 shadow-sm md:p-7"
      aria-describedby={error ? "proposal-error" : undefined}
    >
      <ol className="mb-5 flex gap-2" aria-label="Enquiry progress">
        {stepTitles.map((title, i) => (
          <li key={title} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <span
              className={cn(
                "block h-1.5 rounded-full",
                i <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "mt-1.5 hidden text-[11px] font-medium sm:block",
                i === step ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {i + 1}. {title}
            </span>
          </li>
        ))}
      </ol>

      <h3
        ref={headingRef}
        tabIndex={-1}
        className="type-h3 mb-4 outline-none"
      >
        Step {step + 1} of 3: {stepTitles[step]}
      </h3>

      {step === 0 && (
        <div className="space-y-5">
          <ChoiceGroup
            name="proposal-service"
            legend="What would you like to discuss?"
            options={serviceOptions.map((option) => ({ value: option.id, label: option.label }))}
            value={serviceId}
            onChange={setServiceId}
          />
          <div>
            <Label htmlFor="proposal-scope" className="mb-2 block text-sm font-semibold">
              Briefly describe your requirements <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="proposal-scope"
              rows={3}
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              placeholder="For example: a customer portal connected to our billing, or hosting for 12 client websites."
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <ChoiceGroup
            name="proposal-budget"
            legend="Estimated budget"
            options={budgetOptions}
            value={budget}
            onChange={setBudget}
          />
          <ChoiceGroup
            name="proposal-timeframe"
            legend="When would you like to start?"
            options={timeframeOptions.map((option) => ({ value: option, label: option }))}
            value={timeframe}
            onChange={setTimeframe}
          />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="proposal-name" className="mb-2 block text-sm font-semibold">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input id="proposal-name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="proposal-email" className="mb-2 block text-sm font-semibold">
              Work email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="proposal-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="proposal-phone" className="mb-2 block text-sm font-semibold">
              Phone <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id="proposal-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="proposal-company" className="mb-2 block text-sm font-semibold">
              Company <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="proposal-company"
              autoComplete="organization"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>
      )}

      {error && (
        <p id="proposal-error" role="alert" className="mt-4 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <input
        type="text"
        name="website"
        hidden
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
      />

      <div className="mt-6 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} className="gap-1.5">
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          disabled={status === "submitting"}
          className="h-11 gap-2 rounded-[10px] px-6 font-semibold"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Sending
            </>
          ) : step < 2 ? (
            <>
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </>
          ) : (
            "Send enquiry"
          )}
        </Button>
      </div>
      {step === 2 ? (
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          We use your details to respond to this enquiry under our{" "}
          <Link to="/privacy" className="font-medium text-foreground underline underline-offset-2">
            Privacy Policy
          </Link>
          . Sending an enquiry does not subscribe you to marketing emails.
        </p>
      ) : null}
    </form>
  );
}
