import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Paintbrush, Server, TrendingUp, Bot,
  Globe, ShoppingCart, Layers,
  HardDrive, Mail, Lock, Cpu, Link,
  BarChart2, Megaphone, Share2, AtSign,
  Sparkles, MessageSquare, Workflow, Zap,
  ArrowRight, Target, Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { PointerHighlight } from "@/components/ui/pointer-highlight.tsx";
import { cn } from "@/lib/utils.ts";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";

const pointerHighlightProps = {
  rectangleClassName: "border-primary/50",
  pointerClassName: "text-primary",
} as const;

type Feature = {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
};

type Tab = {
  icon: React.ElementType;
  label: string;
  step: string;
  stepLabel: string;
  badge: string;
  headline: string;
  highlight: string;
  subtext: string;
  image: string;
  features: Feature[];
  cta: string;
  ctaHref: string;
};


const trustedClients = [
  { name: "Amarom", logo: "/clients/amarom2.png" },
  { name: "Medplus", logo: "/clients/medplus-logo.png" },
  { name: "Epitome", logo: "/clients/epitome-logo.png" },
];

const tabs: Tab[] = [
  {
    icon: Paintbrush,
    label: "Create My Brand",
    step: "01",
    stepLabel: "Create",
    badge: "CREATE",
    headline: "Your brand should open",
    highlight: "more doors.",
    subtext:
      "We shape your look, message, and website so people understand you fast and trust you enough to buy.",
    image: niscWebsiteImage("create_brand.png"),
    features: [
      { icon: Target, label: "Brand Strategy & Positioning", desc: "From KES 15,000", href: "/services/brand-identity" },
      { icon: Layers, label: "Brand Identity & Design", desc: "From KES 25,000", href: "/services/brand-identity" },
      { icon: Globe, label: "Website Design", desc: "From KES 35,000", href: "/services/website-design" },
      { icon: ShoppingCart, label: "E-commerce Design", desc: "From KES 45,000", href: "/services/ecommerce" },
    ],
    cta: "Start Building",
    ctaHref: "/services/brand-identity",
  },
  {
    icon: Server,
    label: "Go Online",
    step: "02",
    stepLabel: "Host",
    badge: "HOST",
    headline: "Hosting that stays",
    highlight: "fast and steady.",
    subtext:
      "Domain, hosting, email, and security in one place. Free migration help, 99.99% uptime, and support around the clock.",
    image: niscWebsiteImage("Go online.png"),
    features: [
      { icon: HardDrive, label: "Website Hosting", desc: "From KES 350/mo", href: "/hosting/shared" },
      { icon: Zap, label: "WordPress Hosting", desc: "From KES 500/mo", href: "/hosting/wordpress" },
      { icon: Cpu, label: "VPS Hosting", desc: "From KES 2,000/mo", href: "/hosting/vps" },
      { icon: Server, label: "VDS Hosting", desc: "Dedicated virtual resources", href: "/hosting/vds" },
      { icon: Mail, label: "Business Email Hosting", desc: "From KES 250/mo", href: "/hosting/email" },
      { icon: Link, label: "Domain Registration", desc: "Search to see live prices", href: "/hosting/domains" },
      { icon: Lock, label: "Website Security", desc: "SSL and site protection", href: "/hosting/ssl" },
    ],
    cta: "Get Hosted Today",
    ctaHref: "/hosting",
  },
  {
    icon: TrendingUp,
    label: "Get More Customers",
    step: "03",
    stepLabel: "Market",
    badge: "MARKET",
    headline: "Marketing that brings",
    highlight: "real buyers.",
    subtext:
      "We put your business in front of people who are already looking for what you sell, then help you turn visits into sales.",
    image: niscWebsiteImage("Get more customers.jpg"),
    features: [
      { icon: Share2, label: "Social Media Marketing (SMM)", desc: "From KES 20,000/mo", href: "/services/social-media" },
      { icon: BarChart2, label: "SEO / AEO / GEO", desc: "From KES 25,000/mo", href: "/services/seo" },
      { icon: Megaphone, label: "Paid Advertising", desc: "11% of ad spend + KES 6,000/mo", href: "/services/paid-ads" },
      { icon: AtSign, label: "Email Marketing", desc: "From KES 1,500/mo", href: "/services/email-marketing" },
      { icon: Users, label: "Influencer Marketing", desc: "From KES 30,000/campaign", href: "/services/social-media" },
    ],
    cta: "Start Growing",
    ctaHref: "/services/seo",
  },
  {
    icon: Bot,
    label: "Automate with AI",
    step: "04",
    stepLabel: "Zeepo AI",
    badge: "ZEEPO AI",
    headline: "Let smart tools handle",
    highlight: "the busy work.",
    subtext:
      "Zeepo AI helps with replies, content, and follow-ups so your team can focus on people and sales.",
    image: niscWebsiteImage("Automate with AI.png"),
    features: [
      { icon: Sparkles, label: "AI Content Writer", desc: "From KES 1,500/mo", href: "/services/zeepo-ai" },
      { icon: Workflow, label: "Marketing Automation", desc: "From KES 1,500/mo", href: "/services/zeepo-ai" },
      { icon: MessageSquare, label: "AI Chatbots", desc: "From KES 5,000/mo", href: "/services/zeepo-ai" },
      { icon: Zap, label: "Lead Nurturing Flows", desc: "From KES 3,000/mo", href: "/services/zeepo-ai" },
    ],
    cta: "Meet Zeepo AI",
    ctaHref: "/services/zeepo-ai",
  },
];

