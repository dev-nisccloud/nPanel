import { ServiceExperience } from "@/pages/_components/ServiceExperience";
import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import {
  Globe,
  Zap,
  Shield,
  Code2,
  RefreshCw,
  BarChart2,
  Lock,
  Headphones,
} from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { WordPressPricingSection } from "./_components/WordPressPricingSection.tsx";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "WordPress Performance",
 artwork: <ServiceExperience mode="wordpress" photo />,
    headline: "A hosting environment selected for WordPress.",
    body: "Current plans combine WordPress-aware configuration and caching options. Check the live plan details for included software versions, tools and resource limits.",
    bullets: [
      "WordPress-aware setup on eligible plans",
      "Current runtime details shown with the plan",
      "Caching and delivery options by plan",
    ],
    mockupRight: true,
    visual: "wpPerf",
  },
  {
    tag: "Staging and Safety",
 artwork: <ServiceExperience mode="wordpress" />,
    headline: "Test changes before they go live.",
    body: "Where included, staging gives you a separate place to review plugin updates, redesigns and new features before applying them to production. Check the selected plan for workflow and retention details.",
    bullets: [
      "Staging availability shown on the selected plan",
      "A safer review path for eligible updates",
      "Backup and restore terms defined by plan",
    ],
    mockupRight: false,
    visual: "wpStaging",
  },
];

export default function WordPressHostingPage() {
  return (
    <ServicePageShell
      badge="Managed WordPress Hosting"
      headline={
        <>
          Managed WordPress Hosting That Is{" "}
          <span className="text-primary">Fast, Secure and Managed</span>
        </>
      }
      subtext="Choose managed WordPress hosting for a simpler operating path across setup, updates, backups and support."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<WordPressPricingSection />}
      heroImage={niscWebsiteImage("wordpress hosting.png")}
      heroImageStandalone
      heroTrustBadge={{
        line1: "WordPress-aware hosting",
        line2: "Scoped migration and support options",
      }}
      trustStats={[
        { value: "Scoped", label: "Migration Assistance" },
        { value: "99.9%", label: "Uptime Target" },
        { value: "Plan", label: "Managed Features" },
        { value: "Listed", label: "Backup Schedule" },
      ]}
      features={[
        {
          icon: <Globe size={20} />,
          title: "WordPress-Optimised Stack",
          desc: "Review the selected plan for its current PHP, database, caching and web-server configuration before checking plugin or theme requirements.",
        },
        {
          icon: <Zap size={20} />,
          title: "Built-In WP Caching",
          desc: "Eligible plans include WordPress caching options that can reduce repeated processing when configured for the site.",
        },
        {
          icon: <Shield size={20} />,
          title: "WordPress Firewall and Malware Scanning",
          desc: "Available protection can help filter common web attacks and scan for suspicious content. Included controls vary by plan and do not replace secure site maintenance.",
        },
        {
          icon: <Code2 size={20} />,
          title: "One-Click Staging Environment",
          desc: "Where the plan includes staging, test plugin updates, theme changes and new features away from the live site before a planned release.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Automatic WordPress Updates",
          desc: "Update handling depends on the selected plan and management scope. Confirm which core, theme and plugin updates are automated or reviewed.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Performance Dashboard",
          desc: "Review the service and resource information available for your plan, then add application monitoring where your site requires it.",
        },
        {
          icon: <Lock size={20} />,
          title: "Free SSL and HTTP/2",
          desc: "Check the live plan for included TLS certificate and protocol support, plus any activation requirements for your domain.",
        },
        {
          icon: <Headphones size={20} />,
          title: "WordPress Expert Support",
          desc: "WordPress-aware assistance is available within the support scope of the selected plan; custom-code and third-party remediation may need separate work.",
        },
      ]}
      plans={[]}
      addons={[
        {
          id: "wp-addon-woocommerce",
          label: "WooCommerce Performance Pack",
          price: 500,
          period: "mo",
        },
        {
          id: "wp-addon-backup-premium",
          label: "Premium Backups (6-month retention)",
          price: 350,
          period: "mo",
        },
        {
          id: "wp-addon-cdn",
          label: "Global CDN (50+ edge locations)",
          price: 400,
          period: "mo",
        },
      ]}
      process={[
        {
          num: "01",
          title: "Pick Your Plan",
          desc: "Choose based on how many sites you need. WP Business suits most growing sites and includes staging and malware scanning.",
        },
        {
          num: "02",
          title: "Prepare WordPress",
          desc: "Set up a clean installation with the domain, certificate and caching options included in the selected plan.",
        },
        {
          num: "03",
          title: "Scope an Existing-Site Move",
          desc: "If you are moving a site, confirm its size, dependencies, access and cutover plan. Included migration help is limited to the scope agreed before work starts.",
        },
        {
          num: "04",
          title: "Optimise and Launch",
          desc: "We run a performance check, configure caching, and help you launch with a site that feels fast for your visitors.",
        },
      ]}
      whyPoints={[
        {
          title: "Managed So You Don't Have To", visual: "deploy",
          desc: "Confirm which updates, backups and security tasks the chosen plan handles, so your team knows what remains its responsibility.",
        },
        {
          title: "WooCommerce Ready Out of the Box", visual: "payment",
          desc: "Sell products online with WooCommerce on infrastructure tuned for e-commerce stores and busy checkouts.",
        },
        {
          title: "Fast for Your Visitors", visual: "speed",
          desc: "Caching and a WordPress-tuned stack keep pages responsive for visitors wherever they are.",
        },
        {
          title: "Planned Migration Assistance", visual: "migration",
          desc: "Eligible moves are scoped for access, backups, testing and cutover first. Extra remediation is quoted before it begins.",
        },
        {
          title: "Real WordPress Help on Support", visual: "support",
          desc: "When something breaks, you reach people who know WordPress. Problems get solved, not bounced around.",
        },
        {
          title: "Room to Grow With Traffic", visual: "growth",
          desc: "Compare plan limits and move to a larger profile as measured traffic, storage and processing needs increase.",
        },
      ]}
      faqs={[
        {
          q: "Can you migrate my existing WordPress site?",
          a: "Migration assistance may be included within a scope agreed before the move. We review access, files, database, plugins, themes and cutover needs first; timing depends on site size, compatibility and access. Existing faults or extra remediation are quoted before work begins.",
        },
        {
          q: "Will my WooCommerce store work?",
          a: "Yes. Our hosting works with WooCommerce. The WP Agency plan is tuned for e-commerce with stronger database caching for busier stores.",
        },
        {
          q: "What happens if a plugin update breaks my site?",
          a: "With staging environments (available on Business and Agency plans), updates are tested on a clone of your site first. If something breaks, nothing happens to your live site.",
        },
        {
          q: "Can I use my own custom WordPress theme?",
          a: "You can manage themes and plugins through WordPress, subject to technical compatibility, plan resources, licensing, security controls and the Acceptable Use Policy.",
        },
        {
          q: "Is PHP version configurable?",
          a: "Available PHP versions depend on the current platform and selected plan. Confirm the required version before purchase, especially for older themes or plugins.",
        },
        {
          q: "Do you offer a money-back guarantee?",
          a: "Yes. New WordPress hosting accounts include a 7-day money-back guarantee, as set out in our Terms of Service. Contact support within 7 days and we process your refund.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location, excluding 16% VAT. Any included migration assistance is limited to the scope agreed before work starts."
      ctaHeadline="Get Managed WordPress Hosting That Just Works"
      ctaSubtext="Choose a WordPress plan with clearly listed management, backup, staging and migration scope."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
