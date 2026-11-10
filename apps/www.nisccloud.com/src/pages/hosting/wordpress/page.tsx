import { ServiceExperience } from "@/pages/_components/ServiceExperience";
import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Code2, Gauge, GitBranch, Lock, Mail, RefreshCw, Shield, ShoppingCart } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { WordPressPricingSection } from "./_components/WordPressPricingSection.tsx";
import { StagingToLiveArt } from "./_components/StagingToLiveArt.tsx";
import { WordPressPerformanceArt } from "./_components/WordPressPerformanceArt.tsx";
import {
  WordPressComparison,
  WordPressExplained,
  WordPressMigration,
  WordPressPlanFit,
} from "./_components/wordpress-content.tsx";

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "WordPress performance",
    artwork: <WordPressPerformanceArt />,
    caption: false,
    headline: "Built to keep WordPress fast.",
    body: "Every plan includes LiteSpeed cache, WordPress acceleration and a free CDN, so pages are served quickly without extra caching plugins. Business and Performance add object cache for busier sites and WooCommerce stores.",
    bullets: [
      "LiteSpeed cache and WordPress acceleration on every plan",
      "Free CDN for faster pages and images",
      "Object cache on Business and Performance",
    ],
    mockupRight: true,
    visual: "wpPerf",
  },
  {
    tag: "Staging",
    id: "staging",
    artwork: <StagingToLiveArt />,
    caption: false,
    headline: "Test changes before they go live.",
    body: "Business and Performance include a staging environment: a private copy of your site where you can try plugin updates, redesigns and new features, then push them live once they work.",
    bullets: [
      "A private copy of your site for testing",
      "Push tested changes to the live site",
      "Included on Business and Performance",
    ],
    mockupRight: false,
    visual: "wpStaging",
  },
  {
    tag: "Updates and security",
    artwork: <ServiceExperience mode="wordpress" />,
    headline: "Updates, backups and security, handled.",
    body: "Every plan includes automatic WordPress updates, daily backups, malware scanning and removal, and DDoS protection. Keep your themes and plugins from trusted sources and use strong, unique passwords for every administrator.",
    bullets: [
      "Automatic WordPress updates",
      "Daily backups on every plan",
      "Malware scanning and removal, plus DDoS protection",
    ],
    mockupRight: true,
    visual: "security",
  },
  {
    tag: "Developer tools",
    artwork: <ServiceExperience mode="terminal" />,
    headline: "Developer tools when you need them.",
    body: "Manage WordPress from the command line with WP-CLI, connect over SSH or SFTP, choose PHP 8.3, 8.2, 8.1, 8.0 or 7.4 for your site, and deploy with Git on the Performance plan.",
    bullets: [
      "WP-CLI, SSH and SFTP on every plan",
      "PHP 8.3, 8.2, 8.1, 8.0 and 7.4",
      "Git integration on Performance",
    ],
    mockupRight: false,
    visual: "code",
  },
];

