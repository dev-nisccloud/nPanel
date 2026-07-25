import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Monitor, Smartphone, Code2, Zap, Globe, ShoppingBag, Lock, BarChart2, CheckCircle2 } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Speed & Performance",
    headline: "Fast load times. On mobile and desktop.",
    body: "Most visitors arrive on mobile, often on busy networks. We build sites that load quickly, stay stable, and feel easy to use from the first tap.",
    bullets: [
      "Strong Google PageSpeed performance on every site we build",
      "CDN delivery, image compression, and lazy loading built in",
      "Core Web Vitals checked before launch day",
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
            <div className="text-[10px] text-muted-foreground">Target load time</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">24/7</div>
            <div className="text-[10px] text-muted-foreground">Support available</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Conversion Architecture",
    headline: "Built to turn browsers into buyers",
    body: "A website that does not generate leads is just an expensive brochure. Every page we build uses clear CTAs, lead capture forms, and WhatsApp chat so customers can reach you easily.",
    bullets: [
      "WhatsApp chat integration so customers contact you in one tap",
      "Clear CTA placement that guides people to the next step",
      "Lead capture forms with instant email notification",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">How Leads Reach You</div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[["Visitors","Tracked"],["Leads","Captured"],["Follow-up","Clear"]].map(([l,v]) => (
                <div key={l} className="text-center">
                  <div className="text-lg font-extrabold text-primary">{v}</div>
                  <div className="text-[10px] text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              {[["WhatsApp","Easy"],["Contact Form","Ready"],["Phone","Visible"]].map(([src, pct]) => (
                <div key={src}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{src}</span>
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
    tag: "SEO-Ready from Day One",
    headline: "Set up so people can find you",
    body: "Most agencies build websites first, then think about SEO. We bake in proper structure, schema markup, sitemap, and Core Web Vitals from the wireframe stage so you start with a solid foundation.",
    bullets: [
      "Proper H1 to H6 hierarchy, canonical tags, and schema markup",
      "XML sitemap and Google Search Console submission on launch",
      "On-page keyword targeting for your top service pages",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Launch Checklist</div>
          <div className="space-y-2">
            {["Search Console connected","Sitemap submitted","Analytics installed","Speed checked"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={13} className="text-primary shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/40 shadow-md flex items-center gap-3">
          <CheckCircle2 size={24} className="text-primary shrink-0" />
          <div>
            <div className="font-bold text-sm">Free setup help</div>
            <div className="text-xs text-muted-foreground">We help you launch with confidence</div>
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
      subtext="A beautiful website means little if it does not convert. We design and build fast, mobile-first websites that help people find you, trust you, and get in touch."
      serviceType="marketing"
      checkoutServiceType="website_design"
      checkoutProductName="Website Design"
      heroImage={niscWebsiteImage("web design & development.png")}
      heroImageStandalone
      trustStats={[
        { value: "100+", label: "Clients We Have Helped" },
        { value: "<2s", label: "Target Page Load Speed" },
        { value: "24/7", label: "Support Available" },
        { value: "Free", label: "Setup Help Included" },
      ]}
      features={[
        {
          icon: <Monitor size={20} />,
          title: "Pixel-Perfect Design",
          desc: "Custom designs built in Figma first, then coded with care. Every pixel is deliberate. No page builder templates or generic themes.",
        },
        {
          icon: <Smartphone size={20} />,
          title: "Mobile-First Development",
          desc: "Most visitors browse on mobile. Every site we build is optimised for mobile screens, touch interactions, and slower connections.",
        },
        {
          icon: <Code2 size={20} />,
          title: "Clean, Semantic Code",
          desc: "Hand-coded with React or optimised CMS builds. Clean code means faster speeds, easier updates, and better search engine crawlability.",
        },
        {
          icon: <Zap size={20} />,
          title: "Sub-2 Second Load Speed",
          desc: "Compressed images, lazy loading, CDN delivery, and minimal JavaScript help your site load fast even on busy mobile networks.",
        },
        {
          icon: <Globe size={20} />,
          title: "On-Page SEO Built-In",
          desc: "Every page is built with proper title tags, meta descriptions, structured data, sitemap, and Core Web Vitals in mind from day one.",
        },
        {
          icon: <ShoppingBag size={20} />,
          title: "Lead Generation Focused",
          desc: "Clear CTAs, contact forms, WhatsApp chat integration, and conversion paths designed to capture leads around the clock.",
        },
        {
          icon: <Lock size={20} />,
          title: "SSL & Security Hardened",
          desc: "HTTPS SSL certificates, secure hosting, regular backups, firewall protection, and malware scanning keep your site and visitors safe.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Analytics & Tracking",
          desc: "Google Analytics 4, Meta Pixel, and Google Tag Manager installed and configured so you can see where your leads come from.",
        },
      ]}
      plans={[
        {
          id: "web-essential",
          name: "Essential",
          price: 35000,
          period: "once",
          features: [
            "Up to 5 custom pages",
            "Mobile-responsive design",
            "Contact form + WhatsApp button",
            "On-page SEO + Google Analytics",
            "SSL certificate included",
            "Delivered in 10 business days",
          ],
        },
        {
          id: "web-enterprise",
          name: "Enterprise",
          price: 150000,
          period: "once",
          features: [
            "Unlimited custom pages",
            "Custom UI/UX design in Figma",
            "CMS + multi-language support",
            "Full SEO audit + schema markup",
            "6-month priority support",
            "Delivered in 21 business days",
          ],
        },
      ]}
      addons={[
        { id: "web-copywriting", label: "Professional Website Copywriting", price: 20000, period: "once" },
        { id: "web-maintenance", label: "Monthly Website Maintenance", price: 8000, period: "month" },
        { id: "web-speedaudit", label: "Website Speed & Security Audit", price: 12000, period: "once" },
      ]}
      process={[
        { num: "01", title: "Discovery & Wireframe", desc: "We map your user journey, define your site structure, and build wireframes showing how every page will flow before design begins." },
        { num: "02", title: "Design in Figma", desc: "Full visual designs are created and shared with you for approval. You see the finished look before development begins." },
        { num: "03", title: "Build & Optimise", desc: "We code the site, integrate tools, run speed and security tests, and QA every element across mobile, tablet, and desktop." },
        { num: "04", title: "Launch & Handover", desc: "We deploy to your domain, submit to Google Search Console, and hand over training so you can manage your site confidently." },
      ]}
      whyPoints={[
        { title: "Built for Real Connections", desc: "Sites tuned for everyday mobile use so customers can browse, read, and contact you without friction.", visual: "mobile" },
        { title: "No Page Builders", desc: "We do not use Wix, Squarespace, or GoDaddy builders. Every site is professionally coded for performance, flexibility, and longevity.", visual: "code" },
        { title: "SEO-Ready from Day One", desc: "Most agencies build the site first, then think about SEO. We bake it in from the wireframe stage so you avoid months of retrofit work.", visual: "growth" },
        { title: "Conversion Architecture", desc: "We study your customer journey and design every page with one goal: turning more visitors into leads, calls, or sales.", visual: "funnel" },
        { title: "Transparent Fixed Pricing", desc: "No hourly billing surprises. Fixed project price, fixed scope, fixed delivery date. You know what you are getting and when.", visual: "pricing" },
        { title: "Post-Launch Support Included", desc: "Every plan includes post-launch support. We are available to fix bugs, make updates, and answer questions after your site goes live.", visual: "support" },
      ]}
      faqs={[
        { q: "How long does it take to build a website?", a: "Essential sites (up to 5 pages) are delivered in 10 days. Professional sites take 14 days. Enterprise projects take 21 days. These timelines assume you provide content and feedback promptly." },
        { q: "Do I need to provide the content?", a: "You provide the basic information about your business. We offer professional copywriting as an add-on (KES 20,000) if you want us to write clear web copy that helps visitors take action." },
        { q: "Will my website help me get found on Google?", a: "We build every site with on-page SEO fundamentals: proper tags, site structure, speed, and schema. For ongoing growth, we recommend pairing with our SEO service." },
        { q: "What platform will my website be built on?", a: "Depending on your needs: React (fast and flexible), WordPress (easiest for self-management), or a headless CMS. We recommend the best platform for your goals during discovery." },
        { q: "Can I update the website myself after launch?", a: "Yes. If built on WordPress or a CMS, we provide a full training session. If on React, we handle updates for you through our maintenance plan." },
        { q: "Do you provide hosting?", a: "Yes. We recommend and set up hosting on Nisc Cloud for reliable speed and support. Hosting is separate from development cost." },
      ]}
      ctaHeadline="Let's Build a Website That Works Harder"
      ctaSubtext="A professional, fast, SEO-ready website helps more people find you and get in touch. We can usually deliver in under 3 weeks."
      pricingNote="Fixed project price. No hourly billing. No hidden costs."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
