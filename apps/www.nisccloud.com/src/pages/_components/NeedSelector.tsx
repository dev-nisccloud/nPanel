import { GoalArtwork } from "./GoalArtwork.tsx";
import { PillarIcon, type Pillar } from "./PillarIcon.tsx";
import { useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  Server,
  ShoppingCart,
  HardDrive,
  Mail,
  Cpu,
  BarChart2,
  Megaphone,
  AtSign,
  Sparkles,
  MessageSquare,
  Workflow,
  Zap,
  ArrowRight,
  Target,
  Globe,
  PenTool,
  MonitorSmartphone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button.tsx";

import { PointerHighlight } from "@/components/ui/pointer-highlight.tsx";

import { cn } from "@/lib/utils.ts";

import { trackEvent } from "@/lib/track.ts";

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
  label: string;

  kind: "hosting" | "marketing" | "ai" | "build";

  featured?: boolean;

  stepLabel: string;

  badge: string;

  headline: string;

  highlight: string;

  subtext: string;

  primaryCta: { label: string; href: string };

  features: Feature[];
};

const runTab: Tab = {
  label: "Run My Business Online",

  kind: "hosting",

  featured: true,

  stepLabel: "Run",

  badge: "RUN",

  headline: "Run your business online",

  highlight: "on one reliable setup.",

  subtext:
    "Choose domains, hosting, business email or cloud servers, then manage them through one connected account.",

  primaryCta: { label: "Explore Cloud Products", href: "/hosting" },

  features: [
    {
      icon: Globe,
      label: "Domains",
      desc: "Find your name and check live prices",
      href: "/hosting/domains",
    },
    {
      icon: Server,
      label: "Hosting & WordPress",
      desc: "Website hosting and managed WordPress",
      href: "/hosting",
    },
    {
      icon: Mail,
      label: "Business Email",
      desc: "Professional email on your own domain",
      href: "/hosting/email",
    },
    {
      icon: HardDrive,
      label: "Cloud Servers & Migrations",
      desc: "VPS, VDS, dedicated servers and planned moves",
      href: "/hosting/vps",
    },
  ],
};

const buildTab: Tab = {
  label: "Build My Brand or Website",

  kind: "build",

  stepLabel: "Build",

  badge: "BUILD",

  headline: "Build a brand and digital experience",

  highlight: "customers remember.",

  subtext:
    "Create your identity, website, online store or software around the way your business works.",

  primaryCta: { label: "Explore Build Solutions", href: "/services" },

  features: [
    {
      icon: Target,
      label: "Branding & Identity",
      desc: "Positioning, identity and a practical brand system",
      href: "/services/brand-identity",
    },
    {
      icon: MonitorSmartphone,
      label: "Website Design",
      desc: "A clear digital home for your business",
      href: "/services/website-design",
    },
    {
      icon: ShoppingCart,
      label: "Ecommerce Development",
      desc: "Products, payments and customer journeys",
      href: "/services/ecommerce",
    },
    {
      icon: Cpu,
      label: "Software & Applications",
      desc: "Custom tools for customers and teams",
      href: "/contact?service=custom&serviceName=Application%20Development",
    },
  ],
};

const tabs: Tab[] = [
  buildTab,
  runTab,
  {
    label: "Grow My Customer Base",

    kind: "marketing",

    stepLabel: "Grow",

    badge: "GROW",

    headline: "Grow with clearer marketing",

    highlight: "built around your goals.",

    subtext:
      "Connect strategy, content, paid media, email and search around the customers you want to reach.",

    primaryCta: { label: "Explore Growth Services", href: "/services/marketing" },

    features: [
      {
        icon: PenTool,
        label: "Strategy, Social & Content",
        desc: "A clear plan, content creation and video",
        href: "/services/social-media",
      },

      {
        icon: BarChart2,
        label: "SEO / AEO / GEO",
        desc: "Be found in search and AI answers",
        href: "/services/seo",
      },

      {
        icon: Megaphone,
        label: "Paid Advertising",
        desc: "Campaigns built around your audience",
        href: "/services/paid-ads",
      },

      {
        icon: AtSign,
        label: "Email Marketing",
        desc: "Keep customers engaged and follow up",
        href: "/services/email-marketing",
      },
    ],
  },

  {
    label: "Automate My Business",

    kind: "ai",

    stepLabel: "Zepo AI",

    badge: "ZEPO AI",

    headline: "Automate routine work with",

    highlight: "supported AI workflows.",

    subtext:
      "Use Zepo AI and supported integrations to assist with customer conversations, follow-ups and repetitive workflows while your team stays in control.",

    primaryCta: { label: "Explore Automation", href: "/services/zepo-ai" },

    features: [
      {
        icon: Sparkles,
        label: "AI Content Writer",
        desc: "Help drafting posts, emails and adverts",
        href: "/services/zepo-ai",
      },

      {
        icon: Workflow,
        label: "Marketing Guidance",
        desc: "Get campaign ideas, sales hooks and practical next steps",
        href: "/services/zepo-ai",
      },

      {
        icon: MessageSquare,
        label: "AI Chatbots",
        desc: "Answer common questions and hand over to your team",
        href: "/services/zepo-ai",
      },

      {
        icon: Zap,
        label: "Renewal Reminders",
        desc: "Keep track of relevant Nisc Cloud service renewals",
        href: "/services/zepo-ai",
      },
    ],
  },
];


