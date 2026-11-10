import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { BarChart2, TrendingUp, Search, Globe, Bot, Map, FileText, Zap } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { SeoPricingSection } from "./_components/SeoPricingSection.tsx";
import { SeoStory } from "@/components/artwork/npanel-stories";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Keyword Rank Tracking",
    artwork: <SeoStory />,
    caption: false,
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
      subtext="Build a stronger search foundation across traditional results, answer engines and local discovery. We define the scope, show the work and measure observed performance without promising rankings or AI citations."
      serviceType="marketing"
      plansUnderHero
      customPlansSection={<SeoPricingSection />}
      plans={[]}
      trustStats={[
        { value: "3", label: "Search Disciplines" },
        { value: "Human", label: "Reviewed Work" },
        { value: "Free", label: "Strategy Call" },
        { value: "Monthly", label: "Review Cadence" },
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
        { title: "One Search Foundation", desc: "Technical health, useful answers and accurate business information support traditional search, answer engines and local discovery.", visual: "maps" },
        { title: "Work Prioritised by Intent", desc: "We connect search demand to the pages and customer actions that matter instead of chasing keywords in isolation.", visual: "localMarket" },
        { title: "Evidence Before Expansion", desc: "Reporting separates activity, visibility, traffic and conversion signals so the next priorities are based on observed performance.", visual: "reporting" },
        { title: "No Black-Hat Tricks", desc: "We build visibility that can survive algorithm updates. No spam links, no keyword stuffing. Only strategies that compound over time.", visual: "ethical" },
      ]}
      faqs={[
        { q: "How long before I see better visibility on Google?", a: "Timing depends on the site, competition, technical issues, content and search demand. We establish a baseline, report observed changes and adjust priorities over time rather than promise a fixed result date." },
        { q: "Who do you help with SEO?", a: "We help businesses that want to get found on Google, Maps, and AI answer tools. We combine technical SEO, local keyword strategy, Maps optimisation, and Answer Engine Optimisation." },
        { q: "What is the difference between SEO and AEO?", a: "SEO optimises for traditional search results. AEO (Answer Engine Optimisation) helps your content get cited and recommended by AI tools like ChatGPT, Gemini, and Perplexity when people ask questions related to your business." },
        { q: "Do you guarantee specific rankings?", a: "No. Search algorithms, competitors and generative systems change, so no provider can guarantee a position or an AI citation. We commit to the approved scope, clear reporting and work aimed at measurable improvement." },
        { q: "Do you do SEO for businesses outside major cities?", a: "Yes. We manage local SEO across Kenya, including multi-location work on our Enterprise plan." },
        { q: "How much does SEO cost?", a: "Our live pricing table above shows current plans in KES, typically with monthly or annual billing. Contact us for custom packages across multiple locations or industries." },
      ]}
      ctaHeadline="Start Getting Found Where Customers Search"
      ctaSubtext="Start with a review of your current search foundation, buyer questions and measurement needs. We will recommend a scoped next step."
      pricingNote="Monthly retainer. Prices are shown in your selected currency. 3-month minimum for meaningful results."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
