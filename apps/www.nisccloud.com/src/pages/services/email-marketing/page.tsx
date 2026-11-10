import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { EmailMarketingPricingSection } from "@/pages/services/email-marketing/_components/EmailMarketingPricingSection.tsx";
import { Mail, Users, BarChart2, Zap, Target, RefreshCw, Shield, Inbox } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { EmailMarketingStory } from "@/components/artwork/npanel-stories";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Campaign Analytics",
    artwork: <EmailMarketingStory />,
    caption: false,
    headline: "Know what subscribers did next",
    body: "Campaign reports show sends, opens, clicks, unsubscribes, and other events available from your email platform. Where store tracking is correctly connected, we can also review platform-attributed orders without treating attribution as proof of sole causation.",
    bullets: [
      "Engagement and list-health trends in plain language",
      "Attributed order data where the platform supports it",
      "Next-test recommendations based on observed behaviour",
    ],
    mockupRight: true,
    visual: "reporting",
  },
  {
    tag: "Automation Flows",
    headline: "Follow up at useful customer moments",
    body: "We map lifecycle messages around the customer events your systems can reliably provide. Each flow includes entry rules, exclusions, review points, and a clear purpose before it is activated.",
    bullets: [
      "Welcome and onboarding journeys for eligible contacts",
      "Cart or post-purchase flows when store data is available",
      "Re-engagement rules designed to protect list quality",
    ],
    mockupRight: false,
    visual: "automation",
  },
];

export default function EmailMarketingPage() {
  return (
    <ServicePageShell
      badge="Email Marketing"
      headline={<>Make Your Email List <br /><span className="text-primary">A Useful Customer Channel</span></>}
      subtext="Plan campaigns and lifecycle messages around consented audiences, useful content, and measurable subscriber actions. We handle the agreed strategy, production, sending, and review cycle."
      serviceType="marketing"
      plansUnderHero
      customPlansSection={<EmailMarketingPricingSection />}
      plans={[]}
      heroImage={niscWebsiteImage("Email marketing.png")}
      heroImageStandalone
      trustStats={[
        { value: "Segmented", label: "Audience Lists" },
        { value: "Reviewed", label: "Before Sending" },
        { value: "Free", label: "Strategy Call" },
        { value: "Monthly", label: "Learning Cycle" },
      ]}
      features={[
        {
          icon: <Mail size={20} />,
          title: "Professional Email Design",
          desc: "Reusable, mobile-responsive templates aligned to your brand and checked in the email clients included in the agreed testing scope.",
        },
        {
          icon: <Users size={20} />,
          title: "Practical Segmentation",
          desc: "Group eligible contacts using the reliable fields available in your platform, such as purchase history, engagement, location, or customer tags.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Automation Sequences",
          desc: "Build agreed welcome, cart, post-purchase, or win-back flows when the required events and consent status are available.",
        },
        {
          icon: <Target size={20} />,
          title: "A/B Subject Line Testing",
          desc: "Where list size and platform features make a test meaningful, compare subject lines or content variants and record what the result suggests.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Detailed Analytics & Reports",
          desc: "Review delivery, clicks, unsubscribes, list changes, and configured conversion events. Revenue appears only where the connected platform can attribute it.",
        },
        {
          icon: <Zap size={20} />,
          title: "Behavioural Triggers",
          desc: "Use supported events such as sign-up, click, cart, or purchase to start relevant flows, with eligibility and suppression rules agreed first.",
        },
        {
          icon: <Shield size={20} />,
          title: "Deliverability Management",
          desc: "We configure available sender-authentication records and apply sound list practices. Inbox placement remains controlled by mailbox providers and cannot be guaranteed.",
        },
        {
          icon: <Inbox size={20} />,
          title: "List Hygiene & Cleaning",
          desc: "We review bounces, complaints, inactivity, and suppression rules on the agreed cadence to reduce avoidable sends and protect list quality.",
        },
      ]}
      process={[
        { num: "01", title: "Access, Consent & List Audit", desc: "We review data sources, consent records, list health, current segments, and available campaign history before recommending sends." },
        { num: "02", title: "Message & Journey Build", desc: "We create the agreed templates, campaign themes, segments, and automation rules, then confirm exclusions and approval responsibilities." },
        { num: "03", title: "Review & Send", desc: "Campaign copy, design, links, audience, and settings are checked and shared for approval before the scheduled send." },
        { num: "04", title: "Learn & Adjust", desc: "We review engagement, list health, and configured conversion signals, then choose the next useful test or journey improvement." },
      ]}
      whyPoints={[
        { title: "Use the Audience You Have Permission to Reach", desc: "Strategy starts with lawful collection, current consent records, and useful expectations rather than simply sending to every address available.", visual: "results" },
        { title: "Production Capacity Without the Blank Page", desc: "We draft subject lines, body copy, and layouts in your agreed voice, while your team retains review and factual approval.", visual: "typing" },
        { title: "Segments Based on Real Data", desc: "We use fields and behaviours your systems can support instead of inventing precision from incomplete customer records.", visual: "segments" },
        { title: "Automation With Guardrails", desc: "Entry, exit, suppression, and frequency rules help automated journeys stay relevant after activation.", visual: "automation" },
        { title: "List Health Before Send Volume", desc: "Authentication, bounce handling, complaint monitoring, and hygiene reduce avoidable deliverability risk without promising inbox placement.", visual: "inbox" },
        { title: "Reporting With Attribution Limits", desc: "Reports distinguish email-platform activity from attributed outcomes and explain the tracking assumptions behind conversion figures.", visual: "reporting" },
      ]}
      faqs={[
        { q: "Do I need to already have an email list?", a: "No. We can scope consent-based sign-up forms, lead magnets, or in-store collection flows. We do not buy lists or treat an address as permission to market." },
        { q: "What email platform do you use?", a: "We work with Mailchimp, Klaviyo, ActiveCampaign, and Brevo. We recommend the best platform for your business size and goals during onboarding." },
        { q: "How do I get my email list to you?", a: "You export your existing contacts as a CSV and share it securely. We clean, import, and segment the list as part of our onboarding process." },
        { q: "Can you integrate email with our e-commerce store?", a: "Often, provided the store, email platform, account permissions, and required events are compatible. Standard connectors can be scoped during onboarding; custom data work is assessed separately." },
        { q: "Will the emails be compliant with data regulations?", a: "We can configure unsubscribe tools, sender details, suppression rules, and consent-aware workflows. Your organisation remains responsible for its lawful basis, notices, records, audience data, and legal review in every market it targets." },
        { q: "How quickly can we start sending campaigns?", a: "Timing depends on account access, sender authentication, list condition, content, approvals, and automation complexity. We confirm a launch estimate after the audit rather than promise a fixed first-send date." },
      ]}
      ctaHeadline="Your Email List Is Ready to Work Harder"
      ctaSubtext="Bring your current platform, audience sources, and campaign history. We will identify a useful first campaign or lifecycle journey and the data needed to measure it responsibly."
      pricingNote="Monthly retainer. No long-term contract. Cancel with 30-day notice."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
