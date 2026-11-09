import { useId } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { trackEvent } from "@/lib/track.ts";
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
import { LicencePlansSection } from "@/pages/_components/LicencePlansSection.tsx";
import { AgencyPlans } from "@/pages/hosting/agency/_components/AgencyPlans.tsx";
import {
  BrandIdentityPricing,
  WebsiteDesignPricing,
  EcommercePricing,
  SocialMediaPricing,
  PaidAdsPricing,
  ZepoAiPricing,
  SslPlanSummary,
  EnquiryPanel,
  AgencyServicesPanel,
} from "./MarketingPricingSections.tsx";

type Product = {
  id: string;
  label: string;
  /** Sub-heading shown above the first item of a run inside a group. */
  section?: string;
  description: string;
  href: string;
  component: React.ComponentType;
};

type Group = { id: string; label: string; products: Product[] };

const groups: Group[] = [
  {
    id: "cloud",
    label: "Cloud Products",
    products: [
      {
        id: "domains",
        label: "Domains",
        description: "Search .ke, .co.ke, .com and other extensions. Availability and first-year prices are checked live.",
        href: "/hosting/domains",
        component: DomainSearch,
      },
      {
        id: "web-hosting",
        label: "Web Hosting",
        description: "Shared hosting to get your website online, with a 99.9% uptime target and 24/7 support.",
        href: "/hosting/shared",
        component: SharedPricingSection,
      },
      {
        id: "wordpress",
        label: "WordPress Hosting",
        description: "WordPress hosting set up for speed, security and easy management.",
        href: "/hosting/wordpress",
        component: WordPressPricingSection,
      },
      {
        id: "email",
        label: "Business Email",
        description: "Professional email on your own domain, managed from nPanel.",
        href: "/hosting/email",
        component: EmailPricingSection,
      },
      {
        id: "vps",
        label: "VPS",
        description: "Virtual private servers with dedicated vCPUs, reserved RAM and full root access.",
        href: "/hosting/vps",
        component: VpsPlansSection,
      },
      {
        id: "vds",
        label: "VDS",
        description: "Virtual dedicated servers with dedicated resources and flexible virtualisation.",
        href: "/hosting/vds",
        component: VdsPlansSection,
      },
      {
        id: "dedicated",
        label: "Dedicated Servers",
        description: "Bare-metal servers with the full machine reserved for your workloads.",
        href: "/hosting/dedicated-servers",
        component: DedicatedPlansSection,
      },
      {
        id: "ssl",
        label: "SSL Certificates",
        description: "Domain, organisation and extended validation certificates, with installation included.",
        href: "/hosting/ssl",
        component: SslPlanSummary,
      },
      {
        id: "security",
        label: "Website Security",
        description: "Malware scanning, cleanup, firewall and monitoring for your website.",
        href: "/security",
        component: SecurityPlans,
      },
    ],
  },
  {
    id: "productivity",
    label: "Productivity",
    products: [
      {
        id: "microsoft-365",
        label: "Microsoft 365",
        description: "Microsoft's published list prices per user, with a KES quote for your team.",
        href: "/hosting/microsoft-365",
        component: () => <LicencePlansSection kind="microsoft-365" />,
      },
      {
        id: "google-workspace",
        label: "Google Workspace",
        description: "Google's published list prices per user, with a KES quote for your team.",
        href: "/hosting/google-workspace",
        component: () => <LicencePlansSection kind="google-workspace" />,
      },
      {
        id: "hybrid-email",
        label: "Enterprise Hybrid Email",
        description: "Run Microsoft 365 or Google Workspace alongside Nisc Mail on one corporate domain.",
        href: "/hosting/hybrid-email",
        component: () => (
          <EnquiryPanel
            title="Priced from your licence mix"
            body="We review which users need a full productivity suite and which need professional email only, then quote an annual arrangement with migration and mail routing included in the scope."
            points={["Annual quotation in KES", "Licence mix reviewed with you", "Migration and routing planned before changes"]}
            serviceName="Enterprise Hybrid Email"
            cta="Get an annual quotation"
          />
        ),
      },
    ],
  },
  {
    id: "solutions",
    label: "Business Solutions",
    products: [
      {
        id: "website-design",
        label: "Website Development",
        description: "Custom website design and development. Mobile-first and SEO-ready.",
        href: "/services/website-design",
        component: WebsiteDesignPricing,
      },
      {
        id: "ecommerce",
        label: "Ecommerce",
        description: "Online stores with payments, inventory and order management.",
        href: "/services/ecommerce",
        component: EcommercePricing,
      },
      {
        id: "custom-software",
        label: "Custom Software",
        description: "Business applications, portals and integrations built around the way you work.",
        href: "/contact?serviceName=Custom%20Software",
        component: () => (
          <EnquiryPanel
            title="Scoped and quoted per project"
            body="Tell us what the software needs to do, who will use it and which systems it connects to. We confirm scope, timeline and a fixed quotation before work starts."
            points={["Discovery call to define scope", "Fixed quotation before you commit", "Hosting on Nisc Cloud infrastructure"]}
            serviceName="Custom Software"
            cta="Request a proposal"
          />
        ),
      },
      {
        id: "seo",
        label: "SEO / AEO",
        section: "Digital marketing",
        description: "Get found on Google and AI search with strategy, implementation and monthly reporting.",
        href: "/services/seo",
        component: SeoPricingSection,
      },
      {
        id: "email-marketing",
        label: "Email Marketing",
        section: "Digital marketing",
        description: "Email design, automation flows and campaign analytics, managed for you.",
        href: "/services/email-marketing",
        component: EmailMarketingPricingSection,
      },
      {
        id: "social-media",
        label: "Social Media",
        section: "Digital marketing",
        description: "Social media management with content, scheduling and community engagement.",
        href: "/services/social-media",
        component: SocialMediaPricing,
      },
      {
        id: "paid-ads",
        label: "Paid Advertising",
        section: "Digital marketing",
        description: "Google, Meta and TikTok campaigns, with ad spend billed directly by each platform.",
        href: "/services/paid-ads",
        component: PaidAdsPricing,
      },
      {
        id: "brand-identity",
        label: "Branding & Creative",
        description: "Logo design, brand guidelines and visual identity systems.",
        href: "/services/brand-identity",
        component: BrandIdentityPricing,
      },
      {
        id: "zepo-ai",
        label: "AI & Automation",
        description: "Zepo AI chat assistants, lead capture and follow-up automation.",
        href: "/services/zeepo-ai",
        component: ZepoAiPricing,
      },
    ],
  },
  {
    id: "agencies",
    label: "Agencies",
    products: [
      {
        id: "agency-hosting",
        label: "Agency Hosting",
        description: "Hosting for the client websites you manage, proposed around your portfolio.",
        href: "/hosting/agency",
        component: AgencyPlans,
      },
      {
        id: "agency-services",
        label: "Agency Services",
        description: "Products agencies most often resell or manage for their clients.",
        href: "/hosting/agency",
        component: AgencyServicesPanel,
      },
    ],
  },
];

