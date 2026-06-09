import { useState } from "react";
import { motion } from "motion/react";
import { Check, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import OrderDialog, { type OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import ServiceShowcaseSection, { type ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

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
  features: Feature[];
  process?: ProcessStep[];
  whyPoints?: WhyPoint[];
  faqs?: FaqItem[];
  ctaHeadline?: string;
  ctaSubtext?: string;
  trustStats?: { label: string; value: string }[];
  pricingNote?: string;
  /** Optional alternating showcase blocks rendered after features */
  showcaseBlocks?: ShowcaseBlock[];
  /** Optional hero image URL - defaults to a generic service illustration */
  heroImage?: string;
  /** Optional JSX illustration to render instead of heroImage */
  heroIllustration?: React.ReactNode;
  /** Optional secondary CTA label in hero (defaults to "View Pricing") */
  heroCta2?: string;
  /** Float trust badge text overrides */
  heroTrustBadge?: { line1: string; line2: string };
  /** If true, render pricing section immediately after trust bar */
  plansUnderHero?: boolean;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrustBar({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="border-y border-border" style={{ background: "linear-gradient(90deg, oklch(0.97 0.01 240) 0%, oklch(0.95 0.03 235 / 0.6) 50%, oklch(0.97 0.01 240) 100%)" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-7 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((s) => (
          <div key={s.label} className="group">
            <div className="text-2xl font-extrabold text-primary group-hover:scale-105 transition-transform">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturesGrid({ features }: { features: Feature[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-3">Everything You Get</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">A complete, battle-tested system - nothing is an afterthought.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="group rounded-3xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all p-6"
          >
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              {f.icon}
            </div>
            <h3 className="font-semibold text-foreground mb-1.5">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

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
    <section className="bg-muted/20 border-y border-border py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Pricing</span>
          <h2 className="text-3xl font-bold mt-2 mb-3">Transparent. No Surprises.</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">{note ?? "All plans include onboarding support. Scale or cancel anytime."}</p>
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
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={cn(
                  "relative rounded-3xl border bg-card flex flex-col overflow-hidden",
                  popular ? "border-primary shadow-2xl shadow-primary/10 scale-[1.02]" : "border-border hover:border-primary/30 hover:shadow-lg transition-all"
                )}
              >
                {popular && (
                  <div className="bg-primary text-primary-foreground text-xs font-bold text-center py-2 tracking-wider">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="mb-5">
                    <span className="text-4xl font-extrabold text-primary">KES {plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check size={14} className="text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full font-semibold rounded-2xl cursor-pointer h-11",
                      popular ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    )}
                    onClick={() => onSelect(plan)}
                  >
                    Get Started <ArrowRight size={15} className="ml-1.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
        {addons.length > 0 && (
          <div className="mt-10 max-w-2xl mx-auto">
            <p className="text-center text-sm text-muted-foreground font-medium mb-4">Optional Add-ons</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {addons.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3 text-sm">
                  <span className="font-medium">{a.label}</span>
                  <Badge variant="secondary">KES {a.price.toLocaleString()}/{a.period}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProcessSection({ steps }: { steps: ProcessStep[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">How It Works</span>
        <h2 className="text-3xl font-bold mt-2">Our Proven Process</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative"
          >
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent -translate-y-0.5 z-0" />
            )}
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg flex items-center justify-center mb-4">
                {s.num}
              </div>
              <h3 className="font-bold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function WhySection({ points }: { points: WhyPoint[] }) {
  return (
    <section className="bg-primary/5 border-y border-primary/10 py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Why Nisc Cloud</span>
          <h2 className="text-3xl font-bold mt-2">Built Different, Purposely</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-start gap-4 bg-card rounded-3xl border border-border p-5"
            >
              <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <h3 className="font-semibold mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 py-20">
      <div className="text-center mb-10">
        <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">FAQ</span>
        <h2 className="text-3xl font-bold mt-2">Common Questions</h2>
      </div>
      <div className="space-y-3 max-w-3xl mx-auto">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
            >
              {faq.q}
              <ChevronDown
                size={16}
                className={cn("shrink-0 ml-4 text-muted-foreground transition-transform duration-200", open === i && "rotate-180")}
              />
            </button>
            {open === i && (
              <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosingCta({ headline, subtext, onCta }: { headline: string; subtext: string; onCta: () => void }) {
  return (
    <section className="py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center rounded-3xl p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.60 0.22 235 / 0.12) 0%, oklch(0.55 0.18 195 / 0.08) 50%, oklch(0.58 0.20 265 / 0.10) 100%)", border: "1px solid oklch(0.60 0.22 235 / 0.20)" }}
      >
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, oklch(0.60 0.22 235 / 0.15) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, oklch(0.55 0.18 195 / 0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{headline}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{subtext}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-primary text-primary-foreground font-bold px-8 rounded-2xl h-12 cursor-pointer hover:opacity-90"
              onClick={onCta}
            >
              Get Started Today <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="ghost"
              className="border border-border rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40"
              onClick={() => window.location.href = "/contact"}
            >
              Talk to an Expert
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">No contracts. Cancel anytime. Setup within 24 hours.</p>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────

export default function ServicePageShell({
  badge,
  headline,
  subtext,
  serviceType,
  plans,
  addons = [],
  features,
  process,
  whyPoints,
  faqs,
  ctaHeadline = "Ready to Get Started?",
  ctaSubtext = "Join 500+ Kenyan businesses that trust Nisc Cloud to build, host, and grow their digital presence.",
  trustStats,
  pricingNote,
  showcaseBlocks,
  heroImage = "https://hercules-cdn.com/file_Y6bXDnbADxoripMl7V1UFfhr",
  heroIllustration,
  heroCta2 = "View Pricing",
  heroTrustBadge = { line1: "Nairobi-Based Servers", line2: "99.9% Uptime Guaranteed" },
  plansUnderHero = false,
}: ServicePageShellProps) {
  const [selectedPlan, setSelectedPlan] = useState<OrderPlan | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero - two-column: text left, illustration right */}
      <section className="pt-28 pb-0 px-4 max-w-7xl mx-auto">
        <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16 min-h-[480px]">
          {/* Gradient background blob */}
          <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden rounded-3xl">
            <div style={{ background: "radial-gradient(ellipse 70% 80% at 80% 50%, oklch(0.92 0.06 235 / 0.18) 0%, transparent 70%)" }} className="absolute inset-0" />
            <div style={{ background: "radial-gradient(ellipse 40% 50% at 20% 80%, oklch(0.88 0.08 195 / 0.10) 0%, transparent 60%)" }} className="absolute inset-0" />
          </div>
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="flex-1 flex flex-col items-start text-left max-w-xl"
          >
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              {badge}
            </span>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-tight mb-5 text-balance">{headline}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">{subtext}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="bg-primary text-primary-foreground font-bold px-8 rounded-2xl h-12 cursor-pointer hover:opacity-90"
                onClick={() => setSelectedPlan(plans[Math.floor(plans.length / 2)] ?? plans[0])}
              >
                Get Started <ArrowRight size={15} className="ml-1.5" />
              </Button>
              <Button
                variant="ghost"
                className="border border-border rounded-2xl h-12 cursor-pointer font-medium hover:border-primary/40"
                onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
              >
                {heroCta2}
              </Button>
            </div>
          </motion.div>

            {/* Right: illustration */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="flex-1 w-full lg:max-w-[560px] relative"
          >
            {heroIllustration ? (
              <div className="rounded-3xl overflow-hidden border border-border/40 shadow-2xl bg-gradient-to-br from-muted/60 to-muted/20 p-6">
                {heroIllustration}
              </div>
            ) : (
              <div
                className="rounded-3xl overflow-hidden shadow-2xl border border-border/40"
                style={{ background: "linear-gradient(135deg, oklch(0.72 0.2 210 / 0.07) 0%, oklch(0.65 0.18 240 / 0.04) 100%)" }}
              >
                <img
                  src={heroImage}
                  alt={`${badge} illustration`}
                  className="w-full object-cover h-72 md:h-96 lg:h-[420px]"
                />
              </div>
            )}
            {/* Floating trust badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-card border border-border shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">✓</div>
              <div>
                <div className="text-xs font-bold text-foreground">{heroTrustBadge.line1}</div>
                <div className="text-[10px] text-muted-foreground">{heroTrustBadge.line2}</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      {trustStats && <TrustBar stats={trustStats} />}

      {/* Plans directly under hero if requested */}
      {plansUnderHero && (
        <div id="pricing">
          <PricingSection plans={plans} addons={addons} note={pricingNote} onSelect={setSelectedPlan} />
        </div>
      )}

      {/* Features */}
      <FeaturesGrid features={features} />

      {/* Showcase blocks */}
      {showcaseBlocks && showcaseBlocks.length > 0 && (
        <ServiceShowcaseSection blocks={showcaseBlocks} />
      )}

      {/* Pricing - only if not already shown under hero */}
      {!plansUnderHero && (
        <div id="pricing">
          <PricingSection plans={plans} addons={addons} note={pricingNote} onSelect={setSelectedPlan} />
        </div>
      )}

      {/* Process */}
      {process && <ProcessSection steps={process} />}

      {/* Why */}
      {whyPoints && <WhySection points={whyPoints} />}

      {/* FAQ */}
      {faqs && <FaqSection faqs={faqs} />}

      {/* CTA */}
      <ClosingCta
        headline={ctaHeadline}
        subtext={ctaSubtext}
        onCta={() => setSelectedPlan(plans[Math.floor(plans.length / 2)] ?? plans[0])}
      />

      <OrderDialog
        open={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
        addons={addons}
        serviceType={serviceType}
      />

      <Footer />
    </div>
  );
}
