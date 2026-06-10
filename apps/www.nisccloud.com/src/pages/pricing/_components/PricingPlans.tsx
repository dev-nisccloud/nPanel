import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe, Server, Mail, ShieldCheck, TrendingUp, Cpu,
  Check, ArrowRight, Star, Zap, Building2, HardDrive,
  Layers, Wifi, Database, Package, Users, Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";
import { useNavigate } from "react-router-dom";

// ── Types ──────────────────────────────────────────────────────────────────────

type Plan = {
  id: string;
  name: string;
  tagline: string;
  highlight?: string;
  from: number;
  period: string;
  badge?: string;
  features: string[];
  recommended?: boolean;
  href: string;
};

type SubCategory = {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  plans: Plan[];
};

type Category = {
  id: string;
  label: string;
  icon: React.ElementType;
  subCategories: SubCategory[];
};

// ── Data ───────────────────────────────────────────────────────────────────────

const categories: Category[] = [
  // ── CLOUD HOSTING ─────────────────────────────────────────────────────────
  {
    id: "hosting",
    label: "Cloud Hosting",
    icon: Server,
    subCategories: [
      {
        id: "shared",
        label: "Web Hosting",
        icon: Layers,
        description: "NVMe-powered shared hosting - the fastest way to launch your website in Kenya.",
        plans: [
          {
            id: "starter",
            name: "Starter",
            tagline: "Perfect for new websites & blogs",
            from: 350,
            period: "mo",
            features: ["1 website", "10 GB NVMe SSD", "Free SSL", "cPanel control panel", "Daily backups", "24/7 support"],
            href: "/hosting/shared",
          },
          {
            id: "business",
            name: "Business",
            tagline: "For growing Kenyan businesses",
            from: 750,
            period: "mo",
            badge: "RECOMMENDED",
            recommended: true,
            features: ["Unlimited websites", "50 GB NVMe SSD", "Free SSL + CDN", "LiteSpeed server", "Priority support", "Free migration"],
            href: "/hosting/shared",
          },
          {
            id: "pro",
            name: "Pro",
            tagline: "High-traffic & e-commerce",
            from: 1400,
            period: "mo",
            highlight: "3× faster than shared",
            features: ["Unlimited websites", "100 GB NVMe SSD", "Free SSL + CDN + WAF", "Dedicated resources", "Staging environment", "Free migration"],
            href: "/hosting/shared",
          },
        ],
      },
      {
        id: "wordpress",
        label: "WordPress",
        icon: Zap,
        description: "Optimised WordPress hosting - pre-configured for speed, security, and easy management.",
        plans: [
          {
            id: "wp-starter",
            name: "WP Starter",
            tagline: "Launch your WordPress site fast",
            from: 500,
            period: "mo",
            features: ["WordPress pre-installed", "10 GB NVMe SSD", "Free SSL", "Auto WP updates", "Daily backups", "WooCommerce ready"],
            href: "/hosting/wordpress",
          },
          {
            id: "wp-business",
            name: "WP Business",
            tagline: "Speed-optimised for growing sites",
            from: 900,
            period: "mo",
            badge: "POPULAR",
            recommended: true,
            features: ["5 WP sites", "30 GB NVMe SSD", "Free SSL + CDN", "Staging environment", "Auto WP updates", "Priority support"],
            href: "/hosting/wordpress",
          },
          {
            id: "wp-pro",
            name: "WP Pro",
            tagline: "Agency & multi-site management",
            from: 1800,
            period: "mo",
            highlight: "Manage 20+ WP sites",
            features: ["20 WP sites", "80 GB NVMe SSD", "Free SSL + CDN + WAF", "Object caching", "Malware scanner", "Git version control"],
            href: "/hosting/wordpress",
          },
        ],
      },
      {
        id: "vps",
        label: "VPS",
        icon: Database,
        description: "Virtual Private Servers - dedicated vCPUs, guaranteed RAM, full root access.",
        plans: [
          {
            id: "vps-s",
            name: "VPS Lite",
            tagline: "Entry-level VPS for developers",
            from: 2000,
            period: "mo",
            features: ["2 vCPU cores", "2 GB RAM", "40 GB NVMe SSD", "Full root access", "Choice of OS", "Managed firewall"],
            href: "/hosting/vps",
          },
          {
            id: "vps-m",
            name: "VPS Standard",
            tagline: "Ideal for production workloads",
            from: 3800,
            period: "mo",
            badge: "RECOMMENDED",
            recommended: true,
            features: ["4 vCPU cores", "8 GB RAM", "80 GB NVMe SSD", "Full root access", "Hourly snapshots", "99.9% uptime SLA"],
            href: "/hosting/vps",
          },
          {
            id: "vps-l",
            name: "VPS Power",
            tagline: "Heavy workloads & high traffic",
            from: 7500,
            period: "mo",
            highlight: "Best price-to-performance",
            features: ["8 vCPU cores", "16 GB RAM", "200 GB NVMe SSD", "Full root access", "DDoS protection", "Priority network"],
            href: "/hosting/vps",
          },
        ],
      },
      {
        id: "vds",
        label: "VDS",
        icon: HardDrive,
        description: "Virtual Dedicated Servers - bare-metal performance with the flexibility of virtualisation.",
        plans: [
          {
            id: "vds-s",
            name: "VDS Essential",
            tagline: "Dedicated resources, shared infra",
            from: 8000,
            period: "mo",
            features: ["8 Dedicated vCPU", "32 GB RAM", "500 GB NVMe", "Dedicated bandwidth", "KVM hypervisor", "24/7 support"],
            href: "/hosting/vps",
          },
          {
            id: "vds-m",
            name: "VDS Business",
            tagline: "Enterprise performance on demand",
            from: 15000,
            period: "mo",
            badge: "RECOMMENDED",
            recommended: true,
            features: ["16 Dedicated vCPU", "64 GB RAM", "1 TB NVMe", "10 Gbps uplink", "Snapshots + backups", "SLA 99.95%"],
            href: "/hosting/vps",
          },
          {
            id: "vds-l",
            name: "VDS Enterprise",
            tagline: "Maximum headroom for scale",
            from: 28000,
            period: "mo",
            highlight: "Near bare-metal speed",
            features: ["32 Dedicated vCPU", "128 GB RAM", "2 TB NVMe RAID", "10 Gbps dedicated", "DDoS + WAF", "Custom OS image"],
            href: "/hosting/vps",
          },
        ],
      },
      {
        id: "dedicated",
        label: "Dedicated",
        icon: Building2,
        description: "Bare-metal dedicated servers - 100% resources, zero noisy neighbours.",
        plans: [
          {
            id: "ded-entry",
            name: "Dedicated Starter",
            tagline: "Your own physical server",
            from: 35000,
            period: "mo",
            features: ["Intel Xeon 8-core", "32 GB ECC RAM", "2× 480 GB SSD", "Unmetered bandwidth", "IPMI access", "Hardware monitoring"],
            href: "/hosting/vps",
          },
          {
            id: "ded-biz",
            name: "Dedicated Business",
            tagline: "For enterprise & SaaS platforms",
            from: 65000,
            period: "mo",
            badge: "ENTERPRISE PICK",
            recommended: true,
            features: ["Intel Xeon 16-core", "128 GB ECC RAM", "4× 960 GB NVMe", "10 Gbps uplink", "DDoS mitigation", "Fully managed option"],
            href: "/hosting/vps",
          },
          {
            id: "ded-custom",
            name: "Custom Build",
            tagline: "Spec your own server",
            from: 100000,
            period: "mo",
            highlight: "Tailored to your workload",
            features: ["Dual-socket CPU options", "Up to 1.5 TB RAM", "Custom storage array", "Private VLAN", "Colocation available", "24/7 NOC support"],
            href: "/contact",
          },
        ],
      },
    ],
  },

  // ── DOMAINS ────────────────────────────────────────────────────────────────
  {
    id: "domains",
    label: "Domains",
    icon: Globe,
    subCategories: [
      {
        id: "kenyan",
        label: "Kenyan TLDs",
        icon: Globe,
        description: "Register a .co.ke or .ke domain - Kenya's most trusted extensions.",
        plans: [
          {
            id: "coke",
            name: ".co.ke",
            tagline: "Kenya's most popular extension",
            from: 999,
            period: "yr",
            badge: "MOST POPULAR",
            recommended: true,
            features: ["Kenyan identity", "Free DNS management", "WHOIS privacy", "Auto-renewal", "Easy transfers", "24/7 support"],
            href: "/hosting/domains",
          },
          {
            id: "ke",
            name: ".ke",
            tagline: "Premium short Kenyan domain",
            from: 2500,
            period: "yr",
            highlight: "Premium Kenya TLD",
            features: [".ke premium extension", "DNS management", "WHOIS privacy", "Auto-renewal", "Secure transfer", "Priority support"],
            href: "/hosting/domains",
          },
        ],
      },
      {
        id: "global",
        label: "Global TLDs",
        icon: Wifi,
        description: "Global domain extensions for businesses with worldwide reach.",
        plans: [
          {
            id: "com",
            name: ".com",
            tagline: "The world's most recognised domain",
            from: 1200,
            period: "yr",
            features: ["Worldwide credibility", "Free DNS management", "WHOIS privacy", "Auto-renewal", "Easy transfers", "SLA-backed"],
            href: "/hosting/domains",
          },
          {
            id: "net",
            name: ".net / .org",
            tagline: "Trusted alternatives to .com",
            from: 1100,
            period: "yr",
            badge: "POPULAR",
            recommended: true,
            features: [".net and .org available", "DNS management", "WHOIS privacy", "Auto-renewal", "Bulk registration", "Priority support"],
            href: "/hosting/domains",
          },
          {
            id: "other",
            name: "50+ Extensions",
            tagline: ".io, .africa, .shop & more",
            from: 1400,
            period: "yr",
            highlight: "50+ TLD options",
            features: [".io, .africa, .shop, .tech", ".store, .online, .site", "DNS management", "Privacy protection", "Auto-renewal", "Bulk registration"],
            href: "/hosting/domains",
          },
        ],
      },
    ],
  },

  // ── EMAIL ─────────────────────────────────────────────────────────────────
  {
    id: "email",
    label: "Email",
    icon: Mail,
    subCategories: [
      {
        id: "business-email",
        label: "Business Email",
        icon: Mail,
        description: "Professional yourname@yourdomain.com - fast, secure, and ad-free.",
        plans: [
          {
            id: "email-starter",
            name: "Email Starter",
            tagline: "Your name@yourdomain.com",
            from: 250,
            period: "mo",
            features: ["10 GB mailbox", "Spam & virus filtering", "Webmail access", "IMAP / POP3 / SMTP", "Mobile sync", "Free setup"],
            href: "/hosting/email",
          },
          {
            id: "email-pro",
            name: "Email Pro",
            tagline: "Teams up to 25 users",
            from: 600,
            period: "mo",
            badge: "POPULAR",
            recommended: true,
            features: ["25 GB mailbox per user", "Shared calendar & contacts", "Alias addresses", "Admin control panel", "Archiving & audit logs", "SLA 99.9%"],
            href: "/hosting/email",
          },
        ],
      },
      {
        id: "microsoft",
        label: "Microsoft 365",
        icon: Package,
        description: "Microsoft-powered email + full productivity suite - Exchange, Teams, OneDrive.",
        plans: [
          {
            id: "m365-ess",
            name: "M365 Essentials",
            tagline: "Business email + productivity apps",
            from: 600,
            period: "mo",
            badge: "RECOMMENDED",
            recommended: true,
            features: ["50 GB Exchange mailbox", "Microsoft Teams", "SharePoint + 1 TB OneDrive", "Outlook web + desktop", "Malware protection", "24/7 support"],
            href: "/hosting/email",
          },
          {
            id: "m365-biz",
            name: "M365 Business",
            tagline: "Full Office suite + email + security",
            from: 1200,
            period: "mo",
            highlight: "Includes Word, Excel, PowerPoint",
            features: ["50 GB mailbox + Teams", "Word, Excel, PowerPoint", "Advanced security & compliance", "Intune device management", "1 TB OneDrive", "Priority support"],
            href: "/hosting/email",
          },
        ],
      },
    ],
  },

  // ── SECURITY ──────────────────────────────────────────────────────────────
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    subCategories: [
      {
        id: "ssl",
        label: "SSL Certificates",
        icon: ShieldCheck,
        description: "Encrypt your website and build visitor trust with industry-standard SSL certificates.",
        plans: [
          {
            id: "ssl-dv",
            name: "DV SSL",
            tagline: "Domain validation - instant issuance",
            from: 999,
            period: "yr",
            features: ["Domain validation", "256-bit encryption", "Free reissues", "HTTPS padlock", "99.9% browser trust", "24/7 support"],
            href: "/security",
          },
          {
            id: "ssl-ov",
            name: "OV SSL",
            tagline: "Organisation validation",
            from: 3500,
            period: "yr",
            badge: "RECOMMENDED",
            recommended: true,
            features: ["Organisation validation", "Business identity verified", "256-bit encryption", "Trust site seal", "Free reissues", "Priority support"],
            href: "/security",
          },
          {
            id: "ssl-ev",
            name: "EV SSL",
            tagline: "Highest trust - e-commerce & fintech",
            from: 8000,
            period: "yr",
            highlight: "Green bar / verified company",
            features: ["Extended validation", "Company name in browser", "256-bit encryption", "PCI-DSS compatible", "Trust site seal", "Priority support"],
            href: "/security",
          },
        ],
      },
      {
        id: "web-security",
        label: "Web Security",
        icon: ShieldCheck,
        description: "All-in-one malware scanning, cleanup, firewall and CDN - protect your site 24/7.",
        plans: [
          {
            id: "ws-standard",
            name: "Security Standard",
            tagline: "SSL + malware scan + cleanup",
            from: 2500,
            period: "mo",
            features: ["SSL certificate included", "Daily malware scanning", "1× annual site cleanup", "Blacklist monitoring", "SEO spam monitoring", "Firewall protection"],
            href: "/security",
          },
          {
            id: "ws-premium",
            name: "Security Premium",
            tagline: "Full protection + unlimited cleanups",
            from: 5500,
            period: "mo",
            badge: "MOST COMPREHENSIVE",
            recommended: true,
            features: ["Everything in Standard", "Unlimited site cleanups", "DDoS protection", "CDN acceleration (5×)", "25 GB daily backups", "SLA response guarantee"],
            href: "/security",
          },
        ],
      },
    ],
  },

  // ── MARKETING ─────────────────────────────────────────────────────────────
  {
    id: "marketing",
    label: "Marketing",
    icon: TrendingUp,
    subCategories: [
      {
        id: "seo-service",
        label: "SEO / AEO",
        icon: TrendingUp,
        description: "Rank #1 on Google and AI search - strategy, implementation, and monthly reporting.",
        plans: [
          {
            id: "seo-starter",
            name: "SEO Starter",
            tagline: "Local visibility for small businesses",
            from: 15000,
            period: "mo",
            features: ["10 target keywords", "On-page optimisation", "Google My Business", "Monthly rank report", "Technical SEO audit", "Dedicated specialist"],
            href: "/services/seo",
          },
          {
            id: "seo-growth",
            name: "SEO Growth",
            tagline: "Aggressive growth + AEO + GEO",
            from: 25000,
            period: "mo",
            badge: "RECOMMENDED",
            recommended: true,
            features: ["30 target keywords", "AEO (AI search visibility)", "GEO (Maps + local SEO)", "Content strategy", "Backlink outreach", "Bi-weekly reports"],
            href: "/services/seo",
          },
          {
            id: "seo-enterprise",
            name: "SEO Enterprise",
            tagline: "Full-scale SEO for big brands",
            from: 60000,
            period: "mo",
            highlight: "Unlimited keywords",
            features: ["Unlimited keywords", "Technical + content + links", "International SEO", "Competitor gap analysis", "Weekly reporting", "Dedicated team"],
            href: "/services/seo",
          },
        ],
      },
      {
        id: "social-ads",
        label: "Social & Ads",
        icon: Users,
        description: "Social media management and paid advertising across Meta, Google and TikTok.",
        plans: [
          {
            id: "social",
            name: "Social Media",
            tagline: "Content, scheduling & community",
            from: 20000,
            period: "mo",
            features: ["3 social platforms", "12 posts/month", "Community management", "Branded graphics", "Monthly analytics", "Hashtag strategy"],
            href: "/services/social-media",
          },
          {
            id: "ads",
            name: "Paid Advertising",
            tagline: "Google, Meta & TikTok campaigns",
            from: 6000,
            period: "mo",
            badge: "POPULAR",
            recommended: true,
            highlight: "Management fee + 11% of ad spend",
            features: ["Google Search & Display", "Meta (Facebook + Instagram)", "TikTok ads", "Campaign creative", "Weekly reports", "A/B testing"],
            href: "/services/paid-ads",
          },
        ],
      },
      {
        id: "automation",
        label: "AI & Automation",
        icon: Bot,
        description: "AI chatbots, lead automation, email sequences, and CRM integrations.",
        plans: [
          {
            id: "ai-basic",
            name: "AI Starter",
            tagline: "Chatbot + lead capture",
            from: 15000,
            period: "mo",
            features: ["AI chatbot (website)", "Lead capture forms", "Email sequence (5 steps)", "CRM integration", "Monthly automation report", "Setup included"],
            href: "/services/ai-automation",
          },
          {
            id: "ai-pro",
            name: "AI Pro",
            tagline: "Full AI-powered sales funnel",
            from: 35000,
            period: "mo",
            badge: "RECOMMENDED",
            recommended: true,
            features: ["Advanced AI chatbot", "WhatsApp & SMS automation", "Full CRM pipeline", "Lead scoring & nurturing", "Abandoned cart recovery", "Analytics dashboard"],
            href: "/services/ai-automation",
          },
        ],
      },
    ],
  },

  // ── CLOUD PLANS ────────────────────────────────────────────────────────────
  {
    id: "cloud",
    label: "Cloud Plans",
    icon: Cpu,
    subCategories: [
      {
        id: "bundles",
        label: "All-in-One Bundles",
        icon: Cpu,
        description: "Brand + hosting + marketing bundled - designed for Kenyan businesses that want everything managed for them.",
        plans: [
          {
            id: "launchpad",
            name: "Launchpad",
            tagline: "For startups & new businesses",
            from: 25000,
            period: "mo",
            features: ["Brand identity (logo + guidelines)", "Custom website (5 pages)", "Managed cloud hosting", "Free SSL + CDN", "Basic SEO setup", "Monthly report"],
            href: "/contact",
          },
          {
            id: "orbit",
            name: "Orbit",
            tagline: "Brand + hosting + marketing",
            from: 65000,
            period: "mo",
            badge: "MOST POPULAR",
            recommended: true,
            features: ["Everything in Launchpad", "10-page website", "SEO + content strategy", "Google & Meta campaigns", "Social media (3 platforms)", "Email marketing + CRM"],
            href: "/contact",
          },
          {
            id: "galaxy",
            name: "Galaxy",
            tagline: "Enterprise-grade full-service",
            from: 150000,
            period: "mo",
            highlight: "Best for scaling brands",
            features: ["Everything in Orbit", "Unlimited pages & revisions", "All social platforms", "AI chatbot + lead automation", "Analytics dashboard", "Dedicated account manager"],
            href: "/contact",
          },
        ],
      },
    ],
  },
];