const allProducts = groups.flatMap((g) => g.products.map((p) => ({ ...p, group: g })));
const DEFAULT_PRODUCT = "web-hosting";

export default function PricingPlans() {
  const [params, setParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const selectId = useId();
  const requested = params.get("product");
  const current = allProducts.find((p) => p.id === requested) ?? allProducts.find((p) => p.id === DEFAULT_PRODUCT)!;
  const ActiveSection = current.component;

  function choose(id: string) {
    if (id === current.id) return;
    const next = new URLSearchParams(params);
    next.set("product", id);
    setParams(next, { replace: true, preventScrollReset: true });
    trackEvent("pricing_category_select", { product: id });
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("pricing-panel")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }
  }

  return (
    <section className="pb-24" aria-label="Pricing by product">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Mobile and tablet: a native grouped select keeps every product one tap away without squeezing the cards. */}
        <div className="lg:hidden">
          <label htmlFor={selectId} className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Choose a product
          </label>
          <div className="relative">
            <select
              id={selectId}
              value={current.id}
              onChange={(event) => choose(event.target.value)}
              className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-border bg-card pl-4 pr-10 text-[15px] font-semibold text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {groups.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <nav aria-label="Pricing categories" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-6 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-3 [scrollbar-width:thin]">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="px-3 pb-1.5 pt-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {group.products.map((product, index) => {
                    const active = product.id === current.id;
                    const showSection = product.section && product.section !== group.products[index - 1]?.section;
                    return (
                      <li key={product.id}>
                        {showSection && (
                          <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold text-muted-foreground/80">{product.section}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => choose(product.id)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex w-full cursor-pointer items-center rounded-lg py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                            product.section ? "pl-5 pr-3" : "px-3",
                            active
                              ? "bg-primary/10 font-semibold text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          {active && <span aria-hidden className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary" />}
                          {product.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div id="pricing-panel" className="min-w-0 scroll-mt-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="flex flex-col gap-3 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{current.group.label}</p>
                  <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{current.label}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">{current.description}</p>
                </div>
                <Link
                  to={current.href}
                  className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {current.href.startsWith("/contact") ? "Talk to our team" : "Full product details"}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
              <div className="pt-2">
                <ActiveSection />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
