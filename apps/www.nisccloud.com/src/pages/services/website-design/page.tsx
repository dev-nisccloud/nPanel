import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Monitor, Smartphone, Code2, Zap, Globe, ShoppingBag, Lock, BarChart2, CheckCircle2, TrendingUp } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Speed & Performance",
    headline: "Sub-2 second load. Every time. Everywhere.",
    body: "Over 78% of Kenyan internet users are on mobile - often on congested 3G. We engineer every site to load instantly even on Safaricom's busiest networks. Speed isn't a feature; it's the foundation.",
    bullets: [
      "95+ Google PageSpeed score on every site we build",
      "CDN delivery, image compression, and lazy loading built in",
      "Core Web Vitals optimised before launch day",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">PageSpeed Score</div>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(0.93 0.01 240)" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(0.60 0.22 235)" strokeWidth="3" strokeDasharray="95 100" strokeLinecap="round"/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-primary">95</span>
            </div>
            <div className="space-y-1.5 flex-1">
              {[["LCP","1.2s"],["FID","8ms"],["CLS","0.02"]].map(([k,v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-bold text-green-500">{v} ✓</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">&lt;2s</div>
            <div className="text-[10px] text-muted-foreground">Load time</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">3×</div>
            <div className="text-[10px] text-muted-foreground">Conversion lift</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Conversion Architecture",
    headline: "Built to turn browsers into buyers",
    body: "A website that doesn't generate leads is just an expensive brochure. Every page we build is engineered with strategic CTAs, lead capture forms, and WhatsApp chat funnels that work around the clock.",
    bullets: [
      "WhatsApp chat integration - customers contact you in one tap",
      "Strategic CTA placement based on scroll heatmap data",
      "Lead capture forms with instant email + SMS notification",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Monthly Lead Summary</div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[["Visitors","1,240"],["Leads","86"],["Closed","31"]].map(([l,v]) => (
                <div key={l} className="text-center">
                  <div className="text-lg font-extrabold text-primary">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {[["WhatsApp","52%"],["Contact Form","28%"],["Phone","20%"]].map(([src, pct]) => (
                <div key={src}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{src}</span>
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
    tag: "SEO-Ready from Day One",
    headline: "Rank on Google before you pay a single ad",
    body: "Most agencies build websites first, then think about SEO. We bake in proper structure, schema markup, sitemap, and Core Web Vitals compliance from the wireframe stage - so you start ranking from launch day.",
    bullets: [
      "Proper H1–H6 hierarchy, canonical tags, and schema markup",
      "XML sitemap and Google Search Console submission on launch",
      "On-page keyword targeting for your top 5 service pages",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Google Search Console</div>
          <div className="flex items-end gap-1 h-16">
            {[30,45,38,52,60,58,72,80,76,90,88,95].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: "oklch(0.60 0.22 235)", opacity: 0.4 + (i / 12) * 0.6 }} />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>Jan</span><span>Jun</span><span>Dec</span>
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/40 shadow-md flex items-center gap-3">
          <TrendingUp size={24} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">+215% Organic Clicks</div>
            <div className="text-xs text-muted-foreground">Within 6 months of launch</div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function WebsiteDesignPage() {
  return (
    <ServicePageShell
      badge="Website Design & Development"
      headline={<>Websites That Turn<br /><span className="text-primary">Visitors Into Customers</span></>}
      subtext="A beautiful website means nothing if it doesn't convert. We design and build fast, mobile-first websites that rank on Google, load in under 2 seconds, and turn Kenyan internet users into paying customers."
      serviceType="marketing"
      checkoutServiceType="website_design"
      checkoutProductName="Website Design"
      trustStats={[
        { value: "250+", label: "Websites Launched in Kenya" },
        { value: "<2s", label: "Average Page Load Speed" },
        { value: "95%", label: "Google PageSpeed Score" },
        { value: "3×", label: "Average Conversion Lift" },
      ]}
      features={[
        {
          icon: <Monitor size={20} />,
          title: "Pixel-Perfect Design",
          desc: "Custom designs built in Figma first, then coded with precision. Every pixel is deliberate - no page builder templates or generic themes.",
        },
        {
          icon: <Smartphone size={20} />,
          title: "Mobile-First Development",
          desc: "Over 78% of Kenyan internet users are on mobile. Every site we build is optimised for mobile screens, touch interactions, and slow 3G connections.",
        },
        {
          icon: <Code2 size={20} />,
          title: "Clean, Semantic Code",
          desc: "Hand-coded with React or optimised CMS builds. Clean code means faster speeds, easier updates, and better search engine crawlability.",
        },
        {
          icon: <Zap size={20} />,
          title: "Sub-2 Second Load Speed",
          desc: "Compressed images, lazy loading, CDN delivery, and minimal JavaScript ensure your site loads fast even on Safaricom 4G networks.",
        },
        {
          icon: <Globe size={20} />,
          title: "On-Page SEO Built-In",
          desc: "Every page is built with proper title tags, meta descriptions, structured data, sitemap, and Core Web Vitals in mind from day one.",
        },
        {
          icon: <ShoppingBag size={20} />,
          title: "Lead Generation Focused",
          desc: "Strategic CTAs, contact forms, WhatsApp chat integration, and conversion funnels designed to capture leads around the clock.",
        },
        {
          icon: <Lock size={20} />,
          title: "SSL & Security Hardened",
          desc: "HTTPS SSL certificates, secure hosting, regular backups, firewall protection, and malware scanning keep your site and visitors safe.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Analytics & Tracking",
          desc: "Google Analytics 4, Meta Pixel, and Google Tag Manager installed and configured so you can see exactly where your leads come from.",
        },
      ]}
      plans={[
        {
          id: "web-essential",
          name: "Essential",
          price: 35000,
          period: "once",
          features: [
            "Up to 5 pages",
            "Mobile-responsive design",
            "Contact form + WhatsApp button",
            "Basic on-page SEO",
            "Google Analytics setup",
            "SSL certificate included",
            "1-month free support",
            "10-day delivery",
          ],
        },
        {
          id: "web-professional-popular",
          name: "Professional",
          price: 75000,
          period: "once",
          features: [
            "Up to 12 pages",
            "Custom UI/UX design in Figma",
            "Blog / news section",
            "Advanced lead capture forms",
            "On-page SEO + schema markup",
            "Google Analytics 4 + Meta Pixel",
            "WhatsApp live chat widget",
            "Speed optimisation (<2s)",
            "3-month free support",
            "14-day delivery",
          ],
        },
        {
          id: "web-enterprise",
          name: "Enterprise",
          price: 150000,
          period: "once",
          features: [
            "Unlimited pages",
            "Custom web application features",
            "Multi-language support",
            "Advanced animations & interactions",
            "CMS integration (headless or WordPress)",
            "Full SEO audit + strategy",
            "Complete analytics dashboard",
            "Performance monitoring setup",
            "6-month priority support",
            "21-day delivery",
          ],
        },
      ]}
      addons={[
        { id: "web-copywriting", label: "Professional Website Copywriting", price: 20000, period: "once" },
        { id: "web-maintenance", label: "Monthly Website Maintenance", price: 8000, period: "month" },
        { id: "web-speedaudit", label: "Website Speed & Security Audit", price: 12000, period: "once" },
      ]}
      process={[
        { num: "01", title: "Discovery & Wireframe", desc: "We map your user journey, define your site structure, and build wireframes showing exactly how every page will flow before a single pixel is designed." },
        { num: "02", title: "Design in Figma", desc: "Full visual designs are created and shared with you for approval. You see the finished look before development begins - no surprises." },
        { num: "03", title: "Build & Optimise", desc: "We code the site, integrate all tools, run speed and security tests, and QA every element across mobile, tablet, and desktop." },
        { num: "04", title: "Launch & Handover", desc: "We deploy to your domain, submit to Google Search Console, and hand over a full training guide so you can manage your site confidently." },
      ]}
      whyPoints={[
        { title: "We Build for Kenyan Connections", desc: "Sites optimised for Safaricom, Airtel, and Telkom networks - fast even on patchy 3G - because real Kenyan customers don't have fibre at home." },
        { title: "No Page Builders", desc: "We don't use Wix, Squarespace, or GoDaddy builders. Every site is professionally coded for maximum performance, flexibility, and longevity." },
        { title: "SEO-Ready from Day One", desc: "Most agencies build the site first, then think about SEO. We bake it in from the wireframe stage - saving you months of retrofit work." },
        { title: "Conversion Architecture", desc: "We study your customer journey and design every page with one goal: turning more visitors into leads, calls, or sales - not just looking pretty." },
        { title: "Transparent Fixed Pricing", desc: "No hourly billing surprises. Fixed project price, fixed scope, fixed delivery date. You know exactly what you're getting and when." },
        { title: "Post-Launch Support Included", desc: "Every plan includes post-launch support. We're available to fix bugs, make updates, and answer questions well after your site goes live." },
      ]}
      faqs={[
        { q: "How long does it take to build a website?", a: "Essential sites (up to 5 pages) are delivered in 10 days. Professional sites take 14 days. Enterprise projects take 21 days. These timelines assume you provide content and feedback promptly." },
        { q: "Do I need to provide the content?", a: "You provide the basic information about your business. We offer professional copywriting as an add-on (KES 20,000) if you want us to write compelling web copy that converts visitors." },
        { q: "Will my website rank on Google?", a: "We build every site with on-page SEO fundamentals - proper tags, site structure, speed, and schema. For ongoing rankings growth, we recommend pairing with our SEO service." },
        { q: "What platform will my website be built on?", a: "Depending on your needs: React (fastest, most flexible), WordPress (easiest for self-management), or a headless CMS. We recommend the best platform for your specific goals during discovery." },
        { q: "Can I update the website myself after launch?", a: "Yes. If built on WordPress or a CMS, we provide a full training session. If on React, we handle updates for you through our maintenance plan." },
        { q: "Do you provide hosting?", a: "Yes. We recommend and set up hosting on Nisc Cloud or AWS Kenya region for optimal local speed. Hosting is separate from development cost." },
      ]}
      ctaHeadline="Your Competitors Have a Website. Yours Should Be Better."
      ctaSubtext="A professional, fast, SEO-ready website is the single highest-ROI investment a Kenyan business can make today. Let's build yours in under 3 weeks."
      pricingNote="Fixed project price. No hourly billing. No hidden costs."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
