import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import Navbar from "@/pages/_components/Navbar.tsx";
import Footer from "@/pages/_components/Footer.tsx";
import OrderDialog, { type OrderPlan } from "@/pages/hosting/_components/OrderDialog.tsx";
import ServiceShowcaseSection, { type ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import ScrollStack, { ScrollStackItem } from "@/components/ui/ScrollStack.tsx";

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
  showcaseBlocks?: ShowcaseBlock[];
  heroImage?: string;
  heroIllustration?: React.ReactNode;
  heroCta2?: string;
  heroTrustBadge?: { line1: string; line2: string };
  plansUnderHero?: boolean;
  customPlansSection?: React.ReactNode;
};

// ─── Animated Counter Hook ───────────────────────────────────────────────────

/**
 * Parses a stat string like "KES 85M+", "4.8×", "220+", "32%", "99.9%"
 * into { prefix, number, suffix, decimals }
 */
function parseStatValue(value: string): { prefix: string; number: number; suffix: string; decimals: number } {
  // Match optional prefix (non-digit chars at start), then number (with optional decimal), then suffix
  const match = value.match(/^([^\d]*)([\d,.]+)([^\d]*)$/);
  if (!match) return { prefix: "", number: 0, suffix: value, decimals: 0 };
  const [, prefix, numStr, suffix] = match;
  const cleaned = numStr.replace(/,/g, "");
  const decimals = cleaned.includes(".") ? cleaned.split(".")[1].length : 0;
  return { prefix: prefix.trim(), number: parseFloat(cleaned), suffix, decimals };
}

function useAnimatedCounter(target: number, decimals: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(parseFloat((eased * target).toFixed(decimals)));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { count, ref };
}

