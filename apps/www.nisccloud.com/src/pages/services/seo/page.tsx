import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { BarChart2, TrendingUp, Search, Globe, Bot, Map, FileText, Zap } from "lucide-react";
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
    visual: "reporting",
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
    visual: "bot",
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
    visual: "maps",
  },
];

export default function SeoPage() {
  return (
    <ServicePageShell
      badge="SEO Services"
      headline={<>Help People Find You on <br /><span className="text-primary">Google, Maps & AI Answers</span></>}
      subtext="We combine Search Engine Optimisation, Answer Engine Optimisation for AI tools, and local Maps SEO so more of the right people can discover your business. Clear reporting, and a free strategy call before you commit."
      serviceType="marketing"
      plansUnderHero
      customPlansSection={<SeoPricingSection />}
      plans={[]}
      trustStats={[
        { value: "Monthly", label: "Transparent Reporting" },
        { value: "Local", label: "Search Focus" },
        { value: "Free", label: "Strategy Call" },
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
        { title: "SEO + AEO + Local Search Together", desc: "We optimise for Google, Maps, and AI answer tools, because that is where more discovery is heading.", visual: "maps" },
        { title: "Local Search Understanding", desc: "We research how customers actually search, including local area names and everyday phrasing that generic tools miss.", visual: "localMarket" },
        { title: "Transparent Monthly Reporting", desc: "Every month you get a clear report showing keyword positions, organic traffic, backlinks earned, and how that connects to leads.", visual: "reporting" },
        { title: "No Black-Hat Tricks", desc: "We build visibility that can survive algorithm updates. No spam links, no keyword stuffing. Only strategies that compound over time.", visual: "ethical" },
        { title: "See the Opportunity First", desc: "Book a free strategy call. We review where you rank today, the searches your customers use and the quickest wins, then send a clear proposal before you commit.", visual: "results" },
        { title: "Built for Local Businesses", desc: "From e-commerce stores to professional services, we help businesses get found by the people looking for what they offer.", visual: "clarity" },
      ]}
      faqs={[
        { q: "How long before I see better visibility on Google?", a: "Most clients see measurable ranking improvements within 60 to 90 days. Stronger traffic growth typically builds at the 3 to 6 month mark. Competitive industries can take longer for top positions." },
        { q: "Who do you help with SEO?", a: "We help businesses that want to get found on Google, Maps, and AI answer tools. We combine technical SEO, local keyword strategy, Maps optimisation, and Answer Engine Optimisation." },
        { q: "What is the difference between SEO and AEO?", a: "SEO optimises for traditional search results. AEO (Answer Engine Optimisation) helps your content get cited and recommended by AI tools like ChatGPT, Gemini, and Perplexity when people ask questions related to your business." },
        { q: "Do you guarantee specific rankings?", a: "No. Search algorithms, competitors and generative systems change, so no provider can guarantee a position or an AI citation. We commit to the approved scope, clear reporting and work aimed at measurable improvement." },
        { q: "Do you do SEO for businesses outside major cities?", a: "Yes. We manage local SEO across Kenya, including multi-location work on our Enterprise plan." },
        { q: "How much does SEO cost?", a: "Our live pricing table above shows current plans in KES, typically with monthly or annual billing. Contact us for custom packages across multiple locations or industries." },
      ]}
      ctaHeadline="Start Getting Found Where Customers Search"
      ctaSubtext="We help people find you on Google, Maps, and AI answers, with clear monthly reporting. Start with a free strategy call and see your quickest wins."
      pricingNote="Monthly retainer. All prices in KES. 3-month minimum for meaningful results."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
