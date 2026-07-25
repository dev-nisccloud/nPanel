import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Target, TrendingUp, BarChart2, Globe, Megaphone, Zap, Eye, DollarSign, CheckCircle2 } from "lucide-react";
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
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Campaign Dashboard</div>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[["Ad Spend","Tracked"],["Leads","Attributed"],["CPL","Reported"],["Sales","Linked"]].map(([l,v]) => (
                <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                  <div className="font-extrabold text-primary text-sm">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary shrink-0" />
              Clear reporting every week
            </div>
          </div>
        </div>
      </div>
    ),
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
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Audience Focus</div>
          <div className="space-y-2">
            {[["Local areas","Priority"],["Interests","Matched"],["Lookalikes","Built"],["Retargeting","Active"]].map(([loc, pct]) => (
              <div key={loc}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">{loc}</span>
                  <span className="font-semibold">{pct}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "72%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/40 shadow text-center">
          <div className="text-2xl font-extrabold text-primary">30 days</div>
          <div className="text-[10px] text-muted-foreground">Results promise on active campaigns</div>
        </div>
      </div>
    ),
  },
];

export default function PaidAdsPage() {
  return (
    <ServicePageShell
      badge="Paid Advertising Management"
      headline={<>Google, Meta & TikTok Ads<br /><span className="text-primary">That Bring Real Customers</span></>}
      subtext="Stop spending on ads that get clicks but no customers. We run performance-first campaigns on Google, Facebook, Instagram, and TikTok with clear tracking and reporting."
      serviceType="marketing"
      checkoutServiceType="paid_ads"
      checkoutProductName="Paid Ads"
      heroImage="https://storage.nisccloud.com/npanel-uploads/nisc-website/Paid%20advertising%20management.png"
      heroImageStandalone
      trustStats={[
        { value: "100+", label: "Clients We Have Helped" },
        { value: "24/7", label: "Support Available" },
        { value: "30 days", label: "Results Promise" },
        { value: "Clear", label: "Lead & Sales Reporting" },
      ]}
      features={[
        {
          icon: <Target size={20} />,
          title: "Precision Audience Targeting",
          desc: "Target by location, interests, job title, and custom audiences built from your existing customers.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "Conversion-Focused Ad Creative",
          desc: "We write copy and design visuals for local audiences: culturally relevant ads that stop the scroll and drive action.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Rigorous A/B Testing",
          desc: "Continuously test headlines, images, audiences, and landing pages to find what converts best, then scale winners.",
        },
        {
          icon: <Globe size={20} />,
          title: "Google Search & Shopping Ads",
          desc: "Capture high-intent buyers searching for exactly what you sell. We manage Search, Display, Shopping, and YouTube campaigns.",
        },
        {
          icon: <Megaphone size={20} />,
          title: "Meta (Facebook & Instagram) Ads",
          desc: "Full-funnel Meta campaigns for awareness, consideration, and retargeting across the biggest social platforms people use locally.",
        },
        {
          icon: <Zap size={20} />,
          title: "TikTok Performance Ads",
          desc: "Native TikTok video ads with UGC-style creative, In-Feed ads, and placements for brand building and e-commerce.",
        },
        {
          icon: <Eye size={20} />,
          title: "Retargeting & Remarketing",
          desc: "Re-engage website visitors, video viewers, and social engagers with follow-up ads that bring hesitant prospects back.",
        },
        {
          icon: <DollarSign size={20} />,
          title: "Budget Optimisation & Bidding",
          desc: "Smart bidding, dayparting, device adjustments, and budget allocation across channels to get more from every shilling spent.",
        },
      ]}
      plans={[
        {
          id: "ads-starter",
          name: "Growth Starter",
          price: 30000,
          period: "month",
          features: [
            "1 ad platform (Google or Meta)",
            "Up to KES 50K ad spend managed",
            "Campaign setup + audience targeting",
            "Ad creative (2 designs/month)",
            "Monthly performance report",
            "Monthly strategy call",
          ],
        },
        {
          id: "ads-enterprise",
          name: "Market Leader",
          price: 120000,
          period: "month",
          features: [
            "Google + Meta + TikTok ads",
            "Unlimited ad spend managed",
            "Full creative production (video + static)",
            "CRM integration & lead scoring",
            "Dedicated account strategist",
            "Weekly strategy sessions",
          ],
        },
      ]}
      addons={[
        { id: "ads-videocreative", label: "Video Ad Production (30s spot)", price: 45000, period: "once" },
        { id: "ads-landingpage", label: "Dedicated Conversion Landing Page", price: 20000, period: "once" },
        { id: "ads-tiktok", label: "TikTok Ads Add-On (to any plan)", price: 20000, period: "month" },
      ]}
      process={[
        { num: "01", title: "Audit & Strategy", desc: "We audit any existing campaigns, research competitors, and build a full-funnel advertising plan targeting your highest-value customer segments." },
        { num: "02", title: "Build & Launch", desc: "Campaign structure, audience targeting, ad creative, tracking pixels, and conversion goals all set up and tested before spend begins." },
        { num: "03", title: "Optimise Weekly", desc: "Daily monitoring and weekly optimisation: pause underperforming ads, scale winners, test new audiences, and refine targeting based on real data." },
        { num: "04", title: "Report & Scale", desc: "Monthly reports with plain-English insights. We show what your ad budget produced and how we will improve results next month." },
      ]}
      whyPoints={[
        { title: "We Understand Local Buyers", desc: "Ad copy that works elsewhere does not always work here. We craft messaging, visuals, and offers tuned to local culture and buying behaviour.", visual: "localMarket" },
        { title: "No Wasted Impressions", desc: "We focus on targeting precision. Every impression should be seen by someone more likely to buy, not wasted on the wrong audience.", visual: "targeting" },
        { title: "Management Fee Separate from Ad Spend", desc: "Our management fee is fixed. Your ad spend goes to the platforms. No hidden markups on ad spend.", visual: "pricing" },
        { title: "Conversion Tracking Done Properly", desc: "We set up Google Tag Manager, Meta Pixel, and server-side tracking so every lead is attributed clearly.", visual: "tracking" },
        { title: "Accountable, Measurable Results", desc: "We agree on KPIs upfront: cost per lead, cost per sale, and return targets. Every report shows progress against these metrics.", visual: "results" },
        { title: "Creative That Converts", desc: "Pretty ads do not always convert. We test direct-response creative, testimonial ads, and offer-led copy to find what drives sales.", visual: "creative" },
      ]}
      faqs={[
        { q: "How much budget do I need for paid ads to work?", a: "We recommend a minimum monthly ad spend of KES 30,000 for meaningful results on a single platform. This gives enough data for optimisation. Budgets of KES 100,000+ per month typically see better scale." },
        { q: "How soon will I see results from my ads?", a: "Google Search ads can generate leads within 24 to 48 hours of launch. Meta and TikTok ads typically need 7 to 14 days of learning before performance stabilises. Fuller optimisation results are usually visible by month 2. We also work to a 30-day results promise on active campaigns." },
        { q: "Does the monthly fee include the ad budget?", a: "No. Our management fee covers strategy, setup, creative, and optimisation. Your ad spend budget is paid directly to Google, Meta, or TikTok. This is standard practice and ensures your ad budget goes to the platform." },
        { q: "Can you run ads for any industry?", a: "We work across most industries. We have strong experience in real estate, healthcare, education, retail, hospitality, and professional services. We will be honest if your industry has platform restrictions." },
        { q: "Do you create the ad images and copy?", a: "Yes. All plans include ad creative (images and copy). Higher plans also include video ads. We create content specifically tested for local audiences." },
        { q: "What if my ads aren't performing?", a: "Performance issues are normal, especially in the first 30 days. We optimise continuously. If results are below agreed targets by month 3, we provide an extra strategy review and creative refresh at no extra cost." },
      ]}
      ctaHeadline="Turn Your Ad Budget Into Clear Results"
      ctaSubtext="We build campaigns with proper tracking, weekly optimisation, and reporting you can understand. Let's make every shilling work harder."
      pricingNote="Management fee billed monthly. Ad spend billed directly by Google/Meta/TikTok."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