function AnimatedStat({ value, label, delay }: { value: string; label: string; delay: number }) {
  const { prefix, number, suffix, decimals } = parseStatValue(value);
  const { count, ref } = useAnimatedCounter(number, decimals);

  const displayNum = decimals > 0
    ? count.toFixed(decimals)
    : Math.floor(count).toLocaleString();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="text-center group"
    >
      <div className="text-3xl font-extrabold text-primary mb-1 group-hover:scale-105 transition-transform duration-300 tabular-nums">
        {prefix}{displayNum}{suffix}
      </div>
      <div className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</div>
    </motion.div>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────

function TrustBar({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="relative overflow-hidden border-y border-border/50">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <AnimatedStat key={s.label} value={s.value} label={s.label} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

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

// Asymmetric bento spans removed — all cards uniform size

function FeaturesGrid({ features }: { features: Feature[] }) {
  return (
    <section className="relative py-24 overflow-hidden border-t border-dashed border-border/50">
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        {/* Bento grid */}
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

        {/* Editorial right-aligned heading below the grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 max-w-xl ml-auto text-right"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Everything{" "}
            <span className="text-primary">You Get.</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            A complete, battle-tested system — nothing is an afterthought.
          </p>
        </motion.div>
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
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Transparent. No Surprises.</h2>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            {note ?? "All plans include onboarding support. Scale or cancel anytime."}
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

// ─── Process ──────────────────────────────────────────────────────────────────

function ProcessSection({ steps }: { steps: ProcessStep[] }) {
  return (
    <section className="relative py-24 overflow-hidden border-t border-border/40 bg-muted/10">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/3 via-transparent to-transparent" />
      <div className="relative max-w-4xl mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Our Proven Process</h2>
          <p className="text-muted-foreground text-base mt-3 max-w-xl mx-auto">
            A clear, step-by-step path from where you are now to where you want to be.
          </p>
        </motion.div>

        <div className="w-full relative">
          <ScrollStack
            useWindowScroll={true}
            itemDistance={120}
            baseScale={0.9}
            itemScale={0.04}
            stackPosition="30%"
            className="w-full"
          >
            {steps.map((s, i) => (
              <ScrollStackItem key={s.num} itemClassName="!p-0 !bg-transparent !shadow-none !m-0 !mt-8">
                <div className="bg-card border border-border/60 rounded-3xl p-8 md:p-10 shadow-xl shadow-black/5 flex flex-col md:flex-row gap-6 md:gap-8 items-start group hover:border-primary/30 transition-colors">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                    {s.num}
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl mb-3 text-foreground group-hover:text-primary transition-colors">{s.title}</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </div>
    </section>
  );
}


// ─── Why Section ──────────────────────────────────────────────────────────────

function WhySection({ points }: { points: WhyPoint[] }) {
  return (
    <section className="relative py-24 overflow-hidden border-t border-border/40">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse, oklch(0.60 0.22 235 / 0.4), transparent)" }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built Different, Purposely</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {points.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group relative bg-card rounded-3xl border border-border/60 p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-bold flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                  ✓
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-24 border-t border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Common Questions</h2>
        </div>
        <div className="space-y-3 max-w-3xl mx-auto">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={cn(
                "rounded-2xl border overflow-hidden transition-all duration-300",
                open === i ? "border-primary/30 shadow-lg shadow-primary/5" : "border-border/60 bg-card"
              )}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={16}
                  className={cn("shrink-0 ml-4 text-muted-foreground transition-transform duration-300", open === i && "rotate-180 text-primary")}
                />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
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
            LET'S BUILD TOGETHER
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
              Talk to an Expert
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6 opacity-70">No contracts. Cancel anytime. Setup within 24 hours.</p>
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
  plans,
  heroImage,
  heroIllustration,
  heroCta2,
  heroTrustBadge,
  onGetStarted,
}: {
  badge: string;
  headline: React.ReactNode;
  subtext: string;
  plans: OrderPlan[];
  heroImage?: string;
  heroIllustration?: React.ReactNode;
  heroCta2?: string;
  heroTrustBadge?: { line1: string; line2: string };
  onGetStarted: () => void;
}) {
  return (
    <section className="relative pt-28 pb-16 px-4 overflow-hidden">
      {/* Background */}
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

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 min-h-[520px]">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col items-start text-left max-w-2xl"
          >
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6"
            >
              <Sparkles size={12} />
              {badge}
            </motion.span>
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold leading-[1.1] mb-6 text-balance">
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
            className="flex-1 w-full lg:max-w-[580px] relative"
          >
            {heroIllustration ? (
              <div className="rounded-3xl overflow-hidden border border-border/40 shadow-2xl bg-gradient-to-br from-muted/60 to-muted/20 p-6">
                {heroIllustration}
              </div>
            ) : (
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/40 group">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-muted/80 border-b border-border/40 backdrop-blur-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">nisccloud.co.ke</span>
                </div>
                <img
                  src={heroImage ?? "https://hercules-cdn.com/file_Y6bXDnbADxoripMl7V1UFfhr"}
                  alt={`${badge} illustration`}
                  className="w-full object-cover h-72 md:h-96 lg:h-[420px] group-hover:scale-[1.02] transition-transform duration-700"
                />
              </div>
            )}
            {/* Floating trust badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute -bottom-4 -left-4 bg-card border border-border/60 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">✓</div>
              <div>
                <div className="text-xs font-bold text-foreground">{heroTrustBadge?.line1 ?? "Nairobi-Based Servers"}</div>
                <div className="text-[10px] text-muted-foreground">{heroTrustBadge?.line2 ?? "99.9% Uptime Guaranteed"}</div>
              </div>
            </motion.div>
            {/* Secondary floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -top-4 -right-4 bg-card border border-primary/20 shadow-xl shadow-primary/10 rounded-2xl px-4 py-3 flex items-center gap-2"
            >
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => <Star key={n} size={10} className="text-amber-400 fill-amber-400" />)}
              </div>
              <div className="text-xs font-bold">500+ Clients</div>
            </motion.div>
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
  customPlansSection,
}: ServicePageShellProps) {
  const [selectedPlan, setSelectedPlan] = useState<OrderPlan | null>(null);

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
        heroCta2={heroCta2}
        heroTrustBadge={heroTrustBadge}
        onGetStarted={() => setSelectedPlan(plans[Math.floor(plans.length / 2)] ?? plans[0])}
      />

      {trustStats && <TrustBar stats={trustStats} />}

      {plansUnderHero && (
        <div id="pricing">
          {customPlansSection ? customPlansSection : <PricingSection plans={plans} addons={addons} note={pricingNote} onSelect={setSelectedPlan} />}
        </div>
      )}

      <FeaturesGrid features={features} />

      {showcaseBlocks && showcaseBlocks.length > 0 && (
        <ServiceShowcaseSection blocks={showcaseBlocks} />
      )}

      {!plansUnderHero && (
        <div id="pricing">
          {customPlansSection ? customPlansSection : <PricingSection plans={plans} addons={addons} note={pricingNote} onSelect={setSelectedPlan} />}
        </div>
      )}

      {process && <ProcessSection steps={process} />}

      {whyPoints && <WhySection points={whyPoints} />}

      {faqs && <FaqSection faqs={faqs} />}

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
