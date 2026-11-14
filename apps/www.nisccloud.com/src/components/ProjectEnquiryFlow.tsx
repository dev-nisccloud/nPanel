import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BUDGETS, EMAIL_PATTERN, TIMEFRAMES, sendProjectEnquiry } from "@/lib/project-enquiry.ts";
import { trackEvent } from "@/lib/track.ts";
import { useCurrency } from "@/components/providers/currency.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { cn } from "@/lib/utils.ts";
import type { ProjectOffer } from "@/lib/project-packages.ts";

const STEPS = ["Package", "Project", "Budget", "Your details"] as const;
const STEP_TITLES = ["Choose a package", "About the project", "Budget", "How we reach you"] as const;
const SCOPE_LABELS = ["Smallest scope", "Mid scope", "Largest scope"] as const;

type Field = "type" | "when" | "budget" | "name" | "email";
type FieldError = { field: Field | "form"; message: string };

function Progress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-3">
      <ol className="flex gap-1.5" aria-hidden>
        {STEPS.map((title, index) => (
          <li
            key={title}
            className={cn("h-1.5 w-7 rounded-full transition-colors", index <= step ? "bg-primary" : "bg-muted")}
          />
        ))}
      </ol>
      <p className="text-sm font-medium text-muted-foreground">
        Step {step + 1} of {STEPS.length}
      </p>
    </div>
  );
}

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm font-medium text-destructive">
      {message}
    </p>
  );
}

function ChoiceGroup({
  id,
  field,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  id: string;
  field: Field;
  legend: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <fieldset data-field={field} aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-semibold">
        {legend} <span className="text-destructive">*</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-2 sm:[&>label:last-child:nth-child(odd)]:col-span-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                checked
                  ? "border-primary bg-primary/10 font-semibold"
                  : error
                    ? "border-destructive/60 bg-background"
                    : "border-border bg-background hover:border-primary/40",
              )}
            >
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={checked}
                aria-invalid={error ? true : undefined}
                onChange={() => onChange(option.value)}
                className="size-4 accent-primary"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <FieldMessage id={errorId} message={error} />
    </fieldset>
  );
}

