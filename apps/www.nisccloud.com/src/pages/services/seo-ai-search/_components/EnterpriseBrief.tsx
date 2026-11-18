import * as React from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { trpcMutation } from "@/lib/domain-search/api.ts";
import { getAttribution } from "@/lib/attribution.ts";
import { EMAIL_PATTERN } from "@/lib/project-enquiry.ts";
import { trackEvent } from "@/lib/track.ts";
import { FINDER_GOALS, SEO_LEAD_SERVICE, SEO_ROUTE, SEO_SERVICE_NAME, type FinderAnswers, type FinderGoal } from "@/lib/seo-ai-search.ts";

type Brief = {
  sites: "one" | "several" | "";
  websites: string;
  goal: FinderGoal | "";
  markets: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  budget: string;
  extras: string;
};

type Errors = Partial<Record<"name" | "email", string>>;

function briefFromAnswers(answers: FinderAnswers): Brief {
  return {
    sites: answers.sites ?? (answers.goal === "multi" ? "several" : ""),
    websites: answers.website?.trim() ?? "",
    goal: answers.goal ?? "",
    markets: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    budget: "",
    extras: "",
  };
}

function Field({
  id,
  label,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function EnterpriseBrief({
  open,
  onOpenChange,
  answers,
  onCloseAutoFocus,
}: {
  onCloseAutoFocus: (event: Event) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answers: FinderAnswers;
}) {
  const [brief, setBrief] = React.useState<Brief>(() => briefFromAnswers(answers));
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open || status === "sent") return;
    setBrief((current) => {
      const carried = briefFromAnswers(answers);
      return {
        ...current,
        sites: current.sites || carried.sites,
        websites: current.websites || carried.websites,
        goal: current.goal || carried.goal,
      };
    });
  }, [open, answers, status]);

  const set = <K extends keyof Brief>(key: K, value: Brief[K]) => {
    setBrief((current) => ({ ...current, [key]: value }));
    if (key === "name" || key === "email") setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    if (brief.name.trim().length < 2) next.name = "Enter your name.";
    if (!EMAIL_PATTERN.test(brief.email.trim())) next.email = "Enter an email address, such as you@company.com.";
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.email) return emailRef.current?.focus();

    setStatus("sending");
    const goalLabel = FINDER_GOALS.find((g) => g.value === brief.goal)?.label ?? "Not specified";
    const attribution = Object.entries(getAttribution())
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`);
    const message = [
      "Request type: Enterprise scope request (not an order)",
      `Websites: ${brief.sites === "several" ? "Several" : brief.sites === "one" ? "One" : "Not specified"}`,
      `Website addresses: ${brief.websites.trim() || "Not given"}`,
      `Main goal: ${goalLabel}`,
      `Markets or locations: ${brief.markets.trim() || "Not given"}`,
      `Budget: ${brief.budget.trim() || "Not given"}`,
      `Anything else: ${brief.extras.trim() || "Nothing added"}`,
      `Enquiry source: seo-ai-search-enterprise (${SEO_ROUTE})`,
      ...attribution,
    ].join("\n");

    try {
      await trpcMutation("storefront.leads.submit", {
        name: brief.name.trim(),
        email: brief.email.trim(),
        phone: brief.phone.trim() || undefined,
        company: brief.company.trim() || undefined,
        service: SEO_LEAD_SERVICE,
        serviceName: `${SEO_SERVICE_NAME}: Enterprise`,
        plan: "Enterprise",
        budget: brief.budget.trim().slice(0, 40) || undefined,
        message: message.slice(0, 5000),
        source: "contact",
      });
      setStatus("sent");
      trackEvent("seo_enterprise_enquiry_success", { goal: brief.goal || null, sites: brief.sites || null });
    } catch {
      setStatus("error");
      trackEvent("seo_enterprise_enquiry_error", { stage: "submit" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => status !== "sending" && onOpenChange(next)}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus} className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {status === "sent" ? (
          <div role="status">
            <DialogHeader>
              <DialogTitle className="text-xl">Thanks, we have your brief</DialogTitle>
              <DialogDescription>
                This is a scope request, not an order. Nothing has been charged. Our team will reply by email to agree the scope and price with you.
              </DialogDescription>
            </DialogHeader>
            <Button type="button" className="mt-6 min-h-11 w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Build my search plan</DialogTitle>
              <DialogDescription>
                Tell us about your sites and goals. This is a scope request, not an order. Nothing is charged.
              </DialogDescription>
            </DialogHeader>

            <form noValidate onSubmit={submit} className="grid gap-4">
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium">Websites</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["one", "several"] as const).map((value) => (
                    <label
                      key={value}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 has-[:checked]:border-primary has-[:checked]:bg-primary/[0.06] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary"
                    >
                      <input
                        type="radio"
                        name="brief-sites"
                        checked={brief.sites === value}
                        onChange={() => set("sites", value)}
                        className="size-4 accent-[var(--primary)]"
                      />
                      {value === "one" ? "One website" : "Several websites"}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field id="brief-websites" label="Website addresses" optional>
                <Input id="brief-websites" value={brief.websites} onChange={(e) => set("websites", e.target.value)} placeholder="yourbusiness.com" className="h-11" />
              </Field>

              <Field id="brief-goal" label="Main goal" optional>
                <select
                  id="brief-goal"
                  value={brief.goal}
                  onChange={(e) => set("goal", e.target.value as FinderGoal | "")}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <option value="">Choose a goal</option>
                  {FINDER_GOALS.map((goal) => (
                    <option key={goal.value} value={goal.value}>
                      {goal.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="brief-markets" label="Markets or locations" optional>
                <Input id="brief-markets" value={brief.markets} onChange={(e) => set("markets", e.target.value)} placeholder="For example Nairobi, Mombasa and Kampala" className="h-11" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="brief-name" label="Your name" error={errors.name}>
                  <Input
                    ref={nameRef}
                    id="brief-name"
                    autoComplete="name"
                    value={brief.name}
                    onChange={(e) => set("name", e.target.value)}
                    aria-invalid={errors.name ? true : undefined}
                    aria-describedby={errors.name ? "brief-name-error" : undefined}
                    className="h-11"
                  />
                </Field>
                <Field id="brief-email" label="Work email" error={errors.email}>
                  <Input
                    ref={emailRef}
                    id="brief-email"
                    type="email"
                    autoComplete="email"
                    value={brief.email}
                    onChange={(e) => set("email", e.target.value)}
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "brief-email-error" : undefined}
                    className="h-11"
                  />
                </Field>
                <Field id="brief-phone" label="Phone" optional>
                  <Input id="brief-phone" type="tel" autoComplete="tel" value={brief.phone} onChange={(e) => set("phone", e.target.value)} className="h-11" />
                </Field>
                <Field id="brief-company" label="Company" optional>
                  <Input id="brief-company" autoComplete="organization" value={brief.company} onChange={(e) => set("company", e.target.value)} className="h-11" />
                </Field>
              </div>

              <Field id="brief-budget" label="Monthly budget" optional>
                <Input id="brief-budget" maxLength={40} value={brief.budget} onChange={(e) => set("budget", e.target.value)} placeholder="If you have one in mind" className="h-11" />
              </Field>

              <Field id="brief-extras" label="Anything else we should know" optional>
                <Textarea id="brief-extras" rows={3} maxLength={2000} value={brief.extras} onChange={(e) => set("extras", e.target.value)} placeholder="Languages, migrations, approval steps, extra services" />
              </Field>

              {status === "error" ? (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>
                    We could not send your brief. Your answers are still here, so you can try again, or{" "}
                    <Link to="/contact" className="font-semibold underline">
                      contact us
                    </Link>
                    .
                  </AlertDescription>
                </Alert>
              ) : null}

              <p className="text-xs text-muted-foreground">
                We use these details to reply to your request. See our{" "}
                <Link to="/privacy" className="underline">
                  privacy policy
                </Link>
                .
              </p>

              <Button type="submit" size="lg" className="min-h-11 gap-2" disabled={status === "sending"}>
                {status === "sending" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {status === "sending" ? "Sending…" : status === "error" ? "Try again" : "Send my brief"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
