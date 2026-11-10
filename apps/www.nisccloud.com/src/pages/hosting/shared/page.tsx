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
      badge="Shared Web Hosting"
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
          title: "Choose Your Plan",
          desc: "Pick a plan that fits your website size and traffic. Not sure? Start with Business, our most popular option for growing sites.",
        },
        {
          num: "02",
          title: "Register or Transfer Domain",
          desc: "Claim your domain or transfer an existing one. We guide you through setup, or handle the transfer for free.",
        },
        {
          num: "03",
          title: "Hosting Ready After Checkout",
          desc: "After checkout, your hosting is set up with SSL and email ready to use, and your hosting tools open from nPanel. We help you get live without the guesswork.",
        },
        {
          num: "04",
          title: "Launch Your Website",
          desc: "Install WordPress with one click, import your existing site, or let our team migrate it for free. You are live and ready for customers.",
        },
      ]}
      whyPoints={[
        {
          title: "Fast for Every Visitor", visual: "speed",
          desc: "LiteSpeed and NVMe SSD keep pages responsive. Your site feels quick for visitors wherever they are.",
        },
        {
          title: "Built to Stay Online", visual: "uptime",
          desc: "Hosting is monitored and maintained so your website stays available. If something needs attention, our team is ready to help.",
        },
        {
          title: "Free Website Migration", visual: "migration",
          desc: "Moving from another host? Our team migrates your site, databases, and emails for free within an agreed scope, with careful planning to limit downtime.",
        },
        {
          title: "Clear Pricing", visual: "pricing",
          desc: "Every price is shown upfront. No surprise renewal shocks, and no charges for features listed as free.",
        },
        {
          title: "Paying Is Simple", visual: "payment",
          desc: "Easy checkout so you can get started without friction. Support is available from your nPanel account if you need a hand.",
        },
        {
          title: "Everything in One Account", visual: "integrate",
          desc: "Domains, hosting, email, invoices and support stay connected in nPanel, so you always know where to look.",
        },
      ]}
      faqs={[
        {
          q: "What do I get with shared hosting?",
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
          a: "Yes. All shared hosting plans include a one-click WordPress installer. For WordPress-specific optimisation, see our dedicated WordPress Hosting plans.",
        },
        {
          q: "What happens if I need more space?",
          a: "We notify you as you approach your plan's limits. You can upgrade to a larger plan from nPanel without migrating your website.",
        },
        {
          q: "Do you offer a money-back guarantee?",
          a: "Yes. New shared hosting accounts include a 7-day money-back guarantee, as set out in our Terms of Service. Contact our team within 7 days and we process your full refund.",
        },
      ]}
      pricingNote="Prices are shown in your selected currency. Easy checkout. 7-day money-back guarantee on new accounts."
      ctaHeadline="Get Reliable Web Hosting Today"
      ctaSubtext="Fast shared hosting with free SSL, daily backups, free migration help and everything managed in nPanel."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
