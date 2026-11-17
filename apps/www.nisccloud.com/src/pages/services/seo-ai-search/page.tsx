import * as React from "react";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { ClosingCta } from "@/components/closing-cta.tsx";
import { breadcrumbJsonLd, faqJsonLd, serviceJsonLd, usePageMeta } from "@/lib/seo.ts";
import { trackEvent } from "@/lib/track.ts";
import {
  SEO_FAQS,
  SEO_ROUTE,
  SEO_SERVICE_NAME,
  type FinderAnswers,
  type PlanKey,
} from "@/lib/seo-ai-search.ts";
import { useSeoPlans, type LiveSeoPlan } from "./_components/use-seo-plans.ts";
import { SeoPlans } from "./_components/SeoPlans.tsx";
import { PlanFinder } from "./_components/PlanFinder.tsx";
import { ConfirmScopeDialog } from "./_components/ConfirmScopeDialog.tsx";
import { EnterpriseBrief } from "./_components/EnterpriseBrief.tsx";
import { FirstThirtyDays, SampleReport, SearchSurfaces, SeoHero, SeoProof } from "./_components/sections.tsx";

const DESCRIPTION =
  "Get found on Google, Maps and AI-powered search with technical improvements, useful content and clear monthly reporting. Compare Search Essentials, Search Growth and Enterprise.";

function scrollToId(id: string) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

export default function SeoAiSearchPage() {
  usePageMeta({
    title: SEO_SERVICE_NAME,
    description: DESCRIPTION,
    canonicalPath: SEO_ROUTE,
    jsonLd: [
      breadcrumbJsonLd([
        ["Home", "/"],
        ["Business Solutions", "/services"],
        [SEO_SERVICE_NAME, SEO_ROUTE],
      ]),
      serviceJsonLd({ name: SEO_SERVICE_NAME, description: DESCRIPTION, path: SEO_ROUTE, category: "Search engine optimisation" }),
      faqJsonLd(SEO_FAQS),
    ],
  });

  const { state, retry } = useSeoPlans();
  const [answers, setAnswers] = React.useState<FinderAnswers>({});
  const [finderOpen, setFinderOpen] = React.useState(false);
  const [briefOpen, setBriefOpen] = React.useState(false);
  const [confirmPlan, setConfirmPlan] = React.useState<LiveSeoPlan | null>(null);
  const [matched, setMatched] = React.useState<PlanKey | null>(null);

  const returnFocus = React.useRef<HTMLElement | null>(null);
  const remember = () => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };
  const restoreFocus = React.useCallback((event: Event) => {
    event.preventDefault();
    window.setTimeout(() => {
      if (!document.querySelector('[data-slot$="-content"][data-state="open"]')) returnFocus.current?.focus();
    }, 0);
  }, []);

  const openFinder = () => {
    remember();
    setFinderOpen(true);
  };
  const comparePlans = () => scrollToId("plans");

  const choosePlan = (plan: LiveSeoPlan, source: "card" | "finder") => {
    trackEvent("seo_plan_select", { plan: plan.key, source });
    if (source === "card") remember();
    setConfirmPlan(plan);
  };

  const openEnterprise = (source: "card" | "finder" | "fallback") => {
    trackEvent("seo_plan_select", { plan: "enterprise", source });
    if (source !== "finder") remember();
    setFinderOpen(false);
    setBriefOpen(true);
  };

  const chooseFromFinder = (key: PlanKey) => {
    setFinderOpen(false);
    setMatched(key);
    const plan = state.status === "ready" ? state.plans.find((p) => p.key === key) : undefined;
    if (plan) choosePlan(plan, "finder");
    else window.setTimeout(comparePlans, 0);
  };

  const compareFromFinder = (key: PlanKey | null) => {
    setFinderOpen(false);
    setMatched(key);
    window.setTimeout(comparePlans, 0);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <main id="main-content">
        <SeoHero onFindPlan={openFinder} onComparePlans={comparePlans} />
        <SeoProof />
        <SearchSurfaces />
        <SeoPlans
          state={state}
          retry={retry}
          matched={matched}
          onChoose={(plan) => choosePlan(plan, "card")}
          onEnterprise={() => openEnterprise(state.status === "error" ? "fallback" : "card")}
          onFindPlan={openFinder}
        />
        <FirstThirtyDays />
        <SampleReport />
        <FaqBlock faqs={SEO_FAQS.map((f) => ({ question: f.q, answer: f.a }))} title="Common questions" />
        <ClosingCta
          headline="Not sure where to start?"
          subtext="Answer a few questions for a plan suggestion, or compare the plans yourself."
          primary={{ label: "Find my plan", href: "#plans", onClick: openFinder }}
          secondary={{ label: "Compare plans", href: "#plans", onClick: comparePlans }}
        />
      </main>
      <Footer />

      <PlanFinder
        open={finderOpen}
        onOpenChange={setFinderOpen}
        answers={answers}
        onAnswersChange={setAnswers}
        onChoosePlan={chooseFromFinder}
        onComparePlans={compareFromFinder}
        onEnterprise={() => openEnterprise("finder")}
        onCloseAutoFocus={restoreFocus}
      />
      <ConfirmScopeDialog
        plan={confirmPlan}
        inclusions={confirmPlan?.inclusions ?? []}
        onOpenChange={(open) => !open && setConfirmPlan(null)}
        onCloseAutoFocus={restoreFocus}
      />
      <EnterpriseBrief open={briefOpen} onOpenChange={setBriefOpen} answers={answers} onCloseAutoFocus={restoreFocus} />
    </div>
  );
}
