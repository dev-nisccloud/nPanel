import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Target, TrendingUp, BarChart2, Globe, Megaphone, Zap, Eye, DollarSign } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Campaign Performance",
    headline: "Every shilling tracked. Every lead attributed.",
    body: "We set up conversion tracking before the first ad runs. You see exactly how many leads and sales each campaign generated - not just clicks and impressions that don't pay the bills.",
    bullets: [
      "Google Tag Manager, Meta Pixel, and server-side tracking configured",
      "Weekly performance reports with cost-per-lead breakdowns",
      "ROAS dashboard updated in real time",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Campaign Dashboard</div>
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[["Ad Spend","KES 65,000"],["Revenue","KES 312,000"],["ROAS","4.8×"],["CPL","KES 890"]].map(([l,v]) => (
                <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                  <div className="font-extrabold text-primary text-sm">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1 h-10">
              {[30,50,42,65,72,68,80,88,76,92,85,95].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i % 2 === 0 ? "oklch(0.60 0.22 235)" : "oklch(0.55 0.18 195)", opacity: 0.5 + (i/12)*0.5 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Audience Targeting",
    headline: "Reach Nairobi estate residents. Not random people.",
    body: "We target by postcode, estate, income bracket, and interests - so your ads reach the exact Kenyan consumer most likely to buy from you, not waste budget on the wrong audience.",
    bullets: [
      "Hyper-local geo-targeting down to Nairobi estate level",
      "Lookalike audiences built from your best existing customers",
      "Income-bracket and interest-based Meta audience layering",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Audience Breakdown</div>
          <div className="space-y-2">
            {[["Westlands","28%"],["Karen / Runda","22%"],["Kilimani","18%"],["CBD","16%"],["Other","16%"]].map(([loc, pct]) => (
              <div key={loc}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">{loc}</span>
                  <span className="font-semibold">{pct}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: pct }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/40 shadow text-center">
          <div className="text-2xl font-extrabold text-primary">32%</div>
          <div className="text-[10px] text-muted-foreground">Lower CPL vs industry average</div>
        </div>
      </div>
    ),
  },
];

export default function PaidAdsPage() {
  return (
    <ServicePageShell
      badge="Paid Advertising Management"
      headline={<>Google, Meta & TikTok Ads<br /><span className="text-primary">That Actually Make Money</span></>}
      subtext="Stop burning budget on ads that get clicks but no customers. We run performance-first advertising campaigns on Google, Facebook, Instagram, and TikTok - engineered to deliver measurable ROI for Kenyan businesses."
      serviceType="marketing"
      checkoutServiceType="paid_ads"
      checkoutProductName="Paid Ads"
      trustStats={[
        { value: "KES 85M+", label: "Ad Spend Managed Annually" },
        { value: "4.8×", label: "Average Return on Ad Spend" },
        { value: "220+", label: "Active Campaigns Running" },
        { value: "32%", label: "Lower Cost-Per-Lead vs Industry" },
      ]}
      features={[
        {
          icon: <Target size={20} />,
          title: "Precision Audience Targeting",
          desc: "Laser-target by location (down to Nairobi estate level), interests, income bracket, job title, and custom audiences built from your existing customers.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "Conversion-Focused Ad Creative",
          desc: "We write copy and design visuals specifically for Kenyan audiences - culturally relevant ads that stop the scroll and drive action, not just impressions.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Rigorous A/B Testing",
          desc: "Continuously test headlines, images, audiences, and landing pages to find what converts best - then scale winners and kill losers without hesitation.",
        },
        {
          icon: <Globe size={20} />,
          title: "Google Search & Shopping Ads",
          desc: "Capture high-intent buyers searching for exactly what you sell. We manage Search, Display, Shopping, and YouTube campaigns with keyword-level precision.",
        },
        {
          icon: <Megaphone size={20} />,
          title: "Meta (Facebook & Instagram) Ads",
          desc: "Full-funnel Meta campaigns - awareness, consideration, and retargeting - that build brand and drive conversions across the biggest social platforms in Kenya.",
        },
        {
          icon: <Zap size={20} />,
          title: "TikTok Performance Ads",
          desc: "Native TikTok video ads that reach Kenya's 8M+ TikTok users. UGC-style creative, In-Feed ads, and TopView placements for brand-building and e-commerce.",
        },
        {
          icon: <Eye size={20} />,
          title: "Retargeting & Remarketing",
          desc: "Re-engage website visitors, video viewers, and social media engagers with tailored follow-up ads that pull hesitant prospects back to convert.",
        },
        {
          icon: <DollarSign size={20} />,
          title: "Budget Optimisation & Bidding",
          desc: "Smart bidding strategies, dayparting, device adjustments, and budget allocation across channels to squeeze the highest ROI from every shilling spent.",
        },
      ]}
      plans={[
        {
          id: "ads-starter",
          name: "Growth Starter",
          price: 30000,
          period: "month",
          features: [
            "1 ad platform (Google OR Meta)",
            "Up to KES 50,000 ad spend managed",
            "Campaign setup + 3 ad sets",
            "Basic audience targeting",
            "Monthly performance report",
            "Ad creative (2 designs/month)",
            "Landing page review",
            "Monthly strategy call",
          ],
        },
        {
          id: "ads-performance-popular",
          name: "Performance Pro",
          price: 65000,
          period: "month",
          features: [
            "2 platforms (Google + Meta)",
            "Up to KES 150,000 ad spend managed",
            "Full-funnel campaign architecture",
            "Advanced audience targeting + lookalikes",
            "Retargeting campaigns",
            "A/B testing (ongoing)",
            "Ad creative (6 designs/month)",
            "Bi-weekly performance reviews",
            "Conversion tracking setup",
            "Weekly performance reports",
          ],
        },
        {
          id: "ads-enterprise",
          name: "Market Leader",
          price: 120000,
          period: "month",
          features: [
            "All platforms: Google + Meta + TikTok",
            "Unlimited ad spend managed",
            "Multi-channel attribution modelling",
            "Full creative production (video + static)",
            "Influencer ad amplification",
            "CRM integration & lead scoring",
            "Custom reporting dashboard",
            "Dedicated account strategist",
            "Daily optimisation",
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
        { num: "01", title: "Audit & Strategy", desc: "We audit any existing campaigns, research your competitors' ad strategies, and build a full-funnel advertising plan targeting your highest-value customer segments." },
        { num: "02", title: "Build & Launch", desc: "Campaign structure, audience targeting, ad creative, tracking pixels, and conversion goals all set up and tested before the first shilling is spent." },
        { num: "03", title: "Optimise Weekly", desc: "Daily monitoring and weekly optimisation cycles: pause underperforming ads, scale winners, test new audiences, and refine targeting based on real data." },
        { num: "04", title: "Report & Scale", desc: "Monthly ROI reports with plain-English insights. We show you exactly what your ad budget produced and how we'll grow results in the month ahead." },
      ]}
      whyPoints={[
        { title: "We Speak Kenyan Consumer", desc: "Ad copy that works in New York doesn't work in Nairobi. We craft messaging, visuals, and offers tuned to Kenyan culture and buying behaviour." },
        { title: "No Wasted Impressions", desc: "We obsess over targeting precision. Every impression should be seen by someone likely to buy - not wasted on the wrong audience just to hit reach numbers." },
        { title: "Management Fee Separate from Ad Spend", desc: "Our management fee is fixed. Your ad spend goes 100% to the platforms. No hidden markups on ad spend, no conflict of interest." },
        { title: "Conversion Tracking That's Actually Set Up", desc: "Most agencies run ads without proper conversion tracking. We set up Google Tag Manager, Meta Pixel, and server-side tracking so every lead is attributed." },
        { title: "Accountable, Measurable Results", desc: "We agree on KPIs upfront - cost per lead, cost per sale, ROAS. Every report shows progress against these metrics. No vanity numbers." },
        { title: "Creative That Converts, Not Just Looks Good", desc: "Pretty ads don't always convert. We test direct-response creative, testimonial ads, and offer-led copy alongside brand creative to find what actually drives sales." },
      ]}
      faqs={[
        { q: "How much budget do I need for paid ads to work?", a: "We recommend a minimum monthly ad spend of KES 30,000 for meaningful results on a single platform. This gives enough data for optimisation. Budgets of KES 100,000+ per month typically see the best economies of scale." },
        { q: "How soon will I see results from my ads?", a: "Google Search ads can generate leads within 24–48 hours of launch. Meta and TikTok ads typically need 7–14 days of learning phase before performance stabilises. Full optimisation results are usually visible by month 2." },
        { q: "Does the monthly fee include the ad budget?", a: "No. Our management fee covers strategy, setup, creative, and optimisation. Your ad spend budget is paid directly to Google/Meta/TikTok. This is standard practice and ensures 100% of your ad budget goes to the platform." },
        { q: "Can you run ads for any industry?", a: "We work across most industries. We have strong experience in real estate, healthcare, education, retail, hospitality, and professional services in Kenya. We'll be honest if your industry has restrictions on the platforms." },
        { q: "Do you create the ad images and copy?", a: "Yes. All plans include ad creative (images and copy). Performance Pro and above also include video ads. We create content specifically tested to work on Kenyan audiences." },
        { q: "What if my ads aren't performing?", a: "Performance issues are normal, especially in the first 30 days. We optimise continuously. If ROAS is below agreed targets by month 3, we provide an additional strategy review and creative refresh at no extra cost." },
      ]}
      ctaHeadline="Turn Your Ad Budget Into Predictable Revenue"
      ctaSubtext="The best Kenyan businesses in your industry are running profitable ads right now. Let us build a campaign that makes every shilling work harder than your competitors'."
      pricingNote="Management fee billed monthly. Ad spend billed directly by Google/Meta/TikTok."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