const TAB_PILLAR: Record<Tab["kind"], Pillar> = {
  build: "build",
  hosting: "run",
  marketing: "grow",
  ai: "ai",
};

export default function NeedSelector() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const tab = tabs[activeTab];

  const selectTab = (index: number, focus = false) => {
    setActiveTab(index);
    trackEvent("goal_select", { goal: tabs[index].label, goal_id: tabs[index].kind });
    const el = document.getElementById(`goal-tab-${index}`);
    if (focus) el?.focus({ preventScroll: true });
    // Keep the selected option in view on the mobile rail without scrolling the page.
    if (el && listRef.current && listRef.current.scrollWidth > listRef.current.clientWidth) {
      const list = listRef.current;
      const target = el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2;
      list.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? "auto" : "smooth" });
    }
  };

  return (
    <section id="needs" className="relative bg-background pb-6 pt-6 md:pb-8 md:pt-8">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-center md:mb-6"
        >
          <p className="type-label mb-2 text-[#38b6ff] dark:text-[#38b6ff]">Start with your goal</p>
          <h2 className="type-h2 mx-auto max-w-2xl text-foreground">
            What do you need{" "}
            <PointerHighlight {...pointerHighlightProps} containerClassName="inline-block align-baseline">
              <span className="text-[#38b6ff] dark:text-[#38b6ff]">today?</span>
            </PointerHighlight>
          </h2>
        </motion.div>

        {/* Compact selector: 4-up on desktop, 2x2 on tablet, scroll-snap rail on mobile. */}
        <div className="relative -mx-4 mb-6 px-4 md:mx-0 md:mb-8 md:px-0">
          <div
            ref={listRef}
            role="tablist"
            aria-label="Choose your starting point"
            className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto overscroll-x-contain scroll-px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4"
          >
            {tabs.map((t, i) => {
              const isActive = activeTab === i;
              return (
                <button
                  key={t.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  id={`goal-tab-${i}`}
                  aria-controls="goal-panel"
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(event) => {
                    const next =
                      event.key === "ArrowRight" || event.key === "ArrowDown"
                        ? (i + 1) % tabs.length
                        : event.key === "ArrowLeft" || event.key === "ArrowUp"
                          ? (i - 1 + tabs.length) % tabs.length
                          : event.key === "Home"
                            ? 0
                            : event.key === "End"
                              ? tabs.length - 1
                              : null;
                    if (next !== null) {
                      event.preventDefault();
                      selectTab(next, true);
                    }
                  }}
                  onClick={() => selectTab(i)}
                  className={cn(
                    "group flex min-h-[64px] w-[76%] min-w-[76%] shrink-0 snap-center items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 xs:w-[68%] xs:min-w-[68%] sm:w-auto sm:min-w-0",
                    isActive
                      ? "border-primary bg-primary/[0.07] shadow-[0_14px_30px_-26px_rgb(2_132_199_/_0.8)]"
                      : "border-border bg-card hover:border-primary/45 hover:bg-primary/[0.03]",
                  )}
                >
                  <PillarIcon pillar={TAB_PILLAR[t.kind]} active={isActive} />
                  <span className="line-clamp-2 min-w-0 flex-1 text-sm font-bold leading-snug text-foreground">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Mobile affordances: edge fade + indicators. */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent sm:hidden" />
          <div className="mt-3 flex items-center justify-center gap-3 sm:hidden">
            <div className="flex items-center gap-1.5" aria-hidden>
              {tabs.map((t, i) => (
                <span
                  key={t.label}
                  className={cn(
                    "h-1.5 rounded-full transition-[width,background-color] duration-200",
                    activeTab === i ? "w-5 bg-primary" : "w-1.5 bg-border",
                  )}
                />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              {activeTab + 1} of {tabs.length} · swipe for more
            </span>
          </div>
        </div>

        <div
          role="tabpanel"
          id="goal-panel"
          aria-labelledby={`goal-tab-${activeTab}`}
          className="grid items-center gap-6 lg:min-h-[440px] lg:grid-cols-2 lg:gap-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`copy-${activeTab}`}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="order-1 flex flex-col gap-5"
            >
              <div>
                <p className="type-label mb-2 text-[#38b6ff] dark:text-[#38b6ff]">{tab.stepLabel}</p>
                <h3 className="type-h2 text-balance text-foreground">
                  {tab.headline} {tab.highlight}
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">{tab.subtext}</p>
              </div>

              <div>
                <Button asChild className="cursor-pointer gap-1.5 px-5"><Link to={tab.primaryCta.href}>
                  {tab.primaryCta.label}
                  <ArrowRight size={14} />
                </Link></Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {tab.features.slice(0, 4).map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    onClick={() => {
                      trackEvent("goal_action_click", { goal_id: tab.kind, action: f.label, href: f.href });
                      navigate(f.href);
                    }}
                    className="group flex w-full items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background text-primary">
                      <f.icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground sm:text-sm">{f.label}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{f.desc}</div>
                    </div>
                    <ArrowRight size={14} className="mt-1.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="order-2 flex items-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`art-${activeTab}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full"
              >
                <GoalArtwork kind={tab.kind} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
