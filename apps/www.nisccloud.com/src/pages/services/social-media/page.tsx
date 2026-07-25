import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Share2, Users, Calendar, Camera, TrendingUp, MessageSquare, BarChart2, Star, CheckCircle2 } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Content Performance",
    headline: "Content that builds community, not just followers",
    body: "We do not chase empty metrics. Every post is crafted to generate real engagement: comments, shares, DMs, and ultimately paying customers. Clear monthly reporting shows what worked.",
    bullets: [
      "Full monthly content calendar approved before anything publishes",
      "Platform-native formats: Reels, carousels, Stories, TikToks",
      "Posting times tuned for when your audience is online",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Monthly Social Report</div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[["Reach","Tracked"],["Engagement","Measured"],["Leads","Reported"]].map(([l,v]) => (
                <div key={l} className="text-center">
                  <div className="text-lg font-extrabold text-primary">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {[["Video Reels","Strong"],["Carousel Posts","Steady"],["Stories","Active"]].map(([type, pct]) => (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-semibold">{pct}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "70%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Community Management",
    headline: "Every comment replied to. Every DM answered.",
    body: "We manage your inbox in your brand voice. Fast, professional responses build customer loyalty and prevent the silent damage of ignored messages.",
    bullets: [
      "All DMs, comments, and mentions monitored and replied",
      "Review management across Google, Facebook, and TrustPilot",
      "Crisis escalation protocol: we alert you before it goes public",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Response Dashboard</div>
          <div className="space-y-2.5">
            {[
              { user: "Janet M.", msg: "Do you deliver to Mombasa?", time: "2m ago", status: "replied" },
              { user: "Brian K.", msg: "Amazing service! 5 stars", time: "8m ago", status: "replied" },
              { user: "Aisha R.", msg: "What are your prices?", time: "12m ago", status: "pending" },
            ].map(({ user, msg, time, status }) => (
              <div key={user} className="flex items-start gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-[10px]">
                  {user[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-0.5">
                    <span className="font-semibold">{user}</span>
                    <span className="text-muted-foreground">{time}</span>
                  </div>
                  <div className="text-muted-foreground truncate">{msg}</div>
                </div>
                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${status === "replied" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/40 shadow flex items-center gap-3">
          <CheckCircle2 size={20} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">24/7 support available</div>
            <div className="text-xs text-muted-foreground">Community replies handled for you</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function SocialMediaPage() {
  return (
    <ServicePageShell
      badge="Social Media Management"
      headline={<>Build a Following.<br /><span className="text-primary">Build a Business.</span></>}
      subtext="Posting randomly on social media does not grow businesses. We manage your Facebook, Instagram, LinkedIn, TikTok, and X with a clear content strategy that builds community, drives engagement, and turns followers into customers."
      serviceType="marketing"
      checkoutServiceType="social_media"
      checkoutProductName="Social Media"
      heroImage={niscWebsiteImage("Social media marketing.png")}
      heroImageStandalone
      trustStats={[
        { value: "100+", label: "Clients We Have Helped" },
        { value: "24/7", label: "Support Available" },
        { value: "30 days", label: "Results Promise" },
        { value: "Clear", label: "Monthly Reporting" },
      ]}
      features={[
        {
          icon: <Calendar size={20} />,
          title: "Strategic Content Calendar",
          desc: "Monthly content plan built around your brand, cultural moments, industry trends, and business goals, approved by you before publishing.",
        },
        {
          icon: <Camera size={20} />,
          title: "Professional Content Creation",
          desc: "Designed graphics, carousel posts, story templates, and short-form video scripts: branded, high-quality, and tuned for each platform.",
        },
        {
          icon: <Share2 size={20} />,
          title: "Multi-Platform Management",
          desc: "We manage Facebook, Instagram, LinkedIn, TikTok, and X from a single strategy. Consistent messaging, platform-native formats, and cross-platform amplification.",
        },
        {
          icon: <MessageSquare size={20} />,
          title: "Community Management",
          desc: "We monitor and respond to comments, DMs, and reviews in your brand voice, building genuine relationships with your audience.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "Hashtag & Algorithm Strategy",
          desc: "Research-based hashtag sets, posting time optimisation, and engagement-first tactics that work with each platform's algorithm.",
        },
        {
          icon: <Users size={20} />,
          title: "Audience Growth Campaigns",
          desc: "Targeted follower growth through engagement campaigns, collaborations, and content that attracts the right audience: real people, not bots.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Monthly Analytics Reports",
          desc: "Clear monthly reports showing follower growth, reach, engagement, best-performing content, and social media's contribution to website traffic and leads.",
        },
        {
          icon: <Star size={20} />,
          title: "Reputation & Review Management",
          desc: "Monitor and respond to Google, Facebook, and TrustPilot reviews. Build a strong reputation that converts new customers before they contact you.",
        },
      ]}
      plans={[
        {
          id: "social-essential",
          name: "Brand Presence",
          price: 20000,
          period: "month",
          features: [
            "Facebook + Instagram management",
            "12 branded posts per month",
            "Monthly content calendar",
            "Community management",
            "Hashtag & reach strategy",
            "Monthly analytics report",
          ],
        },
        {
          id: "social-enterprise",
          name: "Market Authority",
          price: 75000,
          period: "month",
          features: [
            "All major platforms including TikTok",
            "Unlimited posts + 8 videos/month",
            "Dedicated social media manager",
            "Influencer campaign management",
            "Paid social boosting strategy",
            "Weekly reporting & strategy calls",
          ],
        },
      ]}
      addons={[
        { id: "social-photoshoot", label: "Monthly Content Photoshoot (Half-Day)", price: 25000, period: "month" },
        { id: "social-reels", label: "Extra 4 Short-Form Videos", price: 15000, period: "month" },
        { id: "social-ads", label: "Social Media Ad Boosting Management", price: 15000, period: "month" },
      ]}
      process={[
        { num: "01", title: "Brand & Audience Audit", desc: "We review your existing social presence, analyse your target audience, study competitors, and identify content opportunities that will grow your business." },
        { num: "02", title: "Strategy & Content Plan", desc: "Build your 30-day content calendar including post types, topics, visual style, hashtag strategy, and posting schedule, all approved by you before we publish." },
        { num: "03", title: "Create & Publish", desc: "Our designers and copywriters produce all content. We schedule everything, engage with your community daily, and adapt to trending moments when useful." },
        { num: "04", title: "Analyse & Improve", desc: "Monthly deep-dive into performance data. We identify what drove the most reach, engagement, and leads, then improve next month's strategy." },
      ]}
      whyPoints={[
        { title: "Local-Fluent Content", desc: "We know local culture, trending topics, public holidays, and the type of content that resonates with audiences across Kenya and the diaspora.", visual: "localMarket" },
        { title: "Real Engagement, Not Empty Metrics", desc: "We do not chase likes alone. We build communities that comment, share, DM, and become customers. Engagement quality matters most.", visual: "engagement" },
        { title: "Dedicated Account Manager", desc: "You have one person who knows your brand inside out, not a rotating team. Consistent quality and a direct communication channel.", visual: "support" },
        { title: "Content Approved Before Publishing", desc: "You review and approve the full month's content before anything goes live. Brand safety and message accuracy stay in your control.", visual: "approval" },
        { title: "We Handle Everything", desc: "Strategy, design, copywriting, scheduling, community management, reporting. You do not need to think about social media day to day.", visual: "calendar" },
        { title: "Platform Algorithm Experts", desc: "Instagram, TikTok, LinkedIn, and Facebook algorithms change constantly. Our team tracks updates and adjusts content strategy to maintain reach.", visual: "algorithm" },
      ]}
      faqs={[
        { q: "Will you post content without my approval?", a: "Never. We create the full monthly content calendar and share it with you for review and approval at least 5 days before the first post of the month. You can request changes before anything is published." },
        { q: "How do you create content if you don't know my business?", a: "We start with a comprehensive onboarding session where we learn your brand voice, target customer, key messages, and business goals. We also research your industry and competitors ongoing." },
        { q: "Can you manage our WhatsApp Business account too?", a: "WhatsApp Business management is available as a custom add-on for Enterprise clients. We manage broadcast lists, automated responses, and customer communication flows." },
        { q: "Do you respond to negative comments or complaints?", a: "Yes. Community management includes responding to all comments and DMs including negative ones, in a professional, brand-consistent way. For serious issues, we escalate to you before responding." },
        { q: "How long before we see growth?", a: "Organic growth is steady. Expect meaningful progress within the first 30 days of active work, with stronger compounding over the next few months. Growth often accelerates when combined with paid ads." },
        { q: "What platforms do you support?", a: "We manage Facebook, Instagram, LinkedIn, TikTok, X (Twitter), YouTube Shorts, and Pinterest. Not every platform is right for every business. We recommend the best combination based on where your customers spend time." },
      ]}
      ctaHeadline="Let's Build a Social Presence That Generates Real Business"
      ctaSubtext="Your customers are on social media right now. We help them see useful content from you, with clear reporting and a 30-day results promise on active work."
      pricingNote="Monthly retainer. Content approval included. Cancel with 30-day notice."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
