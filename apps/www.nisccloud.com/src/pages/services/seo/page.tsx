import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { BarChart2, TrendingUp, Search, Globe, Bot, Map, FileText, Zap, CheckCircle2 } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { SeoPricingSection } from "./_components/SeoPricingSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Keyword Rank Tracking",
    headline: "See which search terms bring people to you",
    body: "We track your target keywords and send you a plain-English report every month showing which positions improved, which pages earned traffic, and where we are focusing next.",
    bullets: [
      "Weekly ranking updates for all target keywords",
      "Google Search Console integration and full management",
      "Competitor keyword gap analysis every quarter",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Keyword Tracking</div>
          <div className="p-4 space-y-2">
            {[
              { kw: "website design kenya", note: "Improving" },
              { kw: "branding agency kenya", note: "Tracking" },
              { kw: "seo services kenya", note: "Improving" },
              { kw: "digital marketing kenya", note: "Tracking" },
            ].map(({ kw, note }) => (
              <div key={kw} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground truncate max-w-[160px]">{kw}</span>
                <span className="font-semibold text-primary">{note}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">30 days</div>
            <div className="text-[10px] text-muted-foreground">Results promise</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">Clear</div>
            <div className="text-[10px] text-muted-foreground">Monthly reporting</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Answer Engine Optimisation",
    headline: "Get found in Google, Maps, and AI answers",
    body: "Search is changing. People still use Google, but they also ask AI tools for recommendations. We help your content show up where customers look for answers.",
    bullets: [
      "Structured content that AI models can extract and attribute",
      "Snippet-friendly formatting for featured answer boxes",
      "FAQ, How-To, and Schema markup for clearer answers",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Bot size={16} className="text-primary" />
            <span className="text-xs font-semibold">AI Overview</span>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground leading-relaxed">
            Content structured so assistants can cite your business when people ask about services in your industry.
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot size={9} className="text-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground">Google · Maps · AI answers</span>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/40 shadow-md flex items-center gap-3">
          <CheckCircle2 size={22} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">100+ clients supported</div>
            <div className="text-xs text-muted-foreground">Clear reporting every month</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Local & Maps SEO",
    headline: "Show up when people search nearby",
    body: "When someone searches for a service near them, you want to appear in local results and on Maps. We optimise your Google Business Profile and build local citations that support those searches.",
    bullets: [
      "Google Business Profile setup and full optimisation",
      "Local citation building across relevant directories",
      "Review management strategy to build a strong reputation",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-[#4285F4] px-5 py-2 text-white text-xs font-bold">Google Maps · Local Results</div>
          <div className="p-3 space-y-2">
            {[
              { name: "Your Business", note: "Profile optimised" },
              { name: "Reviews", note: "Response plan ready" },
              { name: "Citations", note: "Directories updated" },
            ].map(({ name, note }) => (
              <div key={name} className="flex items-center gap-2 text-xs p-2 rounded-xl bg-primary/5 border border-primary/20">
                <CheckCircle2 size={12} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-semibold truncate block">{name}</span>
                  <span className="text-muted-foreground">{note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export default function SeoPage() {
  return (
    <ServicePageShell
      badge="SEO Services"
      headline={<>Help People Find You on<br /><span className="text-primary">Google, Maps & AI Answers</span></>}
      subtext="We combine Search Engine Optimisation, Answer Engine Optimisation for AI tools, and local Maps SEO so more of the right people can discover your business. Clear reporting and a 30-day results promise on active work."
      serviceType="marketing"
      plansUnderHero
      customPlansSection={<SeoPricingSection />}
      plans={[]}
      trustStats={[
        { value: "100+", label: "Clients We Have Helped" },
        { value: "24/7", label: "Support Available" },
        { value: "30 days", label: "Results Promise" },
        { value: "Clear", label: "Monthly Reporting" },
      ]}
      heroImage={niscWebsiteImage("seo-service.png")}
      heroImageStandalone
      features={[
        {
          icon: <Search size={20} />,
          title: "Technical SEO Audit",
          desc: "Full crawl of your website uncovering speed issues, broken links, duplicate content, crawl errors, and indexation problems that can block search visibility.",
        },
        {
          icon: <FileText size={20} />,
          title: "Keyword Research & Strategy",
          desc: "Identify the phrases customers actually search, including local area names and everyday language that generic keyword tools often miss.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "On-Page SEO Optimisation",
          desc: "Rewrite and optimise title tags, meta descriptions, heading structures, internal linking, and content depth on every key page.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Authority Link Building",
          desc: "Earn high-quality backlinks from news sites, business directories, and industry publications that signal trust to search engines.",
        },
        {
          icon: <Bot size={20} />,
          title: "Answer Engine Optimisation (AEO)",
          desc: "Optimise your content for ChatGPT, Perplexity, Google AI Overviews, and similar tools so your business can be recommended when people ask questions.",
        },
        {
          icon: <Map size={20} />,
          title: "Google Maps & Local SEO",
          desc: "Optimise your Google Business Profile, build local citations, manage reviews, and improve visibility for nearby searches.",
        },
        {
          icon: <Globe size={20} />,
          title: "SEO Content Marketing",
          desc: "Monthly blog articles, landing pages, and thought leadership content targeting real search intent. Every piece is researched and written to help people find and trust you.",
        },
        {
          icon: <Zap size={20} />,
          title: "Core Web Vitals & Page Speed",
          desc: "Improve LCP, CLS, and INP to meet page experience requirements. This matters especially for mobile visitors on everyday connections.",
        },
      ]}
      process={[
        { num: "01", title: "Audit & Research", desc: "Complete technical SEO audit, competitor analysis, and keyword research to identify the fastest useful path to better visibility." },
        { num: "02", title: "On-Page Foundation", desc: "Fix technical issues, optimise existing pages, and implement the keyword strategy across your site structure, content, and metadata." },
        { num: "03", title: "Authority Building", desc: "Publish useful content, earn credible backlinks, and strengthen your Google Business Profile presence for local searches." },
        { num: "04", title: "Monitor, Report & Scale", desc: "Monthly rank tracking, traffic analysis, and continuous optimisation. Clear reporting and strategy adjustments based on what is working." },
      ]}
      whyPoints={[
        { title: "SEO + AEO + Local Search Together", desc: "We optimise for Google, Maps, and AI answer tools, because that is where more discovery is heading." },
        { title: "Local Search Understanding", desc: "We research how customers actually search, including local area names and everyday phrasing that generic tools miss." },
        { title: "Transparent Monthly Reporting", desc: "Every month you get a clear report showing keyword positions, organic traffic, backlinks earned, and how that connects to leads." },
        { title: "No Black-Hat Tricks", desc: "We build visibility that can survive algorithm updates. No spam links, no keyword stuffing. Only strategies that compound over time." },
        { title: "30-Day Results Promise", desc: "On active SEO work, we focus on visible progress within 30 days. If target keywords have not moved by month 3, we add extra hours at no charge until they do." },
        { title: "Trusted by 100+ Clients", desc: "From e-commerce stores to professional services, we help businesses get found by the people looking for what they offer." },
      ]}
      faqs={[
        { q: "How long before I see better visibility on Google?", a: "Most clients see measurable ranking improvements within 60 to 90 days. Stronger traffic growth typically builds at the 3 to 6 month mark. Competitive industries can take longer for top positions." },
        { q: "Who do you help with SEO?", a: "We help businesses that want to get found on Google, Maps, and AI answer tools. We combine technical SEO, local keyword strategy, Maps optimisation, and Answer Engine Optimisation." },
        { q: "What is the difference between SEO and AEO?", a: "SEO optimises for traditional search results. AEO (Answer Engine Optimisation) helps your content get cited and recommended by AI tools like ChatGPT, Gemini, and Perplexity when people ask questions related to your business." },
        { q: "Do you guarantee specific rankings?", a: "No ethical SEO agency guarantees specific rankings. Search algorithms are complex. We commit to clear reporting, steady improvement, and extra work at no charge if there is no progress by month 3." },
        { q: "Do you do SEO for businesses outside major cities?", a: "Yes. We manage local SEO across Kenya, including multi-location work on our Enterprise plan." },
        { q: "How much does SEO cost?", a: "Our live pricing table above shows current plans in KES, typically with monthly or annual billing. Contact us for custom packages across multiple locations or industries." },
      ]}
      ctaHeadline="Start Getting Found Where Customers Search"
      ctaSubtext="We help people find you on Google, Maps, and AI answers, with clear monthly reporting and a 30-day results promise on active work."
      pricingNote="Monthly retainer. All prices in KES. Save 20% with annual billing. 3-month minimum for meaningful results."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
