import { HostingSupportArt, MailboxesArt, MigrationArt, ServerArt, WordPressArt } from "@/components/artwork/cloud-art.tsx";
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
import { FactStrip } from "@/components/signature/FactStrip.tsx";
import { HonestCards } from "@/components/signature/HonestCards.tsx";
import { GlassCta } from "@/components/signature/GlassCta.tsx";
import { HostingFlagshipArt } from "@/components/artwork/flagship-art.tsx";
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

/** Kenya facts buyers compare on, placed after the product comparison. Every value is confirmed. */
function WebHostingFacts() {
  return (
    <FactStrip
      id="hosting-facts"
      eyebrow="What you can count on"
      title="The facts behind your hosting"
      facts={[
        { value: "99.9%", label: "Monthly uptime commitment, with a 5% service credit if we fall below it." },
        { value: "M-Pesa", label: "Pay by M-Pesa or card, in KES or USD based on your location." },
        { value: "KeNIC", label: "KeNIC-accredited registrar for .ke and .co.ke domains, hosted in the same account." },
        { value: "7 days", label: "Money-back guarantee on new web hosting accounts." },
      ]}
    />
  );
}

/** Replaces the repeated "why us" points with an honest fit check before the FAQ. */
function WebHostingFit() {
  return (
    <HonestCards
      id="right-fit"
      eyebrow="Is this the right hosting?"
      title="Where web hosting might not suit you"
      intro="Web hosting covers most business websites. These are the cases where another Nisc Cloud product is a better fit."
      items={[
        {
          Art: WordPressArt,
          title: "You want WordPress handled for you",
          text: "Managed WordPress hosting adds updates, a WordPress firewall and backups handled by plan. Web hosting includes a one-click installer, and you look after the updates.",
        },
        {
          Art: () => <ServerArt kind="vps" />,
          title: "Your site needs its own server",
          text: "A VPS gives more resources and root access for applications and high-traffic sites. Web hosting shares its environment and suits standard business websites.",
        },
        {
          Art: MigrationArt,
          title: "Your setup is unusual",
          text: "Custom applications, several databases or strict change windows need a migration scope agreed first. Tell us about the site and we will say what is included before you commit.",
        },
      ]}
    />
  );
}

/** Glass closing card in place of the standard banner. */
function WebHostingClose() {
  return (
    <GlassCta
      eyebrow="Your site, live this week"
      title="Get reliable web hosting today"
      body="Website and email hosting in one package, with a CDN, DDoS protection, malware scanning and daily backups, all managed in nPanel. Pay by M-Pesa or card."
      action={{ label: "Choose a plan", to: "#plans" }}
      secondary={{ label: "Talk to sales", to: "/contact?serviceName=Web%20Hosting" }}
      art={<HostingFlagshipArt />}
      artLabel="A Nisc Cloud hosting dashboard"
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharedHostingPage() {
  return (
    <ServicePageShell
      badge="Web Hosting"
      headline="Fast, reliable web hosting that stays online"
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
          title: "Compare current plans",
          desc: "Review live capacity, billing terms and included features. Ask for guidance if your traffic or application needs are uncertain.",
        },
        {
          num: "02",
          title: "Connect a domain",
          desc: "Register, transfer or use a domain you already own. The cart shows the selected path and its current price before payment.",
        },
        {
          num: "03",
          title: "Provision the service",
          desc: "After confirmed payment, provisioning begins and access details are sent when the hosting service is ready.",
        },
        {
          num: "04",
          title: "Set up or migrate",
          desc: "Use the included hosting tools or agree a migration scope with our team before moving an existing website.",
        },
      ]}
      contentSlots={{
        afterPricing: <WebHostingPlanFit />,
        afterShowcase: (
          <>
            <WebHostingComparison />
            <WebHostingFacts />
          </>
        ),
        afterProcess: <WebHostingMigration />,
        beforeFaq: (
          <>
            <WebHostingFit />
            <WebHostingExplained />
          </>
        ),
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
        {
          q: "How much does web hosting cost in Kenya?",
          a: "Plans start at KSh 149 a month for Launch, KSh 249 for Grow and KSh 799 for Accelerate, excluding VAT. You can pay monthly or for one, two or three years at the same monthly rate, by M-Pesa or card, and prices are shown in KES or USD based on your location.",
        },
        {
          q: "Where is my website hosted?",
          a: "Nisc Cloud hosts client data in data centres in Kenya, America and Europe, with a CDN delivering your pages from closer to each visitor. Availability, backups and support response times are set out in our Service Level Agreement.",
        },
        {
          q: "What uptime do you commit to?",
          a: "A 99.9% monthly uptime commitment for web hosting, which allows about 43 minutes of downtime in a 30-day month. Scheduled maintenance is excluded, and if uptime falls below 99.9% you can claim a 5% service credit, as set out in our Service Level Agreement.",
        },
      ]}
      pricingNote="Prices are shown in KES or USD based on your location. Easy checkout. 7-day money-back guarantee on new accounts."
      closing={<WebHostingClose />}
      showcaseBlocks={showcaseBlocks}
    />
  );
}
