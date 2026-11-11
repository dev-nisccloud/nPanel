import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { PAID_ADS_PLANS, SERVICE_PACKAGE_NOTES } from "@/lib/service-packages.ts";
import { Target, TrendingUp, BarChart2, Globe, Megaphone, Zap, Eye, DollarSign } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Campaign Performance",
    headline: "Every shilling tracked. Every lead attributed.",
    body: "We set up conversion tracking before the first ad runs. You see how many leads and sales each campaign generated, not just clicks and impressions that do not pay the bills.",
    bullets: [
      "Google Tag Manager, Meta Pixel, and server-side tracking configured",
      "Weekly performance reports with cost-per-lead breakdowns",
      "Clear dashboards updated as campaigns run",
    ],
    mockupRight: true,
    visual: "tracking",
  },
  {
    tag: "Audience Targeting",
    headline: "Reach the people most likely to buy.",
    body: "We target by location, interests, and lookalike audiences built from your best customers, so your ads reach people who are more likely to convert.",
    bullets: [
      "Local geo-targeting down to neighbourhood level where useful",
      "Lookalike audiences built from your best existing customers",
      "Interest-based audience layering on Meta",
    ],
    mockupRight: false,
    visual: "targeting",
  },
];

export default function PaidAdsPage() {
  return (
    <ServicePageShell
      badge="Paid Advertising Management"
      headline={<>Paid media built around <br /><span className="text-primary">accountable decisions</span></>}
      subtext="Plan, launch and improve campaigns across Google, Meta and TikTok with agreed goals, clear budget ownership and measurement that distinguishes platform activity from business outcomes."
      serviceType="marketing"
      checkoutServiceType="paid_ads"
      checkoutProductName="Paid Ads"
      heroImage="https://storage.nisccloud.com/npanel-uploads/nisc-website/Paid%20advertising%20management.png"
      heroImageStandalone
      trustStats={[
        { value: "Separate", label: "Fee From Ad Spend" },
        { value: "Agreed", label: "Campaign Measures" },
        { value: "Free", label: "Strategy Call" },
        { value: "Monthly", label: "Review Cadence" },
      ]}
      features={[
        {
          icon: <Target size={20} />,
          title: "Precision audience targeting",
          desc: "Target by location, interests, job title, and custom audiences built from your existing customers.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "Conversion-focused ad creative",
          desc: "We write copy and design visuals for local audiences: culturally relevant ads that stop the scroll and drive action.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Rigorous A/B testing",
          desc: "Continuously test headlines, images, audiences, and landing pages to find what converts best, then scale winners.",
        },
        {
          icon: <Globe size={20} />,
          title: "Google Search & Shopping ads",
          desc: "Capture high-intent buyers searching for exactly what you sell. We manage Search, Display, Shopping, and YouTube campaigns.",
        },
        {
          icon: <Megaphone size={20} />,
          title: "Meta (Facebook & Instagram) Ads",
          desc: "Full-funnel Meta campaigns for awareness, consideration, and retargeting across the biggest social platforms people use locally.",
        },
        {
          icon: <Zap size={20} />,
          title: "TikTok performance ads",
          desc: "Native TikTok video ads with UGC-style creative, In-Feed ads, and placements for brand building and e-commerce.",
        },
        {
          icon: <Eye size={20} />,
          title: "Retargeting & remarketing",
          desc: "Re-engage website visitors, video viewers, and social engagers with follow-up ads that bring hesitant prospects back.",
        },
        {
          icon: <DollarSign size={20} />,
          title: "Budget optimisation & bidding",
          desc: "Smart bidding, dayparting, device adjustments, and budget allocation across channels to get more from every shilling spent.",
        },
      ]}
      plans={PAID_ADS_PLANS}
      addons={[
        { id: "ads-videocreative", label: "Video Ad Production (30s spot)", price: 45000, period: "once" },
        { id: "ads-landingpage", label: "Dedicated Conversion Landing Page", price: 20000, period: "once" },
        { id: "ads-tiktok", label: "TikTok Ads Add-On (to any plan)", price: 20000, period: "month" },
      ]}
      process={[
        { num: "01", title: "Audit & strategy", desc: "We audit any existing campaigns, research competitors, and build a full-funnel advertising plan targeting your highest-value customer segments." },
        { num: "02", title: "Build & launch", desc: "Campaign structure, audience targeting, ad creative, tracking pixels, and conversion goals all set up and tested before spend begins." },
        { num: "03", title: "Optimise weekly", desc: "Daily monitoring and weekly optimisation: pause underperforming ads, scale winners, test new audiences, and refine targeting based on real data." },
        { num: "04", title: "Report & scale", desc: "Monthly reports with plain-English insights. We show what your ad budget produced and how we will improve results next month." },
      ]}
      whyPoints={[
        { title: "Brief before budget", desc: "The campaign starts with the audience, offer, destination and customer action—not with a platform setting.", visual: "localMarket" },
        { title: "Channel choice has a reason", desc: "Search, social prospecting and remarketing play different roles. We recommend channels around intent and available evidence.", visual: "targeting" },
        { title: "Management fee separate from ad spend", desc: "Our management fee is fixed. Your ad spend goes to the platforms. No hidden markups on ad spend.", visual: "pricing" },
        { title: "Measurement with context", desc: "Reports distinguish spend, delivery, attributed actions and confirmed business outcomes, including known tracking limitations.", visual: "tracking" },
      ]}
      faqs={[
        { q: "How much budget do I need for paid ads to work?", a: "We recommend a minimum monthly ad spend of KES 30,000 for meaningful results on a single platform. This gives enough data for optimisation. Budgets of KES 100,000+ per month typically see better scale." },
        { q: "How soon will I see results from my ads?", a: "A campaign can begin collecting delivery, click and conversion data after launch. How quickly qualified leads or sales arrive depends on the offer, audience, budget, creative, landing page and competition. We agree the measures that matter before launch and use the early data to improve the campaign." },
        { q: "Does the monthly fee include the ad budget?", a: "No. Our management fee covers strategy, setup, creative, and optimisation. Your ad spend budget is paid directly to Google, Meta, or TikTok. This is standard practice and ensures your ad budget goes to the platform." },
        { q: "Can you run ads for any industry?", a: "We work across most industries. We have strong experience in real estate, healthcare, education, retail, hospitality, and professional services. We will be honest if your industry has platform restrictions." },
        { q: "Do you create the ad images and copy?", a: "Yes. All plans include ad creative (images and copy). Higher plans also include video ads. We create content specifically tested for local audiences." },
        { q: "What if my ads aren't performing?", a: "Performance issues are normal, especially in the first 30 days. We optimise continuously. We review results against the targets agreed in your proposal every month and adjust budgets, audiences and creative." },
      ]}
      ctaHeadline="Plan your next paid-media move"
      ctaSubtext="Bring your offer, current campaigns and budget range. We will identify the questions to resolve before recommending a scoped campaign."
      pricingNote={SERVICE_PACKAGE_NOTES.PAID_ADS}
      showcaseBlocks={showcaseBlocks}
    />
  );
}
