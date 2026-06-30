import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { EmailMarketingPricingSection } from "@/pages/services/email-marketing/_components/EmailMarketingPricingSection.tsx";
import { Mail, Users, BarChart2, Zap, Target, RefreshCw, Shield, Inbox } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Campaign Analytics",
    headline: "Email that earns more than it costs",
    body: "Email delivers KES 380 back for every KES 10 spent - the highest ROI of any marketing channel. We design, write, and automate campaigns engineered to convert your list into recurring revenue.",
    bullets: [
      "Average 42% open rate vs industry standard of 21%",
      "A/B tested subject lines on every campaign send",
      "Automated welcome sequences that convert new subscribers instantly",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Campaign Report - May</div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[["Sent","5,200"],["Opened","42.8%"],["Clicked","18.4%"],["Revenue","KES 84,000"]].map(([l,v]) => (
                <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                  <div className="font-extrabold text-primary text-sm">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-1 h-10">
              {[42,55,38,60,72,58,80,76,88,84,90,92].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${h}%`, opacity: 0.3 + (i/12)*0.7 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Automation Flows",
    headline: "Your email list works while you sleep",
    body: "We build automated email sequences that respond to customer behaviour - new subscribers, abandoned carts, purchase anniversaries, and re-engagement - so the right message reaches each person at exactly the right moment.",
    bullets: [
      "7-touch welcome sequence for every new subscriber",
      "Abandoned cart recovery emails with personalised product pulls",
      "Behavioural triggers based on clicks, purchases, and site visits",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Automation Flow - Welcome Series</div>
          <div className="p-4 space-y-2.5">
            {[
              { step: "Day 0", action: "Welcome email + 10% discount code", status: "active" },
              { step: "Day 2", action: "Brand story + top 3 products", status: "active" },
              { step: "Day 5", action: "Customer testimonial showcase", status: "active" },
              { step: "Day 7", action: "Discount reminder - expires soon", status: "active" },
            ].map(({ step, action, status }) => (
              <div key={step} className="flex items-center gap-2.5 text-xs">
                <div className="w-14 shrink-0 text-primary font-bold">{step}</div>
                <div className="flex-1 truncate text-muted-foreground">{action}</div>
                <span className="bg-green-100 text-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export default function EmailMarketingPage() {
  return (
    <ServicePageShell
      badge="Email Marketing"
      headline={<>Turn Your Email List<br /><span className="text-primary">Into a Revenue Machine</span></>}
      subtext="Email still delivers the highest ROI of any marketing channel - KES 380 for every KES 10 spent. We design, write, and automate campaigns that convert subscribers into customers, and customers into loyal repeat buyers."
      serviceType="marketing"
      plansUnderHero
      customPlansSection={<EmailMarketingPricingSection />}
      plans={[]}
      trustStats={[
        { value: "42%", label: "Average Open Rate (2× industry)" },
        { value: "380×", label: "Average Email Marketing ROI" },
        { value: "5,000+", label: "Subscribers Managed" },
        { value: "99%", label: "Delivery Rate" },
      ]}
      features={[
        {
          icon: <Mail size={20} />,
          title: "Professional Email Design",
          desc: "Pixel-perfect HTML email templates designed for your brand. Mobile-responsive layouts tested across all major email clients - Gmail, Outlook, Apple Mail, and Android.",
        },
        {
          icon: <Users size={20} />,
          title: "Advanced Segmentation",
          desc: "Split your list by purchase history, engagement level, geography, and custom tags. The right message to the right subscriber increases clicks and revenue.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Automation Sequences",
          desc: "Welcome series, abandoned cart recovery, post-purchase follow-ups, and win-back campaigns - triggered automatically based on subscriber behaviour.",
        },
        {
          icon: <Target size={20} />,
          title: "A/B Subject Line Testing",
          desc: "Every campaign tests 2–3 subject lines on a subset of your list. The winner gets sent to everyone - maximising opens without extra effort.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Detailed Analytics & Reports",
          desc: "Track open rates, click rates, revenue per email, unsubscribes, and list growth. Monthly reports with actionable insights to improve each campaign.",
        },
        {
          icon: <Zap size={20} />,
          title: "Behavioural Triggers",
          desc: "Send emails based on what subscribers do - visited a product page, clicked a link, made a purchase. Behaviour-based emails convert 3× better than blasts.",
        },
        {
          icon: <Shield size={20} />,
          title: "Deliverability Management",
          desc: "We maintain pristine sender reputation via DKIM, SPF, DMARC, and IP warming. Your emails land in inboxes - not spam folders - at every major provider.",
        },
        {
          icon: <Inbox size={20} />,
          title: "List Hygiene & Cleaning",
          desc: "Monthly list cleaning removes bounced, inactive, and spam-flagged addresses. A clean list improves deliverability and reduces the cost per send.",
        },
      ]}
      process={[
        { num: "01", title: "List Audit & Strategy", desc: "We audit your existing list health, segment structure, and historical campaign performance to identify quick wins and build your 90-day email marketing strategy." },
        { num: "02", title: "Template & Automation Build", desc: "Design your branded email templates, build your welcome sequence, and configure all automation flows before the first campaign sends." },
        { num: "03", title: "Campaign Execution", desc: "Monthly campaigns planned, written, designed, and A/B tested. We manage everything - all you do is approve the final copy before it sends." },
        { num: "04", title: "Optimise & Scale", desc: "Monthly performance review identifies your best-performing content, highest-converting segments, and new automation opportunities to grow revenue month-on-month." },
      ]}
      whyPoints={[
        { title: "KES 380 ROI Per KES 10 Spent", desc: "Email marketing outperforms every other digital channel. We build strategies that maximise this ROI for Kenyan businesses specifically." },
        { title: "We Write Your Emails", desc: "Our copywriters craft every subject line and email body. You don't need to find time to write - we produce content in your brand voice after onboarding." },
        { title: "Segmentation That Actually Works", desc: "Most email lists are treated as one blob. We segment by behaviour, purchase history, and geography to send hyper-relevant messages that convert at 3× the industry average." },
        { title: "Automation Running 24/7", desc: "Once built, your automation flows work continuously. A subscriber joins at 2am on a Sunday and immediately enters your welcome sequence - no manual work required." },
        { title: "Deliverability First Infrastructure", desc: "We manage your sender reputation, list hygiene, and technical email configuration so your campaigns reach inboxes - not spam folders - at Gmail, Outlook, and beyond." },
        { title: "Transparent Reporting", desc: "Monthly reports show exactly what your email programme earned. Open rate, click rate, revenue attributed, and list growth - every number in plain English." },
      ]}
      faqs={[
        { q: "Do I need to already have an email list?", a: "No. We can help you build your list from scratch using your website, social media, and in-store channels. We'll set up lead magnets, sign-up forms, and list-building strategies alongside your campaigns." },
        { q: "What email platform do you use?", a: "We work with Mailchimp, Klaviyo, ActiveCampaign, and Brevo. We recommend the best platform for your business size and goals during onboarding. All platforms are well-supported in Kenya." },
        { q: "How do I get my email list to you?", a: "You export your existing contacts as a CSV and share it securely. We clean, import, and segment the list as part of our onboarding process." },
        { q: "Can you integrate email with our e-commerce store?", a: "Yes. We integrate with WooCommerce, Shopify, and custom stores to pull real-time product data, purchase history, and abandoned cart data into your email automation flows." },
        { q: "Will the emails be compliant with data regulations?", a: "Yes. All campaigns include unsubscribe links, your business address, and comply with Kenya's Data Protection Act and international GDPR standards where applicable." },
        { q: "How quickly can we start sending campaigns?", a: "Email Starter clients can send their first campaign within 7 days of onboarding. Growth and Pro plans include automation build-out which takes 10–14 days before launch." },
      ]}
      ctaHeadline="Your Email List Is Money Waiting to Be Unlocked"
      ctaSubtext="Most Kenyan businesses have an email list and never use it properly. We turn your list into a predictable monthly revenue channel - starting this month."
      pricingNote="Monthly retainer. No long-term contract. Cancel with 30-day notice."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
