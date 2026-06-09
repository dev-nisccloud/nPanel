import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Server, Zap, Shield, Globe, Mail, HardDrive, Clock, Headphones } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

// ─── Hero Illustration ───────────────────────────────────────────────────────

function SharedHostingIllustration() {
  return (
    <div className="space-y-3 select-none">
      {/* Top nav bar mimicking cpanel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        <div className="bg-primary px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
            <span className="text-white text-xs font-bold ml-2">Nisc Cloud cPanel</span>
          </div>
          <span className="text-white/70 text-[10px]">mybusiness.co.ke</span>
        </div>
        {/* Performance bar row */}
        <div className="p-4 grid grid-cols-3 gap-3">
          {[
            { label: "Page Speed", value: 98, color: "oklch(0.60 0.22 235)" },
            { label: "Load Time", value: 88, color: "oklch(0.55 0.20 160)" },
            { label: "Uptime", value: 100, color: "oklch(0.52 0.18 145)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="relative w-14 h-14 mx-auto mb-1.5">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="oklch(0.93 0.01 240)" strokeWidth="3.5" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={color} strokeWidth="3.5"
                    strokeDasharray={`${(value / 100) * 87.96} 87.96`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold" style={{ color }}>
                  {value}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
            </div>
          ))}
        </div>
        {/* Resource bars */}
        <div className="px-4 pb-4 space-y-2.5">
          {[
            { label: "Storage Used", used: 18, total: 50, unit: "GB" },
            { label: "Bandwidth", used: 42, total: 100, unit: "GB" },
          ].map(({ label, used, total, unit }) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-foreground">{used}/{total} {unit}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(used / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stat cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
          <div className="text-lg font-extrabold text-primary">99.9%</div>
          <div className="text-[9px] text-muted-foreground">Uptime SLA</div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
          <div className="text-lg font-extrabold text-primary">48ms</div>
          <div className="text-[9px] text-muted-foreground">Avg TTFB</div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
          <div className="text-lg font-extrabold text-green-500">✓ SSL</div>
          <div className="text-[9px] text-muted-foreground">Free & Active</div>
        </div>
      </div>

      {/* Active services list */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow p-3">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Services</div>
        <div className="space-y-1.5">
          {[
            { name: "Web Server (LiteSpeed)", status: "Running" },
            { name: "MySQL Database", status: "Running" },
            { name: "Email (Postfix)", status: "Running" },
            { name: "SSL Certificate", status: "Active" },
            { name: "Daily Backup", status: "Completed 2h ago" },
          ].map(({ name, status }) => (
            <div key={name} className="flex items-center justify-between text-[10px]">
              <span className="text-foreground font-medium">{name}</span>
              <span className="text-green-500 font-semibold">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Showcase Blocks ─────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Speed Dashboard",
    headline: "Nairobi servers. Under 50ms latency for Kenyan visitors.",
    body: "When your website is hosted locally, Kenyan visitors experience dramatically faster load times. Our Nairobi data centre means your site loads before your competitor's even starts.",
    bullets: [
      "LiteSpeed web server — 6× faster than Apache hosting",
      "NVMe SSD storage with sub-1ms disk read times",
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
              {[["TTFB","48ms"],["Load Time","1.1s"],["Uptime","99.9%"]].map(([k,v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-bold text-green-500">{v} ✓</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2.5 text-xs text-green-600">
            <span className="font-bold">✓</span> Nairobi server — 47ms to Safaricom users
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">500+</div>
            <div className="text-[10px] text-muted-foreground">Sites hosted</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">30 min</div>
            <div className="text-[10px] text-muted-foreground">Setup time</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "cPanel Management",
    headline: "Manage your hosting with a clean, simple dashboard",
    body: "cPanel gives you complete control over your hosting account — create email addresses, manage files, install WordPress with one click, and view resource usage — all without technical knowledge.",
    bullets: [
      "One-click WordPress, Joomla, and 50+ app installer",
      "Create professional email addresses like you@yourbusiness.co.ke",
      "Daily automatic backups — restore any file in one click",
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
      badge="Shared Web Hosting Kenya"
      headline={<>Fast, Reliable Web Hosting <span className="text-primary">Built for Kenya</span></>}
      subtext="Host your Kenyan business website on NVMe SSD servers in Nairobi. Get free SSL, cPanel, daily backups, and 24/7 local support — starting at just KES 350/mo. The fastest shared hosting in Kenya."
      serviceType="hosting"
      plansUnderHero
      trustStats={[
        { value: "500+", label: "Kenyan Businesses Hosted" },
        { value: "99.9%", label: "Uptime Guarantee" },
        { value: "24/7", label: "Nairobi-Based Support" },
        { value: "<2s", label: "Average Page Load Time" },
      ]}
      heroIllustration={<SharedHostingIllustration />}
      heroTrustBadge={{ line1: "LiteSpeed NVMe Hosting", line2: "Free SSL + Daily Backups Included" }}
      features={[
        {
          icon: <Server size={20} />,
          title: "Local Nairobi Servers — Fastest for Kenya",
          desc: "Your website is hosted on servers physically located in Nairobi, Kenya. Kenyan visitors load your site in under 2 seconds — critical for Google rankings and M-Pesa conversions.",
        },
        {
          icon: <Zap size={20} />,
          title: "LiteSpeed Web Server — 6× Faster",
          desc: "LiteSpeed is up to 6× faster than Apache. Our built-in server-level cache ensures your pages load instantly for customers in Nairobi, Mombasa, Kisumu, and beyond.",
        },
        {
          icon: <Shield size={20} />,
          title: "Free SSL Certificate — Google-Required",
          desc: "Every hosting plan includes a free Let's Encrypt SSL certificate. Google requires HTTPS to rank well. Your visitors stay safe and your SEO improves — automatically.",
        },
        {
          icon: <Globe size={20} />,
          title: "One-Click WordPress Installer",
          desc: "Deploy WordPress, Joomla, WooCommerce, or 50+ apps in under 60 seconds via Softaculous. No technical knowledge needed — your website goes live in minutes.",
        },
        {
          icon: <Mail size={20} />,
          title: "Professional Business Email Included",
          desc: "Create branded email addresses like info@yourbusiness.co.ke. Look professional, build client trust, and access email via Outlook, Gmail, or our webmail — free on every plan.",
        },
        {
          icon: <HardDrive size={20} />,
          title: "NVMe SSD Storage — 10× Faster",
          desc: "All plans run on ultra-fast NVMe SSD storage — 10× faster than traditional hard drives. Your database queries, file access, and WordPress admin run at full speed.",
        },
        {
          icon: <Clock size={20} />,
          title: "Daily Automatic Backups",
          desc: "We back up your website every single night at no extra charge. Restore any file, folder, or database in one click. Never lose your website data again.",
        },
        {
          icon: <Headphones size={20} />,
          title: "Kenya-Based Support Team",
          desc: "Our Nairobi-based team is available via chat, phone, and email in English and Swahili. Average response time: under 2 hours. We understand Kenyan business context.",
        },
      ]}
      plans={[
        {
          id: "shared-starter",
          name: "Starter",
          price: 350,
          period: "mo",
          features: [
            "1 Website",
            "10 GB NVMe SSD Storage",
            "Unmetered Bandwidth",
            "Free SSL Certificate",
            "5 Email Accounts (@yourdomain)",
            "1-Click App Installer (WordPress)",
            "cPanel Control Panel",
            "Free Domain (1st year)",
            "99.9% Uptime SLA",
            "Community Support",
          ],
        },
        {
          id: "shared-business-popular",
          name: "Business",
          price: 750,
          period: "mo",
          features: [
            "5 Websites",
            "50 GB NVMe SSD Storage",
            "Unmetered Bandwidth",
            "Free SSL Certificate",
            "25 Email Accounts",
            "1-Click App Installer",
            "cPanel Control Panel",
            "Free Domain (1st year)",
            "Daily Automated Backups",
            "LiteSpeed Cache Plugin",
            "Staging Environment",
            "Priority Email Support",
          ],
        },
        {
          id: "shared-pro",
          name: "Pro",
          price: 1500,
          period: "mo",
          features: [
            "Unlimited Websites",
            "200 GB NVMe SSD Storage",
            "Unmetered Bandwidth",
            "Free Wildcard SSL",
            "Unlimited Email Accounts",
            "1-Click App Installer",
            "cPanel Control Panel",
            "Free Domain (1st year)",
            "Daily Backups + On-Demand",
            "LiteSpeed Cache",
            "Staging Environment",
            "Dedicated IP Address",
            "Priority Phone & Chat Support",
          ],
        },
      ]}
      addons={[
        { id: "addon-sitelock", label: "SiteLock Security Scanner", price: 300, period: "mo" },
        { id: "addon-codeguard", label: "CodeGuard Daily Backups", price: 450, period: "mo" },
        { id: "addon-spam", label: "Advanced Spam Filter (SpamExperts)", price: 200, period: "mo" },
      ]}
      process={[
        { num: "01", title: "Choose Your Plan", desc: "Pick a plan that fits your website size and traffic. Not sure? Start with Business — our most popular option for growing Kenyan businesses." },
        { num: "02", title: "Register or Transfer Domain", desc: "Claim your .co.ke or .com domain. We'll guide you through the setup or handle the transfer from your current registrar — free of charge." },
        { num: "03", title: "Hosting Active in 30 Minutes", desc: "Within 30 minutes of M-Pesa payment, your cPanel is live, SSL is active, and your email is ready. No waiting for business hours." },
        { num: "04", title: "Launch Your Website", desc: "Install WordPress with one click, import your existing site, or let our Nairobi team migrate it for free. You're live and ready for customers." },
      ]}
      whyPoints={[
        { title: "Servers in Nairobi — Fastest for .co.ke Sites", desc: "Data sovereignty + speed. Kenyan visitors load your site in under 2 seconds. Critical for Google Kenya rankings and customer trust." },
        { title: "99.9% Uptime — Backed by SLA Credits", desc: "We put our money where our mouth is. Miss SLA? You receive service credits automatically. No questions, no forms." },
        { title: "Free Website Migration", desc: "Moving from Truehost, Hostpinnacle, or any other host? Our team migrates your site, databases, and emails for free — zero downtime." },
        { title: "No Hidden Fees in KES", desc: "Every price is in Kenyan Shillings. No USD surprises, no renewal shocks, no charges for features listed as free." },
        { title: "M-Pesa Accepted — Instant Activation", desc: "Pay via M-Pesa and your hosting account is active before you finish your transaction. 24/7 including weekends." },
        { title: "Trusted by 500+ Kenyan Businesses", desc: "From Nairobi startups to Mombasa SMEs, Nisc Cloud powers businesses across all 47 counties with local expertise." },
      ]}
      faqs={[
        { q: "What is the best web hosting in Kenya?", a: "Nisc Cloud offers the fastest shared hosting in Kenya with NVMe SSD servers in Nairobi, 99.9% uptime SLA, free SSL, and local support in English and Swahili. Starting at KES 350/mo." },
        { q: "Can I host a .co.ke website with you?", a: "Absolutely. We are a KENIC-accredited registrar specialising in .co.ke domain registration and hosting. Your .co.ke domain and hosting are managed under one account." },
        { q: "How fast is setup after M-Pesa payment?", a: "Your hosting account is provisioned within 30 minutes of M-Pesa confirmation — 24/7 including weekends and public holidays. You'll have cPanel access via email." },
        { q: "Is WordPress hosting included?", a: "Yes. All shared hosting plans include a one-click WordPress installer via Softaculous. For WordPress-specific optimisation, see our dedicated WordPress Hosting plans." },
        { q: "What happens if I need more space?", a: "We notify you at 80% usage. Upgrade your plan instantly from cPanel — no migration, no downtime. We never suspend without warning." },
        { q: "Do you offer a money-back guarantee?", a: "Yes. 30-day money-back guarantee on all new hosting accounts. Contact our team and we process your full refund — no questions asked." },
      ]}
      pricingNote="All prices in KES. Save 20% with annual billing. M-Pesa accepted. 30-day money-back guarantee."
      ctaHeadline="Get the Best Web Hosting in Kenya — From KES 350/mo"
      ctaSubtext="Join 500+ local businesses already on Nisc Cloud. NVMe SSD servers in Nairobi, free SSL, daily backups, and local support in English and Swahili."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
