import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe,
  Server,
  Mail,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Layers,
  Zap,
  Database,
  HardDrive,
  Building2,
  Palette,
  MonitorSmartphone,
  ShoppingCart,
  Users,
  Megaphone,
  Bot,
  Search,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { SharedPricingSection } from "@/pages/hosting/shared/_components/SharedPricingSection.tsx";
import { WordPressPricingSection } from "@/pages/hosting/wordpress/_components/WordPressPricingSection.tsx";
import { VpsPlansSection } from "@/pages/hosting/vps/_components/VpsPlansSection.tsx";
import { VdsPlansSection } from "@/pages/hosting/vds/_components/VdsPlansSection.tsx";
import { DedicatedPlansSection } from "@/pages/hosting/dedicated-servers/_components/DedicatedPlansSection.tsx";
import DomainSearch from "@/pages/_components/DomainSearch.tsx";
import { EmailPricingSection } from "@/pages/hosting/email/_components/EmailPricingSection.tsx";
import SecurityPlans from "@/pages/security/_components/SecurityPlans.tsx";
import { SeoPricingSection } from "@/pages/services/seo/_components/SeoPricingSection.tsx";
import { EmailMarketingPricingSection } from "@/pages/services/email-marketing/_components/EmailMarketingPricingSection.tsx";
import {
  BrandIdentityPricing,
  WebsiteDesignPricing,
  EcommercePricing,
  SocialMediaPricing,
  PaidAdsPricing,
  ZeepoAiPricing,
  CloudBundlesPricing,
} from "./MarketingPricingSections.tsx";

type SubCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  component: React.ComponentType;
};

type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
  subCategories: SubCategory[];
};

const categories: Category[] = [
  {
    id: "hosting",
    label: "Cloud Hosting",
    icon: Server,
    subCategories: [
      {
        id: "shared",
        label: "Web Hosting",
        icon: Layers,
        description: "NVMe-powered shared hosting  the fastest way to launch your website in Kenya.",
        component: SharedPricingSection,
      },
      {
        id: "wordpress",
        label: "WordPress",
        icon: Zap,
        description: "Optimised WordPress hosting  pre-configured for speed, security, and easy management.",
        component: WordPressPricingSection,
      },
      {
        id: "vps",
        label: "VPS",
        icon: Database,
        description: "Virtual Private Servers  dedicated vCPUs, guaranteed RAM, full root access.",
        component: VpsPlansSection,
      },
      {
        id: "vds",
        label: "VDS",
        icon: HardDrive,
        description: "Virtual Dedicated Servers  bare-metal performance with the flexibility of virtualisation.",
        component: VdsPlansSection,
      },
      {
        id: "dedicated",
        label: "Dedicated",
        icon: Building2,
        description: "Bare-metal dedicated servers  100% resources, zero noisy neighbours.",
        component: DedicatedPlansSection,
      },
    ],
  },
  {
    id: "domains",
    label: "Domains",
    icon: Globe,
    subCategories: [
      {
        id: "domains",
        label: "Domain Registration",
        icon: Globe,
        description: "Search availability across .co.ke, .com, and 200+ extensions.",
        component: DomainSearch,
      },
    ],
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    subCategories: [
      {
        id: "email",
        label: "Business Email",
        icon: Mail,
        description: "Professional yourname@yourdomain.com  fast, secure, and ad-free.",
        component: EmailPricingSection,
      },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    subCategories: [
      {
        id: "web-security",
        label: "Web Security",
        icon: ShieldCheck,
        description: "All-in-one malware scanning, cleanup, firewall and CDN  protect your site 24/7.",
        component: SecurityPlans,
      },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: TrendingUp,
    subCategories: [
      {
        id: "seo",
        label: "SEO / AEO",
        icon: Search,
        description: "Rank on Google and AI search  strategy, implementation, and monthly reporting.",
        component: SeoPricingSection,
      },
      {
        id: "email-marketing",
        label: "Email Marketing",
        icon: Send,
        description: "Professional email design, automation flows, and campaign analytics  managed for you.",
        component: EmailMarketingPricingSection,
      },
      {
        id: "social-media",
        label: "Social Media",
        icon: Users,
        description: "Social media management  content, scheduling, and community engagement.",
        component: SocialMediaPricing,
      },
      {
        id: "paid-ads",
        label: "Paid Advertising",
        icon: Megaphone,
        description: "Google, Meta, and TikTok campaigns managed for maximum ROI.",
        component: PaidAdsPricing,
      },
      {
        id: "brand-identity",
        label: "Brand Identity",
        icon: Palette,
        description: "Logo design, brand guidelines, and visual identity systems.",
        component: BrandIdentityPricing,
      },
      {
        id: "website-design",
        label: "Website Design",
        icon: MonitorSmartphone,
        description: "Custom website design and development  mobile-first and SEO-ready.",
        component: WebsiteDesignPricing,
      },
      {
        id: "ecommerce",
        label: "E-commerce",
        icon: ShoppingCart,
        description: "Online stores with M-Pesa, card payments, and order management.",
        component: EcommercePricing,
      },
      {
        id: "zeepo-ai",
        label: "AI & Automation",
        icon: Bot,
        description: "AI chatbots, lead automation, email sequences, and CRM integrations.",
        component: ZeepoAiPricing,
      },
    ],
  },
  {
    id: "cloud",
    label: "Cloud Plans",
    icon: Cpu,
    subCategories: [
      {
        id: "bundles",
        label: "All-in-One Bundles",
        icon: Cpu,
        description: "Brand, hosting, and marketing bundled  designed for Kenyan businesses that want everything managed.",
        component: CloudBundlesPricing,
      },
    ],
  },
];

export default function PricingPlans() {
  const [activeCategory, setActiveCategory] = useState("hosting");
  const [activeSub, setActiveSub] = useState("shared");

  const currentCategory = categories.find((c) => c.id === activeCategory) ?? categories[0];

  function handleCategoryChange(catId: string) {
    setActiveCategory(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) setActiveSub(cat.subCategories[0].id);
  }

  const currentSub =
    currentCategory.subCategories.find((s) => s.id === activeSub) ??
    currentCategory.subCategories[0];

  const ActiveSection = currentSub.component;

  return (
    <section className="pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Top-level category tabs */}
        <div
          className="mb-0 flex gap-0 overflow-x-auto border-b border-border/60 scrollbar-thin"
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
                  "relative flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap px-5 py-3.5 text-sm font-semibold transition-all",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <cat.icon size={15} />
                {cat.label}
                {isActive && (
                  <motion.div
                    layoutId="pricing-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-category pills */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-subs`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {currentCategory.subCategories.length > 1 && (
              <div className="flex flex-wrap gap-2 border-b border-border/40 py-5">
                {currentCategory.subCategories.map((sub) => {
                  const isSubActive = sub.id === currentSub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSub(sub.id)}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                        isSubActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "border-border/50 bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
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

        {/* Active pricing section from the respective service page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSub}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            <p className="max-w-3xl pt-8 text-base text-muted-foreground">{currentSub.description}</p>

            <div className="pt-2">
              <ActiveSection />
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