export default function ProjectEnquiryFlow({ offer }: { offer: ProjectOffer }) {
  const { currency } = useCurrency();
  const budgets = BUDGETS[currency];
  const flowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const started = useRef(false);
  const openedAt = useRef(Date.now());

  const [step, setStep] = useState(0);
  const [packageId, setPackageId] = useState("");
  const [projectType, setProjectType] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [budget, setBudget] = useState("");
  const [ready, setReady] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<FieldError | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const selected = offer.packages.find((item) => item.id === packageId);
  const last = STEPS.length - 1;
  const fieldError = (field: Field) => (error?.field === field ? error.message : undefined);

  useEffect(() => {
    if (!moved.current) return;
    const target = flowRef.current;
    if (target) {
      const top = target.getBoundingClientRect().top;
      if (top < 72 || top > window.innerHeight * 0.4) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("proposal_form_start", { source: offer.id });
  };

  const goTo = (next: number) => {
    moved.current = true;
    setError(null);
    setStep(next);
  };

  const choosePackage = (id: string) => {
    markStarted();
    setPackageId(id);
    trackEvent("proposal_form_step_complete", { source: offer.id, step: 1 });
    goTo(1);
  };

  const toggleReady = (value: string) => {
    setReady((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const validate = (): FieldError | null => {
    if (step === 1) {
      if (!projectType) return { field: "type", message: "Choose what it is for." };
      if (!timeframe) return { field: "when", message: "Choose when you would like to start." };
    }
    if (step === 2 && !budget) return { field: "budget", message: "Choose a budget range, or Not sure yet." };
    if (step === 3) {
      if (name.trim().length < 2) return { field: "name", message: "Enter your name." };
      if (!EMAIL_PATTERN.test(email.trim())) return { field: "email", message: "Enter a valid email address." };
    }
    return null;
  };

  const focusField = (field: Field) => {
    const target = formRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`);
    const input = target?.matches("input") ? target : target?.querySelector<HTMLInputElement>("input");
    input?.focus();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      if (problem.field !== "form") focusField(problem.field);
      return;
    }
    if (step < last) {
      trackEvent("proposal_form_step_complete", { source: offer.id, step: step + 1 });
      goTo(step + 1);
      return;
    }
    if (website || Date.now() - openedAt.current < 3000) {
      setStatus("success");
      return;
    }
    setStatus("submitting");
    setError(null);
    try {
      await sendProjectEnquiry(offer, { packageId, projectType, timeframe, budget, ready, name, email, phone, company });
      setStatus("success");
      trackEvent("proposal_form_submit_success", { source: offer.id, service: offer.serviceValue });
    } catch {
      setStatus("error");
      setError({ field: "form", message: "We could not send your request. Please try again, or email sales@nisccloud.com." });
      trackEvent("proposal_form_submit_error", { source: offer.id });
    }
  };

  const textField = (
    field: "name" | "email" | "phone" | "company",
    label: string,
    value: string,
    onChange: (value: string) => void,
    props: React.ComponentProps<typeof Input>,
    required = false,
  ) => {
    const id = `${offer.id}-${field}`;
    const message = field === "name" || field === "email" ? fieldError(field) : undefined;
    return (
      <div>
        <Label htmlFor={id} className="mb-2 block text-sm font-semibold">
          {label}{" "}
          {required ? (
            <span className="text-destructive">*</span>
          ) : (
            <span className="font-normal text-muted-foreground">(optional)</span>
          )}
        </Label>
        <Input
          id={id}
          data-field={field}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : undefined}
          className={cn("h-11", message && "border-destructive/60")}
          {...props}
        />
        <FieldMessage id={`${id}-error`} message={message} />
      </div>
    );
  };

  return (
    <section
      id="plans"
      aria-labelledby={`${offer.id}-packages`}
      className="scroll-mt-24 bg-background px-4 py-16 md:px-8 md:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <h2 id={`${offer.id}-packages`} className="type-h2 text-balance">
          {offer.heading}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{offer.intro}</p>

        <div ref={flowRef} className="mt-8 scroll-mt-24" onFocusCapture={markStarted}>
          {status === "success" ? (
            <div role="status" className="mx-auto max-w-2xl rounded-3xl border border-primary/30 bg-card p-6 text-center md:p-8">
              <CheckCircle2 className="mx-auto mb-3 size-10 text-primary" aria-hidden />
              <h3 className="type-h3">Thank you, {name.trim().split(" ")[0] || "there"}.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Your {selected?.name ?? ""} enquiry is with the team. We reply with a proposal. You pay 50% to start
                and 50% at launch.
              </p>
            </div>
          ) : step === 0 ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 ref={headingRef} tabIndex={-1} className="text-lg font-semibold outline-none">
                  {STEP_TITLES[0]}
                </h3>
                <Progress step={0} />
              </div>

              <ul className="grid gap-5 md:grid-cols-3">
                {offer.packages.map((item, index) => {
                  const active = item.id === packageId;
                  return (
                    <li key={item.id}>
                      <article
                        className={cn(
                          "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                          active ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/40",
                        )}
                      >
                        <div className="border-b border-border bg-linear-to-b from-primary/[0.09] to-primary/[0.02] px-6 pb-5 pt-6">
                          <div className="flex items-center justify-between gap-3">
                            <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <span className="flex gap-1" aria-hidden>
                                {SCOPE_LABELS.map((label, bar) => (
                                  <span
                                    key={label}
                                    className={cn("h-1.5 w-5 rounded-full", bar <= index ? "bg-primary" : "bg-primary/15")}
                                  />
                                ))}
                              </span>
                              {SCOPE_LABELS[index] ?? SCOPE_LABELS[SCOPE_LABELS.length - 1]}
                            </p>
                            {active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                                <Check className="size-3.5" aria-hidden />
                                Selected
                              </span>
                            ) : null}
                          </div>
                          <h4 className="type-h3 mt-4">{item.name}</h4>
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                        </div>
                        <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                          <p className="type-label text-muted-foreground">Includes</p>
                          <ul className="mt-3 flex-1 space-y-3">
                            {item.includes.map((line) => (
                              <li key={line} className="flex items-start gap-2.5 text-sm leading-snug">
                                <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                                  <Check className="size-3" strokeWidth={3} aria-hidden />
                                </span>
                                {line}
                              </li>
                            ))}
                          </ul>
                          <Button
                            type="button"
                            variant={active ? "default" : "outline"}
                            onClick={() => choosePackage(item.id)}
                            className="mt-6 h-11 w-full gap-2 rounded-[10px] font-semibold"
                          >
                            {active ? `Continue with ${item.name}` : `Choose ${item.name}`}
                            <ArrowRight className="size-4" aria-hidden />
                          </Button>
                        </div>
                      </article>
                    </li>
                  );
                })}
              </ul>

              {offer.extras.length > 0 ? (
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-sm font-semibold">Optional, quoted separately:</span>
                  {offer.extras.map((extra) => (
                    <span key={extra} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                      {extra}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <form
              ref={formRef}
              id={`${offer.id}-enquiry`}
              noValidate
              onSubmit={submit}
              className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-5 shadow-sm md:p-7"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 py-2 pl-4 pr-2">
                <p className="text-sm">
                  <span className="text-muted-foreground">Package: </span>
                  <span className="font-semibold">{selected?.name}</span>
                </p>
                <Button type="button" variant="ghost" onClick={() => goTo(0)} className="h-11 px-3 font-semibold">
                  Change
                  <span className="sr-only"> package</span>
                </Button>
              </div>

              <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3">
                <h3 ref={headingRef} tabIndex={-1} className="type-h3 outline-none">
                  {STEP_TITLES[step]}
                </h3>
                <Progress step={step} />
              </div>

              {step === 1 ? (
                <div className="space-y-6">
                  <ChoiceGroup
                    id={`${offer.id}-type`}
                    field="type"
                    legend="What is it for?"
                    options={offer.projectTypes}
                    value={projectType}
                    onChange={setProjectType}
                    error={fieldError("type")}
                  />
                  <ChoiceGroup
                    id={`${offer.id}-when`}
                    field="when"
                    legend="When would you like to start?"
                    options={TIMEFRAMES.map((item) => ({ value: item, label: item }))}
                    value={timeframe}
                    onChange={setTimeframe}
                    error={fieldError("when")}
                  />
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <ChoiceGroup
                    id={`${offer.id}-budget`}
                    field="budget"
                    legend={`Budget in ${currency}`}
                    options={budgets}
                    value={budget}
                    onChange={setBudget}
                    error={fieldError("budget")}
                  />
                  {offer.readyOptions.length > 0 ? (
                    <fieldset>
                      <legend className="mb-2 text-sm font-semibold">
                        What do you already have? <span className="font-normal text-muted-foreground">(optional)</span>
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {offer.readyOptions.map((option) => {
                          const checked = ready.includes(option.value);
                          return (
                            <label
                              key={option.value}
                              className={cn(
                                "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary",
                                checked
                                  ? "border-primary bg-primary/10 font-semibold"
                                  : "border-border bg-background hover:border-primary/40",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleReady(option.value)}
                                className="size-4 accent-primary"
                              />
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  ) : null}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {textField("name", "Name", name, setName, { autoComplete: "name" }, true)}
                  {textField("email", "Work email", email, setEmail, { type: "email", autoComplete: "email" }, true)}
                  {textField("phone", "Phone", phone, setPhone, { type: "tel", autoComplete: "tel" })}
                  {textField("company", "Company", company, setCompany, { autoComplete: "organization" })}
                </div>
              ) : null}

              <FieldMessage id={`${offer.id}-form-error`} message={error?.field === "form" ? error.message : undefined} />

              <input
                type="text"
                name="website"
                hidden
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />

              <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
                <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} className="h-11 gap-1.5">
                  <ArrowLeft className="size-4" aria-hidden />
                  Back
                </Button>
                <Button type="submit" disabled={status === "submitting"} className="h-11 gap-2 rounded-[10px] px-6 font-semibold">
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                      Sending
                    </>
                  ) : step < last ? (
                    <>
                      Continue
                      <ArrowRight className="size-4" aria-hidden />
                    </>
                  ) : (
                    "Send enquiry"
                  )}
                </Button>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {step < last ? (
                  `Next: ${STEP_TITLES[step + 1].toLowerCase()}.`
                ) : (
                  <>
                    We reply with a proposal. You pay 50% to start and 50% at launch. We use your details only to
                    respond to this enquiry, under our{" "}
                    <Link to="/privacy" className="font-medium text-foreground underline underline-offset-2">
                      Privacy Policy
                    </Link>
                    .
                  </>
                )}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
