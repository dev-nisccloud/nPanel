import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
    headline: "Your brand is the leading",
    highlight: "platform for growth!",
    subtext:
      "We build identities that stand out, convert, and scale — from logo to live website, all under one roof.",
    image: "https://storage.nisccloud.com/npanel-uploads/nisc-website/create.jpg",
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
    headline: "Fast, reliable hosting",
    highlight: "built for Kenya.",
    subtext:
      "Everything you need to launch and scale your online presence — domain, hosting, email, SSL, all in one place.",
    image: "https://storage.nisccloud.com/npanel-uploads/nisc-website/online.jpg",
    features: [
      { icon: HardDrive, label: "Website Hosting", desc: "From KES 350/mo", href: "/hosting/shared" },
      { icon: Zap, label: "WordPress Hosting", desc: "From KES 500/mo", href: "/hosting/wordpress" },
      { icon: Cpu, label: "VPS Hosting", desc: "From KES 2,000/mo", href: "/hosting/vps" },
      { icon: Server, label: "VDS Hosting", desc: "Dedicated virtual resources", href: "/hosting/vds" },
      { icon: Mail, label: "Business Email Hosting", desc: "From KES 250/mo", href: "/hosting/email" },
      { icon: Link, label: "Domain Registration", desc: ".co.ke from KES 999/yr", href: "/hosting/domains" },
      { icon: Lock, label: "Website Security", desc: "SSL & malware protection", href: "/hosting/ssl" },
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
    headline: "Marketing is the engine",
    highlight: "for your sales!",
    subtext:
      "Data-driven marketing that puts your business in front of the right people at the right time.",
    image: "https://storage.nisccloud.com/npanel-uploads/nisc-website/market.jpg",
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
    headline: "AI is changing the game",
    highlight: "for your business!",
    subtext:
      "Zeepo AI handles the repetitive work so you can focus on building relationships and closing deals.",
    image: "https://storage.nisccloud.com/npanel-uploads/nisc-website/ai.jpg",
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

function TabVisual({ tab }: { tab: Tab }) {
  return (
    <div className="relative h-full min-h-[260px] w-full overflow-hidden rounded-[1.75rem] sm:min-h-[300px] lg:min-h-0">
      <motion.img
        key={tab.badge}
        initial={{ opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        src={tab.image}
        alt={tab.label}
        className="absolute inset-0 h-full w-full object-cover"
      />
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
            Pick your goal — we&apos;ll show you exactly how we deliver it.
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

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10"
          >
            <div className="order-1 flex flex-col gap-5 lg:order-1">
              <div>
                <p className="mb-2 text-sm font-medium text-primary">
                  {tab.step} — {tab.stepLabel}
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
                  <div className="flex -space-x-2">
                    {trustedClients.map((client) => (
                      <div
                        key={client.name}
                        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-muted"
                        title={client.name}
                      >
                        <img
                          src={client.logo}
                          alt={client.name}
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Trusted by <strong className="font-semibold text-foreground">500+</strong> businesses
                  </span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {tab.features.map((f, i) => (
                  <motion.button
                    key={f.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
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
                  </motion.button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="w-fit cursor-pointer text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Talk to us about your project →
              </button>
            </div>

            <div className="order-2 h-full min-h-[260px] lg:order-2 lg:min-h-0">
              <TabVisual tab={tab} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
