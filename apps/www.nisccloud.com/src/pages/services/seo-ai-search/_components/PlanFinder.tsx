import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet.tsx";
import { cn } from "@/lib/utils.ts";
import { trackEvent } from "@/lib/track.ts";
import {
  FINDER_GOALS,
  SEO_PLANS,
  SEO_SERVICE_NAME,
  finderSteps,
  looksLikeWebsite,
  recommendPlan,
  type FinderAnswers,
  type FinderStep,
  type PlanKey,
} from "@/lib/seo-ai-search.ts";

type Option<T extends string> = { value: T; label: string; hint?: string };

function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="type-h3 mb-4 text-balance">{legend}</legend>
      <div className="grid gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors motion-reduce:transition-none",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
              value === option.value ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-medium text-foreground">{option.label}</span>
              {option.hint ? <span className="mt-0.5 block text-sm text-muted-foreground">{option.hint}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PlanFinder({
  open,
  onOpenChange,
  answers,
  onAnswersChange,
  onChoosePlan,
  onComparePlans,
  onEnterprise,
  onCloseAutoFocus,
}: {
  onCloseAutoFocus: (event: Event) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answers: FinderAnswers;
  onAnswersChange: (answers: FinderAnswers) => void;
  onChoosePlan: (plan: PlanKey) => void;
  onComparePlans: (match: PlanKey | null) => void;
  onEnterprise: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [showResult, setShowResult] = React.useState(false);
  const [websiteError, setWebsiteError] = React.useState<string | null>(null);
  const started = React.useRef(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const steps = finderSteps(answers);
  const step: FinderStep = steps[Math.min(index, steps.length - 1)];
  const recommendation = showResult ? recommendPlan(answers) : null;

  React.useEffect(() => {
    if (open && !started.current) {
      started.current = true;
      trackEvent("seo_finder_start", { service_type: "seo_reports" });
    }
  }, [open]);

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [index, showResult]);

  const update = (patch: Partial<FinderAnswers>) => onAnswersChange({ ...answers, ...patch });

  const canContinue = (() => {
    switch (step) {
      case "goal":
        return Boolean(answers.goal);
      case "website":
        return answers.hasWebsite === false || Boolean(answers.website?.trim());
      case "sites":
        return Boolean(answers.sites);
      case "locations":
        return Boolean(answers.locations);
      case "shop":
        return Boolean(answers.shop);
    }
  })();

  const next = () => {
    if (step === "website" && answers.hasWebsite !== false && !looksLikeWebsite(answers.website ?? "")) {
      setWebsiteError("Enter a website address, such as yourbusiness.com, or choose “I don’t have a website yet”.");
      return;
    }
    setWebsiteError(null);
    if (index < steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    const result = recommendPlan(answers);
    setShowResult(true);
    trackEvent("seo_finder_complete", {
      goal: answers.goal ?? null,
      has_website: answers.hasWebsite !== false,
      sites: steps.includes("sites") ? (answers.sites ?? null) : null,
      locations: steps.includes("locations") ? (answers.locations ?? null) : null,
      shop: steps.includes("shop") ? (answers.shop ?? null) : null,
    });
    trackEvent("seo_recommendation_shown", {
      recommendation: result?.kind === "plan" ? result.plan : "website_first",
    });
  };

  const back = () => {
    setWebsiteError(null);
    if (showResult) {
      setShowResult(false);
      setIndex(steps.length - 1);
      return;
    }
    setIndex(Math.max(0, index - 1));
  };

  const close = () => onOpenChange(false);
  const progress = showResult ? steps.length : index + 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onCloseAutoFocus={onCloseAutoFocus}
        side="right"
        className="w-full overflow-y-auto sm:max-w-md [&>button:last-child]:flex [&>button:last-child]:size-11 [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:top-2 [&>button:last-child]:right-2"
      >
        <SheetHeader className="border-b border-border px-6 pt-6 pb-4">
          <SheetTitle className="text-lg">Find my plan</SheetTitle>
          <SheetDescription>
            A short, optional guide for {SEO_SERVICE_NAME}. No contact details needed.
          </SheetDescription>
          <div className="mt-2" aria-live="polite">
            <p className="text-xs font-medium text-muted-foreground">
              {showResult ? "Your recommendation" : `Question ${progress} of ${steps.length}`}
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${(progress / steps.length) * 100}%` }}
              />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 px-6 pb-6">
          <h2 ref={headingRef} tabIndex={-1} className="sr-only">
            {showResult ? "Recommendation" : `Question ${progress}`}
          </h2>

          {!showResult && step === "goal" ? (
            <ChoiceGroup
              name="seo-goal"
              legend="What would you like more of?"
              options={FINDER_GOALS}
              value={answers.goal}
              onChange={(goal) => update({ goal })}
            />
          ) : null}

          {!showResult && step === "website" ? (
            <div>
              <Label htmlFor="seo-finder-website" className="type-h3 mb-4 block">
                What is your website address?
              </Label>
              <Input
                id="seo-finder-website"
                inputMode="url"
                autoComplete="url"
                placeholder="yourbusiness.com"
                value={answers.website ?? ""}
                aria-invalid={websiteError ? true : undefined}
                aria-describedby={websiteError ? "seo-finder-website-error" : "seo-finder-website-hint"}
                onChange={(e) => {
                  setWebsiteError(null);
                  update({ website: e.target.value, hasWebsite: true });
                }}
                className="h-12 text-base"
              />
              {websiteError ? (
                <p id="seo-finder-website-error" className="mt-2 text-sm font-medium text-destructive">
                  {websiteError}
                </p>
              ) : (
                <p id="seo-finder-website-hint" className="mt-2 text-sm text-muted-foreground">
                  Used only to prepare your plan. It is not checked or stored.
                </p>
              )}
              <button
                type="button"
                aria-pressed={answers.hasWebsite === false}
                onClick={() => {
                  setWebsiteError(null);
                  update({ hasWebsite: answers.hasWebsite === false ? undefined : false, website: "" });
                }}
                className={cn(
                  "mt-4 flex min-h-12 w-full cursor-pointer items-center rounded-xl border px-4 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  answers.hasWebsite === false ? "border-primary bg-primary/[0.06]" : "border-border hover:border-primary/40",
                )}
              >
                I don’t have a website yet
              </button>
            </div>
          ) : null}

          {!showResult && step === "sites" ? (
            <ChoiceGroup
              name="seo-sites"
              legend="Is this for one website or several?"
              options={[
                { value: "one", label: "One website" },
                { value: "several", label: "Several websites" },
              ]}
              value={answers.sites}
              onChange={(sites) => update({ sites })}
            />
          ) : null}

          {!showResult && step === "locations" ? (
            <ChoiceGroup
              name="seo-locations"
              legend="How many locations do customers visit?"
              options={[
                { value: "one", label: "One location" },
                { value: "several", label: "Two or more locations" },
              ]}
              value={answers.locations}
              onChange={(locations) => update({ locations })}
            />
          ) : null}

          {!showResult && step === "shop" ? (
            <ChoiceGroup
              name="seo-shop"
              legend="How would you describe your online shop?"
              options={[
                { value: "standard", label: "Small or medium", hint: "One shop in one language and market" },
                { value: "large", label: "Large or complex", hint: "A big catalogue, several languages or markets" },
              ]}
              value={answers.shop}
              onChange={(shop) => update({ shop })}
            />
          ) : null}

          {recommendation ? (
            <div>
              {recommendation.kind === "no-website" ? (
                <>
                  <p className="type-label text-primary">Start with a website</p>
                  <p className="mt-3 text-base leading-relaxed text-foreground">{recommendation.reason}</p>
                  <div className="mt-6 grid gap-3">
                    <Button asChild size="lg" className="min-h-11">
                      <Link to="/services/website-design">Explore website design</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="min-h-11">
                      <Link to={`/contact?service=market&serviceName=${encodeURIComponent(SEO_SERVICE_NAME)}`}>Book a consultation</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="type-label text-primary">Our suggestion</p>
                  <p className="type-h3 mt-2">{SEO_PLANS[recommendation.plan].name}</p>
                  <p className="mt-3 text-base leading-relaxed text-foreground">{recommendation.reason}</p>
                  <p className="mt-3 text-sm text-muted-foreground">This is based only on your answers, not an assessment of your website.</p>
                  <div className="mt-6 grid gap-3">
                    {recommendation.plan === "enterprise" ? (
                      <Button size="lg" className="min-h-11 gap-2" onClick={onEnterprise}>
                        Build my search plan <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    ) : (
                      <Button size="lg" className="min-h-11 gap-2" onClick={() => onChoosePlan(recommendation.plan)}>
                        Choose {SEO_PLANS[recommendation.plan].name} <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    )}
                    <Button size="lg" variant="outline" className="min-h-11" onClick={() => onComparePlans(recommendation.plan)}>
                      Compare all plans
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-border bg-background px-6 py-4">
          {index > 0 || showResult ? (
            <Button type="button" variant="ghost" className="min-h-11 gap-2" onClick={back}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => { close(); onComparePlans(null); }}>
              Skip to plans
            </Button>
          )}
          {!showResult ? (
            <Button type="button" className="min-h-11 gap-2" disabled={!canContinue} onClick={next}>
              {index === steps.length - 1 ? "See my plan" : "Next"} <ArrowRight className="size-4" aria-hidden />
            </Button>
          ) : (
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => { setShowResult(false); setIndex(0); }}>
              Change answers
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
