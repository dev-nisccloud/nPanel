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
    headline: "Tuned for WordPress from day one.",
    body: "Our stack is built for WordPress: PHP 8.3, MariaDB, OPcache, and LiteSpeed Cache pre-configured. Sites that used to feel slow load cleaner and faster on our platform.",
    bullets: [
      "LiteSpeed Cache pre-installed and configured automatically",
      "PHP 8.3 with OPcache for faster WordPress execution",
      "HTTP/2 multiplexing for parallel asset loading",
    ],
    mockupRight: true,
    visual: "wpPerf",
  },
  {
    tag: "Staging and Safety",
 artwork: <ServiceExperience mode="wordpress" />,
    headline: "Test changes before they go live.",
    body: "One-click staging environments let you test plugin updates, redesigns, and new features on a full clone of your live site. Push to production only when you are confident. Available on Business and Agency plans.",
    bullets: [
      "One-click staging site creation, no technical setup required",
      "Auto WordPress updates tested on staging before going live",
      "30-day backup retention, restore any version in one click",
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
      subtext="Purpose-built WordPress infrastructure with auto-updates, daily backups, and a staging environment. Focus on your business. We handle the technical complexity."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<WordPressPricingSection />}
      heroImage={niscWebsiteImage("wordpress hosting.png")}
      heroImageStandalone
      heroTrustBadge={{
        line1: "PHP 8.3 and LiteSpeed Cache",
        line2: "Free migration and WordPress-aware support",
      }}
      trustStats={[
        { value: "Free", label: "Expert Migration" },
        { value: "99.9%", label: "Uptime Target" },
        { value: "Free", label: "Migration Included" },
        { value: "Daily", label: "Automated Backups" },
      ]}
      features={[
        {
          icon: <Globe size={20} />,
          title: "WordPress-Optimised Stack",
          desc: "PHP 8.3, MariaDB 10.11, OPcache, and LiteSpeed. Every layer is tuned for WordPress so your site stays fast for visitors wherever they are.",
        },
        {
          icon: <Zap size={20} />,
          title: "Built-In WP Caching",
          desc: "LiteSpeed Cache plugin pre-installed and configured. Static pages served directly from cache, reducing server load and page load times.",
        },
        {
          icon: <Shield size={20} />,
          title: "WordPress Firewall and Malware Scanning",
          desc: "Dedicated WordPress WAF blocks common attacks like SQL injection, XSS, and brute-force login attempts before they reach your site.",
        },
        {
          icon: <Code2 size={20} />,
          title: "One-Click Staging Environment",
          desc: "Test plugin updates, theme changes, and new features on a full copy of your live site. Push to production with a single click when you are satisfied.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Automatic WordPress Updates",
          desc: "Core WordPress updates are applied automatically during low-traffic hours. We test on your staging environment first, to reduce the risk of disruption to your live site.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Performance Dashboard",
          desc: "Monitor your WordPress site's speed, uptime, database health, and resource usage from one clean dashboard. Get alerted before problems affect visitors.",
        },
        {
          icon: <Lock size={20} />,
          title: "Free SSL and HTTP/2",
          desc: "Free SSL certificate provisioned quickly. HTTP/2 multiplexing means multiple resources load in parallel, which helps WordPress sites with many assets.",
        },
        {
          icon: <Headphones size={20} />,
          title: "WordPress Expert Support",
          desc: "Our support team understands WordPress. We help with plugin conflicts, theme issues, and performance problems, not just basic server tickets.",
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
          title: "WordPress Auto-Installed",
          desc: "A clean WordPress install is ready with your chosen domain, free SSL, and LiteSpeed Cache pre-configured.",
        },
        {
          num: "03",
          title: "We Migrate Your Existing Site",
          desc: "Already have a WordPress site? Our team migrates it for free: database, files, plugins, and all, with careful planning to limit downtime.",
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
          desc: "Updates, backups, security patches. We handle all of it automatically. You focus on content and customers, not server administration.",
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
          title: "Free Expert Migration", visual: "migration",
          desc: "We migrate WordPress sites with backups, testing and a planned cutover. Your current site stays live while we move you over.",
        },
        {
          title: "Real WordPress Help on Support", visual: "support",
          desc: "When something breaks, you reach people who know WordPress. Problems get solved, not bounced around.",
        },
        {
          title: "Room to Grow With Traffic", visual: "growth",
          desc: "Our WordPress plans are built to handle busy days, product launches, and traffic spikes without falling over.",
        },
      ]}
      faqs={[
        {
          q: "Can you migrate my existing WordPress site?",
          a: "Yes, and it is free within the scope we agree before the move. Our migration team moves your site including plugins, themes, media, and database with minimal downtime. Most migrations complete within 24 hours. Extra work, such as fixing an existing fault, is quoted first and only charged once you approve it.",
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
          a: "Yes. You have full access to your WordPress admin and can install any theme or plugin. We don't restrict what you can build.",
        },
        {
          q: "Is PHP version configurable?",
          a: "Yes. You can switch between PHP 7.4, 8.1, 8.2, and 8.3 from your control panel. We recommend PHP 8.3 for best WordPress performance.",
        },
        {
          q: "Do you offer a money-back guarantee?",
          a: "Yes. New WordPress hosting accounts include a 7-day money-back guarantee, as set out in our Terms of Service. Contact support within 7 days and we process your refund.",
        },
      ]}
      pricingNote="Prices are shown in your selected currency, excluding 16% VAT. Free migration included on all plans, within the agreed scope."
      ctaHeadline="Get Managed WordPress Hosting That Just Works"
      ctaSubtext="Stop fighting slow, unreliable hosting. Get a WordPress platform that is fast, secure, and backed by WordPress-aware support and free migration."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