// ── Plan Card ──────────────────────────────────────────────────────────────────

function PlanCard({ plan, delay }: { plan: Plan; delay: number }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card overflow-hidden",
        plan.recommended
          ? "border-primary shadow-xl shadow-primary/10 ring-1 ring-primary/20"
          : "border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-200"
      )}
    >
      {plan.recommended && (
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-bold text-center py-2 tracking-widest uppercase flex items-center justify-center gap-1.5">
          <Star size={10} className="fill-primary-foreground" />
          {plan.badge ?? "Recommended"}
        </div>
      )}
      {!plan.recommended && plan.badge && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold uppercase">{plan.badge}</Badge>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-bold text-base mb-0.5">{plan.name}</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-snug">{plan.tagline}</p>

        {plan.highlight && (
          <div className="text-[11px] font-semibold text-primary bg-primary/8 border border-primary/15 rounded-lg px-3 py-1.5 mb-4">
            {plan.highlight}
          </div>
        )}

        <div className="mb-5">
          <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mb-1">As Low As</p>
          <div className="flex items-end gap-1">
            <span className="text-3xl font-extrabold text-primary leading-none">
              KES {plan.from.toLocaleString()}
            </span>
            <span className="text-muted-foreground text-sm mb-0.5">/{plan.period}</span>
          </div>
        </div>

        <ul className="space-y-2 flex-1 mb-6">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check size={13} className="text-primary shrink-0 mt-0.5" />
              <span className="text-muted-foreground leading-snug">{f}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={() => navigate(plan.href)}
          className={cn(
            "w-full font-semibold rounded-xl cursor-pointer h-10 gap-1.5",
            plan.recommended
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
          )}
        >
          Get Started <ArrowRight size={14} />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PricingPlans() {
  const [activeCategory, setActiveCategory] = useState("hosting");
  const [activeSub, setActiveSub] = useState("shared");

  const currentCategory = categories.find((c) => c.id === activeCategory) ?? categories[0];

  // When switching top-level category, default to first sub
  function handleCategoryChange(catId: string) {
    setActiveCategory(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) setActiveSub(cat.subCategories[0].id);
  }

  const currentSub =
    currentCategory.subCategories.find((s) => s.id === activeSub) ??
    currentCategory.subCategories[0];

  return (
    <section className="pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* ── Top-level category tabs ─────────────────────────────────────── */}
        <div
          className="flex overflow-x-auto gap-0 border-b border-border/60 scrollbar-thin mb-0"
          role="tablist"
          aria-label="Service categories"
        >
          {categories.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-all relative shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <cat.icon size={15} />
                {cat.label}
                {isActive && (
                  <motion.div
                    layoutId="pricing-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Sub-category pills ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory + "-subs"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentCategory.subCategories.length > 1 && (
              <div className="flex flex-wrap gap-2 py-5 border-b border-border/40">
                {currentCategory.subCategories.map((sub) => {
                  const isSubActive = sub.id === currentSub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSub(sub.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                        isSubActive
                          ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                          : "bg-muted/50 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <sub.icon size={12} />
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Plans for selected sub-category ────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSub}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="pt-8"
          >
            {/* Sub description */}
            <p className="text-muted-foreground text-base mb-8 max-w-3xl">{currentSub.description}</p>

            {/* Plan cards */}
            <div
              className={cn(
                "grid gap-5",
                currentSub.plans.length === 2
                  ? "sm:grid-cols-2 max-w-3xl"
                  : currentSub.plans.length === 3
                  ? "md:grid-cols-3"
                  : "sm:grid-cols-2 lg:grid-cols-4"
              )}
            >
              {currentSub.plans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} delay={i * 0.07} />
              ))}
            </div>

            {/* Footer bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-muted/50 to-primary/5 border border-border/50 rounded-2xl px-6 py-4"
            >
              <p className="text-sm text-muted-foreground">
                All plans include onboarding support. M-Pesa, Visa &amp; Mastercard accepted.
              </p>
              <p className="text-xs text-primary font-semibold whitespace-nowrap">
                30-day money-back guarantee
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
