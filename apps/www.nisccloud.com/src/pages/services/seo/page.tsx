import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { BarChart2, TrendingUp, Search, Globe, Bot, Map, FileText, Zap } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { SeoPricingSection } from "./_components/SeoPricingSection.tsx";

// ─── Hero Illustration ───────────────────────────────────────────────────────

function SeoIllustration() {
  const barData = [40, 55, 48, 70, 62, 85, 78, 95];

  return (
    <div className="space-y-3 select-none">
      {/* Main keyword rankings card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-white" />
            <span className="text-white text-xs font-bold">SEO Performance Dashboard</span>
          </div>
          <span className="text-white/70 text-[10px]">Last 30 days</span>
        </div>

        {/* Traffic trend chart */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-end gap-1.5 h-16">
            {barData.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  height: `${h}%`,
                  background: i === barData.length - 1
                    ? "oklch(0.60 0.22 235)"
                    : `oklch(0.60 0.22 235 / ${0.25 + (i / barData.length) * 0.5})`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
            <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span>
          </div>
        </div>

        {/* Keyword ranking list */}
        <div className="px-4 pb-4 space-y-2">
          {[
            { kw: "web hosting Kenya", pos: 1, change: "+7", delta: "up" },
            { kw: "domain registration Kenya", pos: 2, change: "+5", delta: "up" },
            { kw: "SEO services Nairobi", pos: 3, change: "+4", delta: "up" },
            { kw: "website design Kenya", pos: 4, change: "+3", delta: "up" },
          ].map(({ kw, pos, change, delta }) => (
            <div key={kw} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate max-w-[150px]">{kw}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`font-extrabold ${pos <= 3 ? "text-primary" : "text-foreground"}`}>#{pos}</span>
                <span className={`text-[10px] font-bold ${delta === "up" ? "text-green-500" : "text-red-400"}`}>{change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score cards row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
          <div className="text-lg font-extrabold text-primary">4.2×</div>
          <div className="text-[9px] text-muted-foreground">Traffic Growth</div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
          <div className="text-lg font-extrabold text-green-500">90 days</div>
          <div className="text-[9px] text-muted-foreground">Avg. to Top 3</div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
          <div className="text-lg font-extrabold text-primary">180+</div>
          <div className="text-[9px] text-muted-foreground">Ranked Clients</div>
        </div>
      </div>

      {/* AI + Local SEO status cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Bot size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-foreground">AI / AEO Visibility</span>
          </div>
          <div className="space-y-1">
            {["ChatGPT", "Perplexity", "Google SGE"].map((ai) => (
              <div key={ai} className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">{ai}</span>
                <span className="text-green-500 font-bold">Cited ✓</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Map size={12} className="text-primary" />
            <span className="text-[10px] font-bold text-foreground">Local / Maps Pack</span>
          </div>
          <div className="space-y-1">
            {[
              { label: "Maps Pack", val: "#1" },
              { label: "Reviews", val: "4.9 ⭐" },
              { label: "Citations", val: "20+ dirs" },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-primary font-bold">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Showcase Blocks ─────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Keyword Rank Tracking",
    headline: "Watch your keywords climb to Page 1 on Google Kenya",
    body: "We track every target keyword daily and send you a plain-English report every month showing which positions improved, which pages earned traffic, and where we're pushing next.",
    bullets: [
      "Weekly ranking updates for all target keywords",
      "Google Search Console integration and full management",
      "Competitor keyword gap analysis every quarter",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Keyword Rankings - Kenya</div>
          <div className="p-4 space-y-2">
            {[
              { kw: "website design nairobi", pos: 2, change: "+5" },
              { kw: "branding agency kenya", pos: 1, change: "+8" },
              { kw: "seo services nairobi", pos: 3, change: "+4" },
              { kw: "digital marketing kenya", pos: 4, change: "+3" },
            ].map(({ kw, pos, change }) => (
              <div key={kw} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[140px]">{kw}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">#{pos}</span>
                  <span className="text-green-500 font-semibold">{change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">4.2×</div>
            <div className="text-[10px] text-muted-foreground">Traffic growth</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">90 days</div>
            <div className="text-[10px] text-muted-foreground">To top 3</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Answer Engine Optimisation",
    headline: "Get cited by ChatGPT, Perplexity, and Google AI Overview",
    body: "The next wave of search isn't clicking blue links - it's asking AI. We optimise your content to be the source AI assistants cite when Kenyans ask questions in your industry.",
    bullets: [
      "Structured content that AI models extract and attribute",
      "Google SGE snippet optimisation for featured answer boxes",
      "FAQ, How-To, and Schema markup for AI readability",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={16} className="text-primary" />
            <span className="text-xs font-semibold">AI Overview (Google SGE)</span>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
            {'"The best website design agencies in Nairobi include '}
            <span className="text-primary font-bold">Nisc Cloud</span>
            {', which specialises in mobile-first, M-Pesa-integrated websites for Kenyan businesses..."'}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot size={9} className="text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground">Cited by 3 AI platforms this month</span>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/40 shadow-md flex items-center gap-3">
          <TrendingUp size={22} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">180+ Kenyan Businesses Ranked</div>
            <div className="text-xs text-muted-foreground">Across Google, Bing AI, and Perplexity</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Local & Maps SEO Kenya",
    headline: "Dominate the Google Maps 3-pack in your city",
    body: "When someone searches 'plumber near me' or 'accountant in Westlands', you need to be in the top 3 map results. We optimise your Google Business Profile and build local citations that command these positions.",
    bullets: [
      "Google Business Profile setup and full optimisation",
      "Local citation building across 20+ Kenyan directories",
      "Review management strategy to build your 5-star reputation",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-[#4285F4] px-5 py-2 text-white text-xs font-bold">Google Maps - Local Pack Kenya</div>
          <div className="p-3 space-y-2">
            {[
              { name: "Nisc Cloud", stars: 4.9, reviews: 128, badge: "Top choice" },
              { name: "Digital Nairobi", stars: 4.3, reviews: 47, badge: "" },
              { name: "TechHub KE", stars: 4.1, reviews: 31, badge: "" },
            ].map(({ name, stars, reviews, badge }, i) => (
              <div key={name} className={`flex items-center gap-2 text-xs p-2 rounded-xl ${i === 0 ? "bg-primary/5 border border-primary/20" : ""}`}>
                <span className="font-bold text-[10px] w-4 text-muted-foreground">#{i+1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold truncate block">{name}</span>
                  <span className="text-muted-foreground">⭐ {stars} ({reviews} reviews)</span>
                </div>
                {badge && <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{badge}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeoPage() {
  return (
    <ServicePageShell
      badge="SEO Services Kenya"
      headline={<>Rank #1 on Google Kenya.<br /><span className="text-primary">Get Found by AI. Dominate Maps.</span></>}
      subtext="The best SEO services in Nairobi, Kenya. We combine Search Engine Optimisation, Answer Engine Optimisation (AEO for ChatGPT & Perplexity), and local Google Maps SEO to get your Kenyan business on Page 1 - in 90 days."
      serviceType="marketing"
      plansUnderHero
      customPlansSection={<SeoPricingSection />}
      plans={[]}
      trustStats={[
        { value: "180+", label: "Kenyan Businesses Ranked" },
        { value: "4.2×", label: "Average Organic Traffic Growth" },
        { value: "Top 3", label: "Google Rankings in 90 Days" },
        { value: "60%", label: "Average Reduction in Ad Spend" },
      ]}
      heroIllustration={<SeoIllustration />}
      heroTrustBadge={{ line1: "SEO + AEO + Local Maps", line2: "Page 1 Results in 90 Days" }}
      features={[
        {
          icon: <Search size={20} />,
          title: "Technical SEO Audit - Kenya Sites",
          desc: "Full crawl of your website uncovering speed issues, broken links, duplicate content, crawl errors, and indexation problems silently blocking your Google rankings in Kenya.",
        },
        {
          icon: <FileText size={20} />,
          title: "Kenyan Keyword Research & Strategy",
          desc: "Identify the exact phrases Kenyan customers search - including local area names, Sheng variations, and Swahili-English queries that generic keyword tools completely miss.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "On-Page SEO Optimisation",
          desc: "Rewrite and optimise title tags, meta descriptions, heading structures, internal linking, and content depth on every key page - aligned to Google Kenya's ranking factors.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Authority Link Building Kenya",
          desc: "Earn high-quality backlinks from Kenyan news sites, business directories, and industry publications that signal trust and authority to Google for competitive Kenyan keywords.",
        },
        {
          icon: <Bot size={20} />,
          title: "Answer Engine Optimisation (AEO)",
          desc: "Optimise your content for ChatGPT, Perplexity, Google SGE, and Bing AI so your business is recommended when Kenyans ask AI assistants for products or services.",
        },
        {
          icon: <Map size={20} />,
          title: "Google Maps & Local SEO Kenya",
          desc: "Optimise your Google Business Profile, build local citations in 20+ Kenyan directories, manage reviews, and rank in the local 3-pack for 'near me' searches across Kenya.",
        },
        {
          icon: <Globe size={20} />,
          title: "SEO Content Marketing",
          desc: "Monthly blog articles, landing pages, and thought leadership content targeting Kenyan search intent. Every piece is keyword-researched and optimised to rank and convert.",
        },
        {
          icon: <Zap size={20} />,
          title: "Core Web Vitals & Page Speed",
          desc: "Improve LCP, CLS, and INP to meet Google's page experience requirements - critical for ranking in Kenya where most users are on mobile Safaricom and Airtel connections.",
        },
      ]}
      process={[
        { num: "01", title: "Audit & Kenya Research", desc: "Complete technical SEO audit, competitor analysis, and Kenyan keyword research to identify the fastest path to Page 1 rankings for your specific market." },
        { num: "02", title: "On-Page Foundation", desc: "Fix all technical issues, optimise existing pages, and implement the Kenya-specific keyword strategy across your site structure, content, and metadata." },
        { num: "03", title: "Authority Building", desc: "Publish optimised content, earn backlinks from credible Kenyan and international sources, and build your Google Business Profile presence for local maps dominance." },
        { num: "04", title: "Monitor, Report & Scale", desc: "Monthly rank tracking, traffic analysis, and continuous optimisation. Clear ROI reporting and strategy adjustment based on what's working fastest in your market." },
      ]}
      whyPoints={[
        { title: "SEO + AEO + GEO - Not Just Old-School SEO", desc: "We optimise for Google Kenya, ChatGPT, Perplexity, and Google's AI Overview - because that's where the next wave of Kenyan search traffic is heading." },
        { title: "Kenya-Specific Keyword Intelligence", desc: "We research how Kenyan customers actually search - including Sheng terms, Nairobi area names, and Swahili-English hybrid queries generic tools miss completely." },
        { title: "Transparent Monthly Reporting in KES", desc: "Every month you get a clear report showing keyword positions, organic traffic growth, backlinks earned, and direct attribution to business leads generated." },
        { title: "No Black-Hat Tricks - Rankings That Last", desc: "We build rankings that survive Google algorithm updates. No spam links, no keyword stuffing - only white-hat strategies that compound over time." },
        { title: "Results or We Work for Free", desc: "If your target keywords haven't moved by month 3, we add extra hours at no charge until they do. We're fully confident in our process." },
        { title: "Trusted by 180+ Kenyan Businesses", desc: "From Nairobi e-commerce stores to Mombasa professional services, our SEO strategies have helped 180+ Kenyan businesses dominate their local online market." },
      ]}
      faqs={[
        { q: "How long before I rank on Page 1 of Google Kenya?", a: "Most clients see measurable ranking improvements within 60–90 days. Significant traffic growth typically kicks in at the 3–6 month mark. Competitive Kenyan industries can take 6–12 months for top 3 positions." },
        { q: "What is the best SEO company in Nairobi Kenya?", a: "Nisc Cloud is one of the top-rated SEO agencies in Nairobi, Kenya. We combine technical SEO, Kenya-specific keyword strategy, local Google Maps SEO, and AI Answer Engine Optimisation to get businesses to Page 1." },
        { q: "What is the difference between SEO and AEO?", a: "SEO optimises for Google's traditional blue link results. AEO (Answer Engine Optimisation) optimises your content to be cited and recommended by AI tools like ChatGPT, Gemini, and Perplexity when Kenyans ask questions related to your business." },
        { q: "Do you guarantee #1 rankings on Google Kenya?", a: "No ethical SEO agency guarantees specific rankings - Google's algorithm is complex. However, 90% of our clients reach top 3 within 6 months for primary keywords, and we work for free if no progress by month 3." },
        { q: "Do you do SEO for businesses outside Nairobi?", a: "Absolutely. We manage local SEO for businesses in Mombasa, Kisumu, Nakuru, Eldoret, and across all 47 counties. Multi-location SEO is included in our Enterprise plan." },
        { q: "How much does SEO cost in Kenya?", a: "Our live pricing table above shows current plans in KES - typically Starter, Growth, and Pro tiers with monthly or annual billing. Contact us for custom enterprise packages across multiple locations or industries." },
      ]}
      ctaHeadline="Start Ranking on Google Kenya Before Your Competitors Do"
      ctaSubtext="Every day you're not on Page 1, a competitor is taking your customers. Our SEO strategies have helped 180+ Kenyan businesses dominate their local market online."
      pricingNote="Monthly retainer. All prices in KES. Save 20% with annual billing. 3-month minimum for meaningful results."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