export default function WordPressHostingPage() {
  return (
    <ServicePageShell
      badge="Managed WordPress Hosting"
      headline="Managed WordPress hosting that stays fast and up to date"
      subtext="WordPress hosting with LiteSpeed cache, a free CDN, automatic updates, daily backups and malware removal, with your sites and email managed through nPanel."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<WordPressPricingSection />}
      heroImage={niscWebsiteImage("wordpress hosting.png")}
      heroImageStandalone
      heroTrustBadge={{
        line1: "LiteSpeed cache and free CDN",
        line2: "Automatic WordPress updates",
      }}
      trustStats={[
        { value: "Auto", label: "WordPress Updates" },
        { value: "Daily", label: "Backups & Malware Scans" },
        { value: "LiteSpeed", label: "Cache & Free CDN" },
        { value: "Staging", label: "On Business & Performance" },
      ]}
      features={[
        {
          icon: <Gauge size={20} />,
          title: "LiteSpeed Cache",
          desc: "Server-level caching and WordPress acceleration on every plan, without extra caching plugins.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Automatic WordPress Updates",
          desc: "WordPress updates are applied automatically on every plan, so your site stays current.",
        },
        {
          icon: <Shield size={20} />,
          title: "Malware Scanning and Removal",
          desc: "Every plan scans for malware and removes it, alongside DDoS protection and daily backups.",
        },
        {
          icon: <Code2 size={20} />,
          title: "Staging Environment",
          desc: "Business and Performance include a staging copy for testing updates before they go live.",
        },
        {
          icon: <ShoppingCart size={20} />,
          title: "WooCommerce Ready",
          desc: "Business and Performance are set up for WooCommerce, with object cache for busier stores.",
        },
        {
          icon: <GitBranch size={20} />,
          title: "WP-CLI, SSH and Git",
          desc: "WP-CLI, SSH and SFTP on every plan, with Git integration on Performance.",
        },
        {
          icon: <Lock size={20} />,
          title: "Free SSL and CDN",
          desc: "HTTPS with a free SSL certificate and a free CDN on every plan.",
        },
        {
          icon: <Mail size={20} />,
          title: "Email Included",
          desc: "Every WordPress plan includes email accounts on your domain, managed in nPanel.",
        },
      ]}
      plans={[]}
      process={[
        {
          num: "01",
          title: "Pick Your Plan",
          desc: "Launch for one site, Business for staging and WooCommerce stores, Performance for busy or multiple sites.",
        },
        {
          num: "02",
          title: "Set Up WordPress",
          desc: "Install WordPress on your plan with your domain and free SSL, then manage it from nPanel.",
        },
        {
          num: "03",
          title: "Move an Existing Site",
          desc: "Share access to your current site. We move it free of charge and agree the switch-over time with you.",
        },
        {
          num: "04",
          title: "Launch and Manage",
          desc: "Updates, backups, staging and email stay in one nPanel account after launch.",
        },
      ]}
      whyPoints={[
        {
          title: "Updates Handled for You",
          visual: "deploy",
          desc: "Automatic WordPress updates on every plan keep your site current without manual work.",
        },
        {
          title: "Security Built In",
          visual: "security",
          desc: "Malware scanning and removal, DDoS protection and daily backups come with every plan.",
        },
        {
          title: "Speed Without Extra Plugins",
          visual: "speed",
          desc: "LiteSpeed cache, WordPress acceleration and a free CDN are part of every plan.",
        },
        {
          title: "Free, Planned Migrations",
          visual: "migration",
          desc: "We move your site free of charge, after checking access, plugins, testing and switch-over with you.",
        },
      ]}
      whySectionHeadline="Why WordPress sites run on Nisc Cloud"
      whySectionVariant="simple"
      contentSlots={{
        afterPricing: <WordPressPlanFit />,
        afterShowcase: <WordPressComparison />,
        afterProcess: <WordPressMigration />,
        beforeFaq: <WordPressExplained />,
      }}
      faqTitle="WordPress hosting questions"
      faqs={[
        {
          q: "What is included with managed WordPress hosting?",
          a: "Every plan includes automatic WordPress updates, daily backups, malware scanning and removal, DDoS protection, LiteSpeed cache, a free CDN, free SSL, email accounts, WP-CLI, SSH and SFTP. Business and Performance add staging, object cache and WooCommerce-ready setup.",
        },
        {
          q: "Are WordPress updates automatic?",
          a: "Yes. Automatic WordPress updates are included on every plan.",
        },
        {
          q: "What happens if a plugin update breaks my site?",
          a: "On Business and Performance, test updates on a staging copy before they reach your live site. Every plan also has daily backups, so a recent copy of your site is available if something goes wrong.",
        },
        {
          q: "Will my WooCommerce store work?",
          a: "Yes. Business and Performance plans are WooCommerce ready, with object cache for busier stores.",
        },
        {
          q: "Can you migrate my existing WordPress site?",
          a: "Yes, free of charge, within a scope agreed before the move. We review access, files, database, plugins, themes and switch-over needs first; timing depends on site size, compatibility and access. Existing faults or extra fixes are quoted before work begins.",
        },
        {
          q: "Which PHP versions can I use?",
          a: "PHP 8.3, 8.2, 8.1, 8.0 and 7.4. Check that your theme and plugins support the version you choose.",
        },
        {
          q: "Do I get SSH and WP-CLI access?",
          a: "Yes. WP-CLI, SSH and SFTP are included on every plan, and the Performance plan adds Git integration.",
        },
        {
          q: "Is email included?",
          a: "Yes. Every WordPress plan includes email accounts on your domain; the number of mailboxes depends on the plan.",
        },
        {
          q: "Can I use my own custom WordPress theme?",
          a: "Yes. You can install and manage your own themes and plugins, subject to technical compatibility, plan resources, licensing and the Acceptable Use Policy.",
        },
        {
          q: "Do you offer a money-back guarantee?",
          a: "Yes. New WordPress hosting accounts include a 7-day money-back guarantee, as set out in our Terms of Service.",
        },
      ]}
      ctaHeadline="Run WordPress without the maintenance work"
      ctaSubtext="Automatic updates, daily backups, LiteSpeed cache and malware removal on every plan, managed in nPanel."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
