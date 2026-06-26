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

type Feature = {
  icon: React.ElementType;
  label: string;
  desc: string;
  href: string;
};

type Tab = {
  icon: React.ElementType;
  label: string;
  accent: string;
  shapeBg: string;
  badge: string;
  headline: string;
  highlight: string;
  subtext: string;
  image: string;
  features: Feature[];
  cta: string;
  ctaHref: string;
};

const tabs: Tab[] = [
  {
    icon: Paintbrush,
    label: "Create My Brand",
    accent: "oklch(0.60 0.22 235)",
    shapeBg: "oklch(0.60 0.22 235)",
    badge: "CREATE",
    headline: "Your brand is the leading",
    highlight: "platform for growth!",
    subtext:
      "We build identities that stand out, convert, and scale - from logo to live website, all under one roof.",
    image: "https://hercules-cdn.com/file_iRuRYMoDty5JbvoBwlLyrLKA",
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
    accent: "oklch(0.48 0.18 200)",
    shapeBg: "oklch(0.55 0.16 195)",
    badge: "HOST",
    headline: "Fast, reliable hosting",
    highlight: "built for Kenya.",
    subtext:
      "Everything you need to launch and scale your online presence - domain, hosting, email, SSL, all in one place.",
    image: "https://hercules-cdn.com/file_yDWDEz6sDDJXMOBUEpmE9ZOp",
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
    accent: "oklch(0.48 0.20 265)",
    shapeBg: "oklch(0.55 0.18 265)",
    badge: "MARKET",
    headline: "Marketing is the engine",
    highlight: "for your sales!",
    subtext:
      "Data-driven marketing that puts your business in front of the right people at the right time.",
    image: "https://hercules-cdn.com/file_1c2pw6Krhucfu3bEROHTnO03",
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
    accent: "oklch(0.42 0.16 160)",
    shapeBg: "oklch(0.50 0.14 160)",
    badge: "ZEEPO AI",
    headline: "AI is changing the game",
    highlight: "for your business!",
    subtext:
      "Zeepo AI handles the repetitive work so you can focus on building relationships and closing deals.",
    image: "https://hercules-cdn.com/file_Klrt5l2KAFhg1snWGgkuEwez",
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

export default function NeedSelector() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const tab = tabs[activeTab];

  return (
    <section id="needs" className="py-10 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 bg-muted/30" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative">

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-mono mb-3">
            WHERE DO YOU START?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            What Do You Need Today?
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Pick your goal - we'll show you exactly how we deliver it.
          </p>
        </motion.div>

        {/* Tab bar - card-style buttons with borders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-3">
          {tabs.map((t, i) => {
            const isActive = activeTab === i;
            return (
              <motion.button
                key={t.label}
                onClick={() => setActiveTab(i)}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-2.5 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: isActive ? t.accent : "var(--border)",
                  backgroundColor: isActive ? `${t.accent}10` : "var(--card)",
                  boxShadow: isActive ? `0 0 0 1px ${t.accent}30, 0 4px 16px ${t.accent}12` : undefined,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? `${t.accent}20` : "var(--muted)",
                    color: isActive ? t.accent : "var(--muted-foreground)",
                  }}
                >
                  <t.icon size={15} />
                </div>
                <span
                  className="text-xs md:text-sm font-semibold text-left leading-tight transition-colors duration-200"
                  style={{ color: isActive ? t.accent : "var(--muted-foreground)" }}
                >
                  {t.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="grid md:grid-cols-2 gap-12 items-center py-8 border border-border/60 rounded-3xl px-8 bg-card/50"
          >
            {/* LEFT: text content */}
            <div className="flex flex-col gap-7">
              {/* Badge */}
              <div>
                <span
                  className="inline-block text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full mb-4"
                  style={{
                    backgroundColor: `${tab.accent}18`,
                    color: tab.accent,
                    border: `1px solid ${tab.accent}30`,
                  }}
                >
                  {tab.badge}
                </span>
                <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                  {tab.headline}{" "}
                  <span style={{ color: tab.accent }}>{tab.highlight}</span>
                </h3>
                <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                  {tab.subtext}
                </p>
              </div>

              {/* Features - clean list: title + from price + arrow, no border */}
              <div className="flex flex-col">
                {tab.features.map((f, i) => (
                  <motion.button
                    key={f.label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.07 }}
                    onClick={() => navigate(f.href)}
                    className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-b-0 text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${tab.accent}15`, color: tab.accent }}
                      >
                        <f.icon size={15} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                          {f.label}
                        </div>
                        <div
                          className="text-xs font-medium mt-0.5"
                          style={{ color: tab.accent }}
                        >
                          {f.desc}
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      size={15}
                      className="shrink-0 ml-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200"
                      style={{ color: tab.accent }}
                    />
                  </motion.button>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  onClick={() => navigate(tab.ctaHref)}
                  className="gap-2 font-semibold cursor-pointer rounded-full px-6"
                  style={{ backgroundColor: tab.accent, color: "white" }}
                >
                  {tab.cta}
                  <ArrowRight size={15} />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/contact")}
                  className="text-sm cursor-pointer rounded-full"
                >
                  Talk to us
                </Button>
              </div>
            </div>

            {/* RIGHT: styled image with shape background */}
            <div className="relative hidden md:flex items-center justify-center h-[480px]">
              {/* Colored rectangle background shape */}
              <motion.div
                key={`shape-${activeTab}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute right-0 top-8 bottom-8 w-[75%] rounded-3xl"
                style={{ backgroundColor: tab.shapeBg }}
              />

              {/* Decorative rings */}
              <div
                className="absolute right-[10%] top-4 w-28 h-28 rounded-full border-2 opacity-30"
                style={{ borderColor: tab.accent }}
              />
              <div
                className="absolute left-[15%] bottom-6 w-16 h-16 rounded-full border opacity-20"
                style={{ borderColor: tab.accent }}
              />

              {/* Photo */}
              <motion.img
                key={`img-${activeTab}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                src={tab.image}
                alt={tab.label}
                className="relative z-10 w-[70%] h-[85%] object-cover rounded-2xl shadow-2xl"
              />

              {/* Small floating stat card */}
              <motion.div
                key={`float-${activeTab}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="absolute bottom-8 left-0 z-20 bg-background/95 backdrop-blur-md rounded-2xl px-5 py-4 shadow-xl border border-border/60"
              >
                <div
                  className="text-[10px] font-mono font-bold tracking-widest mb-1"
                  style={{ color: tab.accent }}
                >
                  NISC CLOUD
                </div>
                <div className="text-sm font-bold text-foreground">{tab.badge} services</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  500+ businesses powered
                </div>
              </motion.div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
