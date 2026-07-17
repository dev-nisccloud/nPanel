import { useCallback } from "react";
import { motion } from "motion/react";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { buildOrderPlanCartParams, navigateToStorefrontCart } from "@/lib/storefront-cart-url.ts";
import { toast } from "sonner";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import type { OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import ServiceShowcaseSection, { type ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { ProcessFeatureBlock } from "@/components/shadcn-space/blocks/feature-01/process-feature.tsx";
import { ServiceMockPricingSection } from "@/components/shadcn-space/blocks/pricing-01/service-mock-pricing.tsx";
import FaqBlock from "@/components/shadcn-space/blocks/faq-01/faq.tsx";
import { NiscWebsiteHeroImage } from "@/components/NiscWebsiteHeroImage.tsx";
import ServiceStatistics, {
  trustStatsToStatisticsItems,
} from "@/components/shadcn-space/blocks/statistics-02/statistics.tsx";
import BuiltDifferentBento from "@/components/shadcn-space/blocks/built-different-01/built-different-bento.tsx";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export type ProcessStep = {
  num: string;
  title: string;
  desc: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type WhyPoint = {
  title: string;
  desc: string;
};

export type Addon = {
  id: string;
  label: string;
  price: number;
  period: string;
};

export type ServicePageShellProps = {
  badge: string;
  headline: React.ReactNode;
  subtext: string;
  serviceType: "hosting" | "marketing";
  plans: OrderPlan[];
  addons?: Addon[];
  features?: Feature[];
  process?: ProcessStep[];
  whyPoints?: WhyPoint[];
  faqs?: FaqItem[];
  ctaHeadline?: string;
  ctaSubtext?: string;
  trustStats?: { label: string; value: string }[];
  pricingNote?: string;
  showcaseBlocks?: ShowcaseBlock[];
  heroImage?: string;
  heroIllustration?: React.ReactNode;
  /** Render hero illustration without gradient frame or padding (e.g. terminal-only heroes). */
  heroIllustrationBare?: boolean;
  heroCta2?: string;
  heroTrustBadge?: { line1: string; line2: string };
  /** Floating badges over the hero image (trust badge + client count). Default true. */
  showHeroOverlays?: boolean;
  /** Render hero image without browser chrome, frame, or hover scale. */
  heroImageStandalone?: boolean;
  plansUnderHero?: boolean;
  customPlansSection?: React.ReactNode;
  /** Cart serviceType slug used when navigating to /cart from static plan cards */
  checkoutServiceType?: string;
  /** Product label shown in cart order summary */
  checkoutProductName?: string;
  /** Optional headline for the Built Different bento section */
  whySectionHeadline?: string;
  whySectionBadge?: string;
};

// ─── Features Grid ────────────────────────────────────────────────────────────

// Corner + icons borrowed from Ruixen bento style
const CornerPlus = () => (
  <>
    {(["-top-2.5 -left-2.5", "-top-2.5 -right-2.5", "-bottom-2.5 -left-2.5", "-bottom-2.5 -right-2.5"] as const).map((pos) => (
      <svg
        key={pos}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={18}
        height={18}
        strokeWidth="1.5"
        stroke="currentColor"
        fill="none"
        className={`absolute ${pos} text-primary/30 group-hover:text-primary/60 transition-colors duration-300`}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
      </svg>
    ))}
  </>
);

// Asymmetric bento spans removed  all cards uniform size

function FeaturesGrid({ features }: { features: Feature[] }) {
  return (
    <section className="relative pt-16 pb-10 overflow-hidden border-t border-dashed border-border/50">
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            What{" "}
            <span className="text-primary">You Get</span>
          </h2>
          <p className="text-muted-foreground text-base mt-3">
            Clear features that help you go live, stay online, and grow with less stress.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn(
                "relative border border-dashed border-border hover:border-primary/40 rounded-2xl p-6 bg-card",
                "flex flex-col justify-between min-h-[190px] group transition-all duration-300",
                "hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/5"
              )}
            >
              <CornerPlus />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection({
  plans,
  addons = [],
  note,
  onSelect,
}: {
  plans: OrderPlan[];
  addons?: Addon[];
  note?: string;
  onSelect: (p: OrderPlan) => void;
}) {
  return (
    <section className="relative py-24 overflow-hidden" id="pricing">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-muted/20 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Simple Pricing</h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            {note ?? "Every plan includes setup help. Upgrade, pause, or cancel when you need to."}
          </p>
        </div>
        <div className={cn("grid gap-6", plans.length === 2 ? "md:grid-cols-2 max-w-3xl mx-auto" : plans.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3")}>
          {plans.map((plan, i) => {
            const popular = plan.id.includes("popular") || i === Math.floor(plans.length / 2);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className={cn(
                  "relative rounded-3xl flex flex-col overflow-hidden transition-all duration-300",
                  popular
                    ? "border-2 border-primary shadow-2xl shadow-primary/20 scale-[1.02]"
                    : "border border-border/60 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                )}
              >
                {popular && (
                  <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold text-center py-2.5 tracking-widest flex items-center justify-center gap-1.5">
                    <Star size={10} className="fill-current" />
                    MOST POPULAR
                    <Star size={10} className="fill-current" />
                  </div>
                )}
                <div className={cn("p-7 flex flex-col flex-1", popular && "bg-gradient-to-b from-primary/5 to-transparent")}>
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="mb-6 pb-6 border-b border-border/50">
                    <div className="flex items-end gap-1">
                      <span className="text-xs text-muted-foreground font-medium mt-1 mr-0.5">KES</span>
                      <span className="text-4xl font-extrabold text-primary leading-none">{plan.price.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm mb-1">/{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={10} className="text-primary" />
                        </div>
                        <span className="text-foreground/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full font-semibold rounded-2xl cursor-pointer h-11 gap-2 transition-all",
                      popular
                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/30"
                        : "bg-muted/80 text-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                    onClick={() => onSelect(plan)}
                  >
                    Get Started <ArrowRight size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
        {addons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 max-w-2xl mx-auto"
          >
            <p className="text-center text-sm text-muted-foreground font-medium mb-4 flex items-center justify-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Optional Add-ons
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {addons.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-4 py-3.5 text-sm hover:border-primary/30 transition-colors">
                  <span className="font-medium">{a.label}</span>
                  <Badge variant="secondary" className="font-semibold">KES {a.price.toLocaleString()}/{a.period}</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ─── Closing CTA ──────────────────────────────────────────────────────────────

function ClosingCta({ headline, subtext, onCta }: { headline: string; subtext: string; onCta: () => void }) {
  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto text-center rounded-3xl p-12 md:p-16 relative overflow-hidden border border-primary/20"
        style={{
          background: "linear-gradient(135deg, oklch(0.60 0.22 235 / 0.08) 0%, oklch(0.55 0.18 195 / 0.05) 50%, oklch(0.58 0.20 265 / 0.08) 100%)",
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none opacity-40"
          style={{ background: "radial-gradient(circle, oklch(0.60 0.22 235 / 0.3) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.18 195 / 0.3) 0%, transparent 70%)" }} />
        {/* Shimmer top line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-6 tracking-wide">
            <Sparkles size={12} />
            READY WHEN YOU ARE
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">{headline}</h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto leading-relaxed">{subtext}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-primary text-primary-foreground font-bold px-8 rounded-2xl h-12 cursor-pointer hover:opacity-90 shadow-lg shadow-primary/30 gap-2"
              onClick={onCta}
            >
              Get Started Today <ArrowRight size={16} />
            </Button>
            <Button
              variant="ghost"
              className="border border-border/60 rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
              onClick={() => (window.location.href = "/contact")}
            >
              Talk to Our Team
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6 opacity-70">No long contracts. Cancel anytime. Free migration and setup help included.</p>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function ServiceHero({
  badge,
  headline,
  subtext,
  heroImage,
  heroIllustration,
  heroIllustrationBare = false,
  heroCta2,
  heroImageStandalone = false,
  onGetStarted,
}: {
  badge: string;
  headline: React.ReactNode;
  subtext: string;
  plans: OrderPlan[];
  heroImage?: string;
  heroIllustration?: React.ReactNode;
  heroIllustrationBare?: boolean;
  heroCta2?: string;
  heroImageStandalone?: boolean;
  onGetStarted: () => void;
}) {
  return (
    <section className="relative pt-28 pb-16 px-4 overflow-hidden">
      {/* Background  skipped for standalone hero images */}
      {!heroImageStandalone && (
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
            style={{ background: "radial-gradient(circle, oklch(0.72 0.2 210 / 0.5), transparent)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-10"
            style={{ background: "radial-gradient(circle, oklch(0.65 0.18 240 / 0.4), transparent)" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 min-h-[520px]">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col items-start text-left max-w-2xl"
          >
            <h1 className="text-[36px] font-extrabold leading-[1.15] mb-6 text-balance">
              {headline}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-xl">
              {subtext}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-primary text-primary-foreground font-bold px-8 rounded-2xl h-12 cursor-pointer hover:opacity-90 shadow-lg shadow-primary/30 gap-2"
                onClick={onGetStarted}
              >
                Get Started <ArrowRight size={15} />
              </Button>
              <Button
                variant="ghost"
                className="border border-border/60 rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40 hover:bg-primary/5 transition-all"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              >
                {heroCta2 ?? "View Pricing"}
              </Button>
            </div>
          </motion.div>

          {/* Right: illustration */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={
              heroImageStandalone
                ? "flex-1 w-full lg:max-w-[720px] xl:max-w-[780px] relative"
                : heroIllustrationBare
                  ? "flex-1 w-full lg:max-w-[640px] relative"
                  : "flex-1 w-full lg:max-w-[580px] relative"
            }
          >
            {heroIllustration ? (
              heroIllustrationBare ? (
                <div className="w-full min-w-0">{heroIllustration}</div>
              ) : (
                <div className="rounded-3xl overflow-hidden border border-border/40 shadow-2xl bg-gradient-to-br from-muted/60 to-muted/20 p-6">
                  {heroIllustration}
                </div>
              )
            ) : heroImageStandalone ? (
              <NiscWebsiteHeroImage
                src={heroImage ?? "https://hercules-cdn.com/file_Y6bXDnbADxoripMl7V1UFfhr"}
                alt={`${badge} illustration`}
                standalone
              />
            ) : (
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-muted/80 border-b border-border/40 backdrop-blur-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">nisccloud.co.ke</span>
                </div>
                <NiscWebsiteHeroImage
                  src={heroImage ?? "https://hercules-cdn.com/file_Y6bXDnbADxoripMl7V1UFfhr"}
                  alt={`${badge} illustration`}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────

export default function ServicePageShell({
  badge,
  headline,
  subtext,
  serviceType: _serviceType,
  plans,
  addons = [],
  features = [],
  process,
  whyPoints,
  faqs,
  ctaHeadline = "Ready to Get Started?",
  ctaSubtext = "Join 100+ businesses that build, host, and grow with one clear team behind them.",
  trustStats,
  pricingNote,
  showcaseBlocks,
  heroImage = "https://hercules-cdn.com/file_Y6bXDnbADxoripMl7V1UFfhr",
  heroIllustration,
  heroIllustrationBare = false,
  heroCta2 = "View Pricing",
  heroImageStandalone = false,
  plansUnderHero = false,
  customPlansSection,
  checkoutServiceType,
  checkoutProductName,
  whySectionHeadline,
  whySectionBadge,
}: ServicePageShellProps) {
  const scrollToPlans = useCallback(() => {
    const target = document.getElementById("plans") ?? document.getElementById("pricing");
    target?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handlePlanSelect = useCallback(
    async (plan: OrderPlan) => {
      if (!checkoutServiceType) {
        scrollToPlans();
        return;
      }
      try {
        await navigateToStorefrontCart(
          buildOrderPlanCartParams(
            plan,
            checkoutServiceType,
            checkoutProductName ?? badge,
          ),
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not open checkout.");
      }
    },
    [badge, checkoutProductName, checkoutServiceType, scrollToPlans],
  );

  const renderPricingSection = () => {
    if (customPlansSection) return customPlansSection;
    if (_serviceType === "marketing" && plans.length > 0) {
      return (
        <ServiceMockPricingSection
          plans={plans}
          serviceName={badge}
          subtitle={pricingNote}
          pricingNote={pricingNote}
          addons={addons}
        />
      );
    }
    return (
      <PricingSection
        plans={plans}
        addons={addons}
        note={pricingNote}
        onSelect={handlePlanSelect}
      />
    );
  };

  const handleDefaultCta = useCallback(() => {
    if (customPlansSection || plans.length === 0) {
      scrollToPlans();
      return;
    }
    if (_serviceType === "marketing") {
      scrollToPlans();
      return;
    }
    const defaultPlan = plans[Math.floor(plans.length / 2)] ?? plans[0];
    if (defaultPlan) handlePlanSelect(defaultPlan);
  }, [_serviceType, customPlansSection, handlePlanSelect, plans, scrollToPlans]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      <ServiceHero
        badge={badge}
        headline={headline}
        subtext={subtext}
        plans={plans}
        heroImage={heroImage}
        heroIllustration={heroIllustration}
        heroIllustrationBare={heroIllustrationBare}
        heroCta2={heroCta2}
        heroImageStandalone={heroImageStandalone}
        onGetStarted={handleDefaultCta}
      />

      {trustStats && (
        <ServiceStatistics
          compact
          items={trustStatsToStatisticsItems(trustStats)}
        />
      )}

      {plansUnderHero && <div id="pricing">{renderPricingSection()}</div>}

      {features && features.length > 0 && <FeaturesGrid features={features} />}

      {showcaseBlocks && showcaseBlocks.length > 0 && (
        <ServiceShowcaseSection blocks={showcaseBlocks} />
      )}

      {!plansUnderHero && <div id="pricing">{renderPricingSection()}</div>}

      {process && <ProcessFeatureBlock steps={process} />}

      {whyPoints && (
        <BuiltDifferentBento
          points={whyPoints}
          badge={whySectionBadge}
          headline={whySectionHeadline}
        />
      )}

      {faqs && faqs.length > 0 ? (
        <FaqBlock
          faqs={faqs.map((faq) => ({ question: faq.q, answer: faq.a }))}
        />
      ) : null}

      <ClosingCta
        headline={ctaHeadline}
        subtext={ctaSubtext}
        onCta={handleDefaultCta}
      />

      <Footer />
    </div>
  );
}