function TabVisual({ tabs, activeTab }: { tabs: Tab[]; activeTab: number }) {
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    setLoadedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    const preloadRemaining = () => {
      tabs.forEach((t, i) => {
        if (i === 0) return;
        const img = new Image();
        img.decoding = "async";
        img.src = t.image;
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preloadRemaining, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const timeoutId = globalThis.setTimeout(preloadRemaining, 1500);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] lg:aspect-auto lg:min-h-full">
      {tabs.map((t, i) =>
        loadedTabs.has(i) ? (
          <img
            key={t.badge}
            src={t.image}
            alt={t.label}
            width={960}
            height={720}
            decoding="async"
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out",
              i === activeTab ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          />
        ) : null,
      )}
    </div>
  );
}

export default function NeedSelector() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const tab = tabs[activeTab];

  return (
    <section id="needs" className="relative overflow-hidden bg-background pb-12 pt-6 md:pb-16 md:pt-8">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center md:mb-8"
        >
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            Where do you start?
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            What Do You Need{" "}
            <PointerHighlight
              {...pointerHighlightProps}
              containerClassName="inline-block align-baseline"
            >
              <span className="text-primary">Today?</span>
            </PointerHighlight>
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground md:text-base">
            Pick your goal and we will show you the clear path to get there.
          </p>
        </motion.div>

        <div
          className="mb-6 flex flex-wrap items-center justify-center gap-2 md:mb-8"
          role="tablist"
          aria-label="Choose your starting point"
        >
          {tabs.map((t, i) => {
            const isActive = activeTab === i;
            return (
              <button
                key={t.label}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(i)}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10"
        >
          <div className="order-1 flex flex-col gap-5 lg:order-1">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">
                {tab.step}  {tab.stepLabel}
              </p>
              <h3 className="text-2xl font-bold leading-snug tracking-tight text-foreground md:text-[1.75rem]">
                {tab.headline}{" "}
                <PointerHighlight
                  key={`panel-highlight-${activeTab}`}
                  {...pointerHighlightProps}
                  containerClassName="inline-block align-baseline"
                >
                  <span className="text-primary">{tab.highlight}</span>
                </PointerHighlight>
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
                {tab.subtext}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate(tab.ctaHref)}
                className="h-10 cursor-pointer gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {tab.cta}
                <ArrowRight size={16} />
              </Button>

              <div className="hidden h-8 w-px bg-border sm:block" />

              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  {trustedClients.map((client) => (
                    <div
                      key={client.name}
                      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted sm:h-12 sm:w-12"
                      title={client.name}
                    >
                      <img
                        src={client.logo}
                        alt={client.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-1.5"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                Trusted by <strong className="font-semibold text-foreground">100+</strong> businesses
                </span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {tab.features.map((f) => (
                <button
                  key={f.label}
                  onClick={() => navigate(f.href)}
                  className="group flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-muted/60"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background text-primary">
                    <f.icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground transition-colors group-hover:text-primary sm:text-sm">
                      {f.label}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{f.desc}</div>
                  </div>
                  <ArrowRight
                    size={14}
                    className="mt-1 shrink-0 text-primary opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-60"
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="w-fit cursor-pointer text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              Talk to us about your project
            </button>
          </div>

          <div className="order-2 lg:order-2">
            <TabVisual tabs={tabs} activeTab={activeTab} />
          </div>
        </div>
      </div>
    </section>
  );
}
