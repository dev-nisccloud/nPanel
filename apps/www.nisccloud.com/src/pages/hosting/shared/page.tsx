import { HostingSupportArt, MailboxesArt } from "@/components/artwork/cloud-art.tsx";
import { WebHostingStackArt } from "./_components/WebHostingStackArt.tsx";
import {
  WebHostingComparison,
  WebHostingExplained,
  WebHostingMigration,
  WebHostingPlanFit,
} from "./_components/web-hosting-content.tsx";
import { HostingStory } from "@/components/artwork/npanel-stories";
import { HostingPerformanceArtwork } from "@/pages/_components/HostingReviewArtwork.tsx";
import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { SharedPricingSection } from "./_components/SharedPricingSection.tsx";

// ─── Showcase Blocks ─────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Speed Dashboard",
    id: "performance-preview",
    artwork: <HostingPerformanceArtwork />,
    headline: "Performance and protection, included.",
    body: "Every plan runs on NVMe SSD storage with a CDN, DDoS protection, malware and antivirus scanning, daily backups and free SSL, so your site stays fast and protected without extra add-ons. Protection works best alongside good habits: keep WordPress, Joomla, themes and plugins updated, and use strong, unique passwords.",
    bullets: [
      "CDN and NVMe SSD storage for fast page loads",
      "DDoS protection, plus malware and antivirus scanning",
      "Daily backups and free SSL on every plan",
    ],
    mockupRight: true,
    visual: "speed",
  },
  {
    tag: "Supported technologies",
    id: "supported-technologies",
    artwork: <WebHostingStackArt />,
    caption: false,
    headline: "Run WordPress, PHP, Laravel, Joomla, Node.js or your own code.",
    body: "Host a WordPress site, a custom website or an application built with PHP, Laravel, Joomla or Node.js. With SSH and command-line access you can run database migrations, install dependencies and build steps from a terminal instead of uploading files one at a time.",
    bullets: [
      "WordPress and Joomla sites",
      "Custom websites and PHP, Laravel or Node.js applications",
      "SSH and command-line access for deployments and maintenance",
    ],
    mockupRight: false,
    visual: "code",
  },
  {
    tag: "Email included",
    id: "email-included",
    artwork: <MailboxesArt />,
    headline: "Website and email hosting in one package.",
    body: "Every web hosting plan includes email hosting on your own domain, so your website and mailboxes are set up and managed together in nPanel. If you only need email, Business Email is available on its own, and teams that also use Microsoft 365 or Google Workspace can combine them with Nisc Mail through Enterprise Hybrid Email.",
    bullets: [
      "Professional email addresses on your domain",
      "Website and email managed in one nPanel account",
      "Business Email and Enterprise Hybrid Email are also sold separately",
    ],
    mockupRight: true,
    visual: "integrate",
  },
  {
    tag: "nPanel Management",
    id: "management-preview",
    artwork: <HostingStory />,
    caption: false,
    headline: "Manage your hosting with a clean, simple dashboard",
    body: "Use nPanel to manage your Nisc Cloud services, review invoices and get support. Open the hosting tools included with your plan when you need to work on your website or email.",
    bullets: [
      "Find your domains, hosting and email services in one account",
      "Review invoices and service renewals without switching accounts",
      "Contact support when you need help with setup or changes",
    ],
    mockupRight: false,
    visual: "cpanel",
  },
  {
    tag: "Hosting support",
    id: "hosting-support",
    headline: "Support for your next step",
    body: "Get help with your hosting setup, migration questions and ongoing service needs. Start from your Nisc Cloud account so the conversation stays connected to your services.",
    bullets: [
      "Ask for guidance before moving your website",
      "Get help finding the right hosting tools",
      "Keep service and billing questions in one place",
    ],
    visual: "speed",
    visualRight: true,
    artwork: <HostingSupportArt />,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharedHostingPage() {
  return (
    <ServicePageShell
      badge="Web Hosting"
      headline="Fast, Reliable Web Hosting That Stays Online"
      subtext="Host your website and email together on NVMe SSD servers with a CDN, DDoS protection, malware scanning, daily backups and free SSL, all managed through nPanel."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<SharedPricingSection />}
      plans={[]}
      heroImage={niscWebsiteImage("website hosting.png")}
      heroImageStandalone
      heroTrustBadge={{
        line1: "NVMe SSD and free SSL",
        line2: "Managed through nPanel",
      }}
      trustStats={[
        { value: "Email", label: "Hosting Included" },
        { value: "CDN", label: "& DDoS Protection" },
        { value: "Daily", label: "Backups & Malware Scans" },
        { value: "SSH", label: "& Command-Line Access" },
      ]}
      process={[
        {
          num: "01",
          title: "Compare Current Plans",
          desc: "Review live capacity, billing terms and included features. Ask for guidance if your traffic or application needs are uncertain.",
        },
        {
          num: "02",
          title: "Connect a Domain",
          desc: "Register, transfer or use a domain you already own. The cart shows the selected path and its current price before payment.",
        },
        {
          num: "03",
          title: "Provision the Service",
          desc: "After confirmed payment, provisioning begins and access details are sent when the hosting service is ready.",
        },
        {
          num: "04",
          title: "Set Up or Migrate",
          desc: "Use the included hosting tools or agree a migration scope with our team before moving an existing website.",
        },
      ]}
      whyPoints={[
        {
          title: "Know What You Are Buying", visual: "speed",
          desc: "Every plan lists its capacity, billing term and included features before you reach checkout.",
        },
        {
          title: "Choose for the Workload", visual: "uptime",
          desc: "Web hosting suits standard business websites. We can discuss WordPress-specific or server options when the workload needs a different environment.",
        },
        {
          title: "Migration Has a Scope", visual: "migration",
          desc: "We review the website, database, email and DNS requirements before confirming what migration assistance is included.",
        },
        {
          title: "Manage the Service in nPanel", visual: "integrate",
          desc: "Hosting, related domains, invoices and support remain connected to the same Nisc Cloud account.",
        },
      ]}
      whySectionHeadline="Why businesses host with Nisc Cloud"
      whySectionVariant="simple"
      contentSlots={{
        afterPricing: <WebHostingPlanFit />,
        afterShowcase: <WebHostingComparison />,
        afterProcess: <WebHostingMigration />,
        beforeFaq: <WebHostingExplained />,
      }}
      faqTitle="Web hosting questions"
      faqs={[
        {
          q: "What do I get with web hosting?",
          a: "You get NVMe SSD hosting with email hosting, free SSL, a CDN, DDoS protection, malware and antivirus scanning, daily backups, SSH access and hosting tools managed through nPanel.",
        },
        {
          q: "Is email hosting included?",
          a: "Yes. Every web hosting plan includes email hosting on your own domain; the number of mailboxes depends on the plan. If you only need email, Business Email is available separately.",
        },
        {
          q: "Which technologies can I run?",
          a: "WordPress, Joomla, custom websites and applications built with PHP, Laravel or Node.js. SSH and command-line access are included for deployments and maintenance.",
        },
        {
          q: "How is my website protected?",
          a: "Every plan includes DDoS protection, malware and antivirus scanning, daily backups and free SSL, with a CDN to keep pages loading quickly.",
        },
        {
          q: "Can I host a .co.ke website with you?",
          a: "Yes. You can register or transfer your domain and host it with us under one account, so naming and hosting stay simple.",
        },
        {
          q: "How long does setup take after payment?",
          a: "We provision your hosting after checkout and send your access details by email. Setup help is available from your nPanel account if you need guidance.",
        },
        {
          q: "Is WordPress hosting included?",
          a: "Yes. All web hosting plans include a one-click WordPress installer. For WordPress-specific optimisation, see our dedicated WordPress Hosting plans.",
        },
        {
          q: "What happens if I need more space?",
          a: "We notify you as you approach your plan's limits. You can upgrade to a larger plan from nPanel without migrating your website.",
        },
        {
          q: "Do you offer a money-back guarantee?",
          a: "Yes. New web hosting accounts include a 7-day money-back guarantee, as set out in our Terms of Service. Contact our team within 7 days and we process your full refund.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location. Easy checkout. 7-day money-back guarantee on new accounts."
      ctaHeadline="Get Reliable Web Hosting Today"
      ctaSubtext="Website and email hosting in one package, with CDN, DDoS protection, malware scanning, daily backups and everything managed in nPanel."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
