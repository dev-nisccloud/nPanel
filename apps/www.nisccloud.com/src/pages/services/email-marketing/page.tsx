import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { EmailMarketingPricingSection } from "@/pages/services/email-marketing/_components/EmailMarketingPricingSection.tsx";
import { Mail, Users, BarChart2, Zap, Target, RefreshCw, Shield, Inbox, CheckCircle2 } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Campaign Analytics",
    headline: "Email that earns more than it costs",
    body: "Email remains one of the highest-return marketing channels when it is done well. We design, write, and automate campaigns that turn your list into recurring revenue, with clear reporting every month.",
    bullets: [
      "Subject lines tested before full sends",
      "Welcome sequences that convert new subscribers",
      "Monthly reports you can actually understand",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Campaign Report</div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[["Sent","Tracked"],["Opened","Measured"],["Clicked","Reported"],["Revenue","Attributed"]].map(([l,v]) => (
                <div key={l} className="bg-muted/40 rounded-xl p-2.5 text-center">
                  <div className="font-extrabold text-primary text-sm">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary shrink-0" />
              Clear reporting included
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Automation Flows",
    headline: "Your email list works while you sleep",
    body: "We build automated email sequences that respond to customer behaviour: new subscribers, abandoned carts, purchase anniversaries, and re-engagement, so the right message reaches each person at the right moment.",
    bullets: [
      "Welcome sequence for every new subscriber",
      "Abandoned cart recovery emails with product reminders",
      "Behavioural triggers based on clicks, purchases, and site visits",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Automation Flow · Welcome Series</div>
          <div className="p-4 space-y-2.5">
            {[
              { step: "Day 0", action: "Welcome email + discount code", status: "active" },
              { step: "Day 2", action: "Brand story + top products", status: "active" },
              { step: "Day 5", action: "Customer testimonial showcase", status: "active" },
              { step: "Day 7", action: "Discount reminder", status: "active" },
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
      headline={<>Turn Your Email List<br /><span className="text-primary">Into Steady Revenue</span></>}
      subtext="Email still delivers strong returns when campaigns are well written and well timed. We design, write, and automate emails that convert subscribers into customers, and customers into loyal repeat buyers."
      serviceType="marketing"
      plansUnderHero
      customPlansSection={<EmailMarketingPricingSection />}
      plans={[]}
      heroImage={niscWebsiteImage("Email marketing.png")}
      heroImageStandalone
      trustStats={[
        { value: "100+", label: "Clients We Have Helped" },
        { value: "24/7", label: "Support Available" },
        { value: "30 days", label: "Results Promise" },
        { value: "Clear", label: "Campaign Reporting" },
      ]}
      features={[
        {
          icon: <Mail size={20} />,
          title: "Professional Email Design",
          desc: "HTML email templates designed for your brand. Mobile-responsive layouts tested across major email clients: Gmail, Outlook, Apple Mail, and Android.",
        },
        {
          icon: <Users size={20} />,
          title: "Advanced Segmentation",
          desc: "Split your list by purchase history, engagement level, geography, and custom tags. The right message to the right subscriber increases clicks and revenue.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Automation Sequences",
          desc: "Welcome series, abandoned cart recovery, post-purchase follow-ups, and win-back campaigns, triggered automatically based on subscriber behaviour.",
        },
        {
          icon: <Target size={20} />,
          title: "A/B Subject Line Testing",
          desc: "Every campaign can test subject lines on a subset of your list. The winner gets sent to everyone, maximising opens without extra effort.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Detailed Analytics & Reports",
          desc: "Track open rates, click rates, revenue per email, unsubscribes, and list growth. Monthly reports with actionable insights to improve each campaign.",
        },
        {
          icon: <Zap size={20} />,
          title: "Behavioural Triggers",
          desc: "Send emails based on what subscribers do: visited a product page, clicked a link, made a purchase. Behaviour-based emails convert better than one-size blasts.",
        },
        {
          icon: <Shield size={20} />,
          title: "Deliverability Management",
          desc: "We maintain sender reputation via DKIM, SPF, DMARC, and careful list practices. Your emails land in inboxes, not spam folders, at major providers.",
        },
        {
          icon: <Inbox size={20} />,
          title: "List Hygiene & Cleaning",
          desc: "Monthly list cleaning removes bounced, inactive, and spam-flagged addresses. A clean list improves deliverability and reduces cost per send.",
        },
      ]}
      process={[
        { num: "01", title: "List Audit & Strategy", desc: "We audit your existing list health, segment structure, and historical campaign performance to identify quick wins and build your email marketing plan." },
        { num: "02", title: "Template & Automation Build", desc: "Design your branded email templates, build your welcome sequence, and configure automation flows before the first campaign sends." },
        { num: "03", title: "Campaign Execution", desc: "Monthly campaigns planned, written, designed, and tested. We manage everything. You approve the final copy before it sends." },
        { num: "04", title: "Optimise & Scale", desc: "Monthly performance review identifies your best-performing content, highest-converting segments, and new automation opportunities." },
      ]}
      whyPoints={[
        { title: "Strong Return When Done Well", desc: "Email marketing outperforms many other digital channels when lists are clean and messages are relevant. We build strategies that protect that advantage.", visual: "results" },
        { title: "We Write Your Emails", desc: "Our copywriters craft every subject line and email body. You do not need to find time to write. We produce content in your brand voice after onboarding.", visual: "typing" },
        { title: "Segmentation That Actually Works", desc: "Most email lists are treated as one blob. We segment by behaviour, purchase history, and geography to send relevant messages that convert better.", visual: "segments" },
        { title: "Automation Running 24/7", desc: "Once built, your automation flows work continuously. A subscriber joins late at night and immediately enters your welcome sequence.", visual: "automation" },
        { title: "Deliverability First Infrastructure", desc: "We manage sender reputation, list hygiene, and technical email configuration so campaigns reach inboxes at Gmail, Outlook, and beyond.", visual: "inbox" },
        { title: "Transparent Reporting", desc: "Monthly reports show what your email programme earned. Open rate, click rate, revenue attributed, and list growth, every number in plain English.", visual: "reporting" },
      ]}
      faqs={[
        { q: "Do I need to already have an email list?", a: "No. We can help you build your list from scratch using your website, social media, and in-store channels. We set up lead magnets, sign-up forms, and list-building strategies alongside your campaigns." },
        { q: "What email platform do you use?", a: "We work with Mailchimp, Klaviyo, ActiveCampaign, and Brevo. We recommend the best platform for your business size and goals during onboarding." },
        { q: "How do I get my email list to you?", a: "You export your existing contacts as a CSV and share it securely. We clean, import, and segment the list as part of our onboarding process." },
        { q: "Can you integrate email with our e-commerce store?", a: "Yes. We integrate with WooCommerce, Shopify, and custom stores to pull product data, purchase history, and abandoned cart data into your email automation flows." },
        { q: "Will the emails be compliant with data regulations?", a: "Yes. All campaigns include unsubscribe links, your business address, and comply with Kenya's Data Protection Act and international GDPR standards where applicable." },
        { q: "How quickly can we start sending campaigns?", a: "Starter clients can often send their first campaign within 7 days of onboarding. Plans with automation build-out typically take 10 to 14 days before launch. We work to a 30-day results promise on active programmes." },
      ]}
      ctaHeadline="Your Email List Is Ready to Work Harder"
      ctaSubtext="Most businesses have an email list and never use it properly. We turn your list into a predictable monthly revenue channel, with free setup help and clear reporting."
      pricingNote="Monthly retainer. No long-term contract. Cancel with 30-day notice."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
