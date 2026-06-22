import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Share2, Users, Calendar, Camera, TrendingUp, MessageSquare, BarChart2, Star } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Content Performance",
    headline: "Content that builds community, not just followers",
    body: "We don't chase vanity metrics. Every post is crafted to generate real engagement - comments, shares, DMs, and ultimately paying customers. Our average client achieves 8.4% engagement rate vs industry average of 1.2%.",
    bullets: [
      "Full monthly content calendar approved before anything publishes",
      "Platform-native formats - Reels, carousels, Stories, TikToks",
      "Posting times optimised for when your Kenyan audience is online",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Monthly Social Report</div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[["Followers","↑ 820"],["Reach","48,200"],["Engagement","8.4%"]].map(([l,v]) => (
                <div key={l} className="text-center">
                  <div className={`text-lg font-extrabold ${v.startsWith("↑") ? "text-green-500" : "text-primary"}`}>{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {[["Video Reels","42%"],["Carousel Posts","31%"],["Stories","27%"]].map(([type, pct]) => (
                <div key={type}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-semibold">{pct}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: pct }} />
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
    body: "We manage your inbox 7 days a week in your brand voice. Fast, professional responses build customer loyalty and prevent the silent damage of ignored messages.",
    bullets: [
      "All DMs, comments, and mentions monitored and replied",
      "Review management across Google, Facebook, and TrustPilot",
      "Crisis escalation protocol - we alert you before it goes public",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Response Dashboard</div>
          <div className="space-y-2.5">
            {[
              { user: "Janet M.", msg: "Do you deliver to Mombasa?", time: "2m ago", status: "replied" },
              { user: "Brian K.", msg: "Amazing service! 5 stars ⭐", time: "8m ago", status: "replied" },
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
      </div>
    ),
  },
];

export default function SocialMediaPage() {
  return (
    <ServicePageShell
      badge="Social Media Management"
      headline={<>Build a Following.<br /><span className="text-primary">Build a Business.</span></>}
      subtext="Posting randomly on social media doesn't grow businesses. We manage your Facebook, Instagram, LinkedIn, TikTok, and X - with a data-driven content strategy that builds community, drives engagement, and converts followers into paying customers."
      serviceType="marketing"
      checkoutServiceType="social_media"
      checkoutProductName="Social Media"
      trustStats={[
        { value: "350+", label: "Kenyan Brands Managed" },
        { value: "2.8M+", label: "Followers Grown for Clients" },
        { value: "8.4%", label: "Average Engagement Rate" },
        { value: "45%", label: "More Leads via Social" },
      ]}
      features={[
        {
          icon: <Calendar size={20} />,
          title: "Strategic Content Calendar",
          desc: "Monthly content plan built around your brand, Kenyan cultural moments, industry trends, and your specific business goals - approved by you before publishing.",
        },
        {
          icon: <Camera size={20} />,
          title: "Professional Content Creation",
          desc: "Designed graphics, carousel posts, story templates, and short-form video scripts - all branded, high-quality, and optimised for each platform's algorithm.",
        },
        {
          icon: <Share2 size={20} />,
          title: "Multi-Platform Management",
          desc: "We manage Facebook, Instagram, LinkedIn, TikTok, and X from a single strategy. Consistent messaging, platform-native formats, and cross-platform amplification.",
        },
        {
          icon: <MessageSquare size={20} />,
          title: "Community Management",
          desc: "We monitor and respond to comments, DMs, and reviews in your brand voice - building genuine relationships with your audience 7 days a week.",
        },
        {
          icon: <TrendingUp size={20} />,
          title: "Hashtag & Algorithm Strategy",
          desc: "Research-based hashtag sets, posting time optimisation, and engagement-first tactics that work with each platform's algorithm to maximise organic reach.",
        },
        {
          icon: <Users size={20} />,
          title: "Audience Growth Campaigns",
          desc: "Targeted follower growth through engagement campaigns, collaborations, and content that attracts the right audience - real Kenyan people, not bot followers.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Monthly Analytics Reports",
          desc: "Clear monthly reports showing follower growth, reach, engagement rate, best-performing content, and social media's contribution to website traffic and leads.",
        },
        {
          icon: <Star size={20} />,
          title: "Reputation & Review Management",
          desc: "Monitor and respond to Google, Facebook, and TrustPilot reviews. Build a 5-star reputation that converts new customers before they ever contact you.",
        },
      ]}
      plans={[
        {
          id: "social-essential",
          name: "Brand Presence",
          price: 20000,
          period: "month",
          features: [
            "2 platforms (Facebook + Instagram)",
            "12 posts/month",
            "Branded graphic templates",
            "Content calendar (monthly)",
            "Basic community management",
            "Monthly analytics report",
            "Hashtag strategy",
            "Story posts (8/month)",
          ],
        },
        {
          id: "social-growth-popular",
          name: "Growth Engine",
          price: 40000,
          period: "month",
          features: [
            "4 platforms (Facebook, Instagram, LinkedIn, X)",
            "20 posts/month across platforms",
            "Custom designed content (no templates)",
            "Short-form video (4 Reels/TikToks per month)",
            "Full community management (7 days)",
            "Influencer outreach (2/month)",
            "Bi-weekly strategy sessions",
            "Competitor benchmarking",
            "Detailed monthly analytics report",
          ],
        },
        {
          id: "social-enterprise",
          name: "Market Authority",
          price: 75000,
          period: "month",
          features: [
            "All platforms including TikTok",
            "Unlimited posts across all channels",
            "Full video production (8 videos/month)",
            "Dedicated social media manager",
            "Paid social integration (boosting strategy)",
            "Influencer campaign management",
            "Crisis communication protocol",
            "UGC strategy and management",
            "Weekly reporting + calls",
            "PR and press mention monitoring",
          ],
        },
      ]}
      addons={[
        { id: "social-photoshoot", label: "Monthly Content Photoshoot (Half-Day)", price: 25000, period: "month" },
        { id: "social-reels", label: "Extra 4 Short-Form Videos", price: 15000, period: "month" },
        { id: "social-ads", label: "Social Media Ad Boosting Management", price: 15000, period: "month" },
      ]}
      process={[
        { num: "01", title: "Brand & Audience Audit", desc: "We review your existing social presence, analyse your target audience, study your top competitors, and identify the content opportunities that will grow your business fastest." },
        { num: "02", title: "Strategy & Content Plan", desc: "Build your 30-day content calendar including post types, topics, visual style, hashtag strategy, and posting schedule - all approved by you before we publish anything." },
        { num: "03", title: "Create & Publish", desc: "Our designers and copywriters produce all content. We schedule everything via a professional tool, engage with your community daily, and adapt to trending moments in real-time." },
        { num: "04", title: "Analyse & Improve", desc: "Monthly deep-dive into performance data. We identify what content drove the most reach, engagement, and leads - then optimise the next month's strategy accordingly." },
      ]}
      whyPoints={[
        { title: "Kenya-Fluent Content", desc: "We know Kenyan culture, trending topics, public holidays, and the type of content that resonates with Nairobi, Mombasa, Kisumu, and Kenyan diaspora audiences." },
        { title: "Real Engagement, Not Vanity Metrics", desc: "We don't chase likes. We build communities that comment, share, DM, and ultimately become customers. Engagement rate is our most important metric." },
        { title: "Dedicated Account Manager", desc: "You have one person who knows your brand inside out - not a rotating team of juniors. Consistent quality and a direct communication channel always." },
        { title: "Content Approved Before Publishing", desc: "You review and approve the full month's content before anything goes live. Brand safety and message accuracy are always in your control." },
        { title: "We Handle Everything", desc: "Strategy, design, copywriting, scheduling, community management, reporting - you don't need to think about social media at all. We've got it." },
        { title: "Platform Algorithm Experts", desc: "Instagram, TikTok, LinkedIn, and Facebook algorithms change constantly. Our team tracks every update and adjusts content strategy to maintain reach without paying for every impression." },
      ]}
      faqs={[
        { q: "Will you post content without my approval?", a: "Never. We create the full monthly content calendar and share it with you for review and approval at least 5 days before the first post of the month. You can request changes before anything is published." },
        { q: "How do you create content if you don't know my business?", a: "We start with a comprehensive onboarding session where we learn your brand voice, target customer, key messages, and business goals. We also conduct ongoing research into your industry and competitors." },
        { q: "Can you manage our WhatsApp Business account too?", a: "WhatsApp Business management is available as a custom add-on for Enterprise clients. We manage broadcast lists, automated responses, and customer communication flows." },
        { q: "Do you respond to negative comments or complaints?", a: "Yes. Community management includes responding to all comments and DMs including negative ones - in a professional, brand-consistent way. For serious issues, we escalate to you before responding." },
        { q: "How long before we see follower growth?", a: "Organic follower growth is steady - expect 200–500 new targeted followers per month in the first 3 months, accelerating as content quality compounds. Growth spikes when combined with our paid ads service." },
        { q: "What platforms do you support?", a: "We manage Facebook, Instagram, LinkedIn, TikTok, X (Twitter), YouTube (shorts), and Pinterest. Not every platform is right for every business - we recommend the best combination based on where your customers actually spend time." },
      ]}
      ctaHeadline="Let's Build a Social Presence That Generates Real Business"
      ctaSubtext="Your customers are on social media right now. The question is whether they're seeing your content - or your competitor's. Let's fix that."
      pricingNote="Monthly retainer. Content approval included. Cancel with 30-day notice."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
