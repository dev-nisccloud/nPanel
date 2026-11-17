import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { SERVICE_PACKAGE_NOTES } from "@/lib/service-packages.ts";
import { fetchSocialMediaPlansPublic } from "@/lib/vps-plans-api.ts";
import { NpanelPricingSection } from "@/pages/services/_components/NpanelPricingSection.tsx";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Share2, Users, Calendar, Camera, TrendingUp, MessageSquare, BarChart2, Star } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const SOCIAL_ADDONS = [
  { id: "social-photoshoot", label: "Monthly Content Photoshoot (Half-Day)", price: 25000, period: "month" },
  { id: "social-reels", label: "Extra 4 Short-Form Videos", price: 15000, period: "month" },
  { id: "social-ads", label: "Social Media Ad Boosting Management", price: 15000, period: "month" },
];

function SocialAddons() {
  const { currency, kesToCurrencyRate } = useCurrency();
  const display = (amount: number) =>
    kesToCurrencyRate == null ? "Updating…" : formatCurrency(convertKesForDisplay(amount, currency, kesToCurrencyRate), currency);
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 md:px-8">
      <h3 className="text-center text-sm font-semibold text-foreground">Optional add-ons</h3>
      <p className="mt-1 text-center text-sm text-muted-foreground">Quoted with the plan. Not included in the monthly price above.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {SOCIAL_ADDONS.map((addon) => (
          <li key={addon.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm">
            <span className="font-medium">{addon.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">
              {display(addon.price)}/{addon.period}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Content Performance",
    headline: "Learn which content earns attention",
    body: "We review reach, saves, comments, shares, profile actions, and configured website signals to understand what your audience responds to. Reports separate observed platform activity from broader business outcomes.",
    bullets: [
      "Planned content shared through the agreed review workflow",
      "Platform-native formats: Reels, carousels, Stories, TikToks",
      "Publishing times adjusted using available audience data",
    ],
    mockupRight: true,
    visual: "engagement",
  },
  {
    tag: "Community Management",
    headline: "A clear response path for your community",
    body: "Within the channels, hours, and response scope in your plan, we triage comments and messages using agreed guidance. Sensitive, sales-critical, or account-specific issues move to your team.",
    bullets: [
      "Agreed inboxes monitored on the contracted schedule",
      "Response guidance and escalation contacts documented",
      "Reviews covered only on the selected supported channels",
    ],
    mockupRight: false,
    visual: "inbox",
  },
];

export default function SocialMediaPage() {
  return (
    <ServicePageShell
      badge="Social Media Management"
      headline={<>Build a following. <br /><span className="text-primary">Build a business.</span></>}
      subtext="Plan, produce, publish, and review social content on the channels selected for your business. The service creates a consistent operating rhythm while your team keeps control of facts, approvals, and sensitive responses."
      serviceType="marketing"
      checkoutServiceType="social_media"
      checkoutProductName="Social Media Management"
      customPlansSection={
        <>
        <NpanelPricingSection
          fetchPlans={fetchSocialMediaPlansPublic}
          title="Social media plans"
          description="Two monthly plans, priced in nPanel, plus Enterprise when the work needs a scope of its own. Prices exclude 16% VAT."
          checkoutServiceType="social_media"
          serviceName="Social Media Management"
          sectionId="social-plans"
        />
        <SocialAddons />
      </>
      }
      heroImage={niscWebsiteImage("Social media marketing.png")}
      heroImageStandalone
      trustStats={[
        { value: "Planned", label: "Review Workflow" },
        { value: "Dedicated", label: "Account Manager" },
        { value: "Free", label: "Strategy Call" },
        { value: "Monthly", label: "Performance Review" },
      ]}
      features={[
        {
          icon: <Calendar size={20} />,
          title: "Strategic content calendar",
          desc: "A forward content plan built around your offers, audience questions, relevant moments, and the review workflow agreed during onboarding.",
        },
        {
          icon: <Camera size={20} />,
          title: "Professional content creation",
          desc: "Create the graphics, carousels, story assets, copy, or video scripts included in your plan, adapted for the selected channels.",
        },
        {
          icon: <Share2 size={20} />,
          title: "Multi-platform management",
          desc: "Coordinate the channels in your selected plan from one strategy while adapting format, tone, and publishing details to each platform.",
        },
        {
          icon: <MessageSquare size={20} />,
          title: "Community management",
          desc: "Monitor and triage the agreed comments, messages, or reviews during contracted coverage, using approved responses and escalation rules.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "Discovery & publishing tests",
          desc: "Test topics, formats, keywords, hashtags, and posting windows using platform guidance and your account's observed performance.",
        },
        {
          icon: <Users size={20} />,
          title: "Audience development",
          desc: "Use useful content, collaborations, and approved campaigns to reach relevant people. Follower or lead growth is measured, not guaranteed.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Monthly analytics reports",
          desc: "Review reach, audience change, engagement, content performance, and configured referral events, with attribution limits stated clearly.",
        },
        {
          icon: <Star size={20} />,
          title: "Reputation & review management",
          desc: "For supported channels included in scope, organise review monitoring, draft responses, and escalate issues that need an authorised decision.",
        },
      ]}
      plans={[]}
      process={[
        { num: "01", title: "Brand, channel & risk audit", desc: "We review your current accounts, target audience, access, brand rules, competitors, and issues that require an authorised response." },
        { num: "02", title: "Strategy & review plan", desc: "We define content pillars, selected channels, formats, publishing cadence, approval route, response coverage, and escalation contacts." },
        { num: "03", title: "Create & publish", desc: "We produce the content included in your plan, route it through the agreed review process, and schedule approved posts." },
        { num: "04", title: "Measure & refine", desc: "Monthly review connects platform metrics to content decisions, documents what was tested, and shapes the next calendar." },
      ]}
      whyPoints={[
        { title: "Context before trends", desc: "Local moments and platform trends are used only when they fit your audience, brand, and business purpose.", visual: "localMarket" },
        { title: "Quality signals over vanity counts", desc: "We look beyond follower totals to saves, replies, profile actions, qualified conversations, and other signals relevant to your goal.", visual: "engagement" },
        { title: "A consistent account lead", desc: "A dedicated account manager coordinates the calendar, feedback, production, and reporting so decisions have a clear owner.", visual: "support" },
        { title: "Control through a defined workflow", desc: "Your onboarding records who reviews planned content, what may be scheduled after approval, and how urgent changes are handled.", visual: "approval" },
        { title: "A repeatable publishing operation", desc: "Strategy, production, scheduling, scoped community work, and reporting run on one documented cadence rather than ad hoc requests.", visual: "calendar" },
        { title: "Adaptation based on evidence", desc: "Platform changes inform testing, but your own account data and business goals determine what the team repeats or stops.", visual: "algorithm" },
      ]}
      faqs={[
        { q: "Will you post content without my approval?", a: "We agree the review and publishing workflow during onboarding. Planned content is shared for review on the agreed schedule; once approved, it may be scheduled. Time-sensitive changes and delegated publishing rules are documented separately." },
        { q: "How do you create content if you don't know my business?", a: "We start with a comprehensive onboarding session where we learn your brand voice, target customer, key messages, and business goals. We also research your industry and competitors ongoing." },
        { q: "Can you manage our WhatsApp Business account too?", a: "WhatsApp Business work may be scoped for Enterprise clients after reviewing account access, consent, message types, response ownership, and the available platform tools." },
        { q: "Do you respond to negative comments or complaints?", a: "Within contracted community-management coverage, we can triage and draft or send approved responses. Legal, safety, account, refund, and high-risk complaints are escalated to your authorised team according to the response guide." },
        { q: "How long before we see growth?", a: "There is no reliable fixed growth window. Baseline audience quality, content supply, channel maturity, competition, spend, and platform changes all affect results. Early reporting focuses on establishing a baseline and learning what earns relevant responses." },
        { q: "What platforms do you support?", a: "Plans can cover selected channels such as Facebook, Instagram, LinkedIn, TikTok, or X. Other channels are confirmed during scoping; the recommended mix depends on your audience, content capacity, and plan." },
      ]}
      ctaHeadline="Let's build a social presence that generates real business"
      ctaSubtext="Choose the audience, channels, and business questions that matter most. We will propose a content rhythm, review workflow, and measurement plan your team can sustain."
      pricingNote={SERVICE_PACKAGE_NOTES.SOCIAL_MEDIA}
      showcaseBlocks={showcaseBlocks}
    />
  );
}
