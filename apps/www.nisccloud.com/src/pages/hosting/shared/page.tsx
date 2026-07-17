import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { niscWebsiteImage } from "@/lib/nisc-website-images.ts";
import { Globe, Mail, HardDrive, Clock } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { SharedPricingSection } from "./_components/SharedPricingSection.tsx";

// ─── Showcase Blocks ─────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Speed Dashboard",
    headline: "Fast for your visitors, wherever they are.",
    body: "Your site should feel quick for every visitor. We use LiteSpeed and NVMe SSD storage so pages load smoothly, and CDN options are available when you need a wider reach.",
    bullets: [
      "LiteSpeed web server, much faster than typical Apache hosting",
      "NVMe SSD storage with very fast disk reads",
      "CDN integration available for global audiences",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Site Performance</div>
          <div className="flex items-center gap-4 mb-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(0.93 0.01 240)" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(0.60 0.22 235)" strokeWidth="3" strokeDasharray="98 100" strokeLinecap="round"/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-primary">98</span>
            </div>
            <div className="space-y-1.5 flex-1">
              {[["TTFB","48ms"],["Load Time","1.1s"],["Uptime","99.99%"]].map(([k,v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-bold text-green-500">{v} ✓</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2.5 text-xs text-green-600">
            <span className="font-bold">✓</span> Fast response times for your visitors
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">100+</div>
            <div className="text-[10px] text-muted-foreground">Clients hosted</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">Setup help</div>
            <div className="text-[10px] text-muted-foreground">We guide you live</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "cPanel Management",
    headline: "Manage your hosting with a clean, simple dashboard",
    body: "cPanel gives you clear control over your hosting account. Create email addresses, manage files, install WordPress with one click, and view resource usage, without needing deep technical knowledge.",
    bullets: [
      "One-click WordPress, Joomla, and 50+ app installer",
      "Create professional email addresses like you@yourbusiness.co.ke",
      "Daily automatic backups, restore any file in one click",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">cPanel Overview</div>
          <div className="p-4 grid grid-cols-2 gap-2.5">
            {[
              { icon: Globe, label: "Websites", value: "5 active" },
              { icon: Mail, label: "Email Accounts", value: "25 / 25" },
              { icon: HardDrive, label: "Storage", value: "18 / 50 GB" },
              { icon: Clock, label: "Last Backup", value: "2h ago ✓" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2 bg-muted/40 rounded-xl p-2.5 text-xs">
                <Icon size={14} className="text-primary shrink-0" />
                <div>
                  <div className="font-semibold">{label}</div>
                  <div className="text-muted-foreground">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SharedHostingPage() {
  return (
    <ServicePageShell
      badge="Shared Web Hosting"
      headline={<>Fast, Reliable Web Hosting <span className="text-primary">That Stays Online</span></>}
      subtext="Host your website on NVMe SSD servers with free SSL, cPanel, daily backups, and 24/7 support. Starting at KES 350/mo. Fast for your visitors, wherever they are."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<SharedPricingSection />}
      plans={[]}
      heroImage={niscWebsiteImage("website hosting.png")}
      heroImageStandalone
      heroTrustBadge={{ line1: "NVMe SSD and free SSL", line2: "99.99% uptime and 24/7 support" }}
      trustStats={[
        { value: "100+", label: "Clients Hosted" },
        { value: "99.99%", label: "Uptime Target" },
        { value: "24/7", label: "Support" },
        { value: "Free", label: "Migration Help" },
      ]}
      process={[
        { num: "01", title: "Choose Your Plan", desc: "Pick a plan that fits your website size and traffic. Not sure? Start with Business, our most popular option for growing sites." },
        { num: "02", title: "Register or Transfer Domain", desc: "Claim your domain or transfer an existing one. We guide you through setup, or handle the transfer for free." },
        { num: "03", title: "Hosting Ready After Checkout", desc: "After easy checkout, your account is set up with cPanel, SSL, and email ready to use. We help you get live without the guesswork." },
        { num: "04", title: "Launch Your Website", desc: "Install WordPress with one click, import your existing site, or let our team migrate it for free. You are live and ready for customers." },
      ]}
      whyPoints={[
        { title: "Fast for Every Visitor", desc: "LiteSpeed and NVMe SSD keep pages responsive. Your site feels quick for visitors wherever they are." },
        { title: "99.99% Uptime Focus", desc: "We treat uptime as a promise, not a slogan. If something goes wrong, our 24/7 team is ready to help." },
        { title: "Free Website Migration", desc: "Moving from another host? Our team migrates your site, databases, and emails for free, with careful planning to limit downtime." },
        { title: "Clear Pricing", desc: "Every price is shown upfront. No surprise renewal shocks, and no charges for features listed as free." },
        { title: "Paying Is Simple", desc: "Easy checkout so you can get started without friction. Support is available 24/7 if you need a hand." },
        { title: "Trusted by 100+ Clients", desc: "Businesses choose us for reliable hosting, honest support, and help when they need it." },
      ]}
      faqs={[
        { q: "What do I get with shared hosting?", a: "You get NVMe SSD hosting, free SSL, cPanel, daily backups, and 24/7 support. Plans start at KES 350/mo." },
        { q: "Can I host a .co.ke website with you?", a: "Yes. You can register or transfer your domain and host it with us under one account, so naming and hosting stay simple." },
        { q: "How long does setup take after payment?", a: "We provision your hosting after checkout and send cPanel access by email. Setup help is available 24/7 if you need guidance." },
        { q: "Is WordPress hosting included?", a: "Yes. All shared hosting plans include a one-click WordPress installer via Softaculous. For WordPress-specific optimisation, see our dedicated WordPress Hosting plans." },
        { q: "What happens if I need more space?", a: "We notify you at 80% usage. Upgrade your plan from cPanel with no migration and no downtime. We never suspend without warning." },
        { q: "Do you offer a money-back guarantee?", a: "Yes. 30-day money-back guarantee on all new hosting accounts. Contact our team and we process your full refund." },
      ]}
      pricingNote="All prices in KES. Save 20% with annual billing. Easy checkout. 30-day money-back guarantee."
      ctaHeadline="Get Reliable Web Hosting From KES 350/mo"
      ctaSubtext="Join 100+ clients on fast shared hosting with free SSL, daily backups, free migration, and 24/7 support."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
