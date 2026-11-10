import { HostingSupportArt } from "@/components/artwork/cloud-art.tsx";
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
    headline: "Fast for your visitors, wherever they are.",
    body: "Your site should feel quick for every visitor. We use LiteSpeed and NVMe SSD storage so pages load smoothly, and CDN options are available when you need a wider reach.",
    bullets: [
      "LiteSpeed web server, much faster than typical Apache hosting",
      "NVMe SSD storage with very fast disk reads",
      "CDN integration available for global audiences",
    ],
    mockupRight: true,
    visual: "speed",
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
      headline={
        <>
          Fast, Reliable Web Hosting{" "}
          <span className="text-primary">That Stays Online</span>
        </>
      }
      subtext="Host your website on NVMe SSD servers with free SSL, daily backups and hosting tools managed through nPanel. Live prices are shown in the plans below. Fast for your visitors, wherever they are."
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
        { value: "NVMe", label: "SSD Storage" },
        { value: "Free", label: "SSL Certificate" },
        { value: "Daily", label: "Backups" },
        { value: "Free", label: "Migration Help" },
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
          desc: "Live plan cards show the current capacity, billing term and included features before you enter checkout.",
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
      faqs={[
        {
          q: "What do I get with web hosting?",
          a: "You get NVMe SSD hosting, free SSL, daily backups and hosting tools managed through nPanel. Current plan prices are shown on this page and in the cart before you pay.",
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
      ctaSubtext="Fast web hosting with free SSL, daily backups, free migration help and everything managed in nPanel."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
