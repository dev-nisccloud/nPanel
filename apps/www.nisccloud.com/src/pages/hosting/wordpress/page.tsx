import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Globe, Zap, Shield, Code2, RefreshCw, BarChart2, Lock, Headphones } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { WordPressPricingSection } from "./_components/WordPressPricingSection.tsx";

// ─── Hero Illustration ────────────────────────────────────────────────────────

function WordPressIllustration() {
  return (
    <div className="space-y-3 select-none">
      {/* WP Admin mockup */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-lg overflow-hidden">
        <div className="bg-[#1d2327] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">W</span>
            </div>
            <span className="text-white/80 text-xs font-semibold">WordPress Dashboard</span>
          </div>
          <span className="text-green-400 text-[10px] font-semibold">● Live</span>
        </div>
        <div className="p-4 space-y-3">
          {/* Speed comparison */}
          <div>
            <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Page Speed Score</div>
            {[
              { host: "Generic Hosting", pct: 85, score: "54", color: "oklch(0.65 0.22 27)" },
              { host: "Nisc WP Hosting", pct: 22, score: "98", color: "oklch(0.60 0.22 235)" },
            ].map(({ host, pct, score, color }) => (
              <div key={host} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{host}</span>
                  <span className="font-bold" style={{ color }}>{score}/100</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${100 - pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Status badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2 text-center">
              <div className="font-bold text-green-700 dark:text-green-400">Auto Updates</div>
              <div className="text-green-600 dark:text-green-500 text-[10px]">Active ✓</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2 text-center">
              <div className="font-bold text-blue-700 dark:text-blue-400">Staging</div>
              <div className="text-blue-600 dark:text-blue-500 text-[10px]">Ready ✓</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Sites Managed", value: "300+" },
          { label: "Load Time", value: "1.1s" },
          { label: "Migration", value: "Free" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center">
            <div className="text-sm font-extrabold text-primary">{value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Staging panel */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-md p-3 text-xs">
        <div className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-2">Environments</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5">
            <span className="font-semibold text-green-700 dark:text-green-300">yourbusiness.co.ke</span>
            <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>
          </div>
          <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-1.5">
            <span className="font-semibold text-blue-700 dark:text-blue-300">staging.yourbusiness.co.ke</span>
            <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">TESTING</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "WordPress Performance",
    headline: "3x faster than generic hosting. From day one.",
    body: "Our stack is tuned specifically for WordPress - PHP 8.3, MariaDB, OPcache, and LiteSpeed Cache pre-configured. Sites that used to take 4 seconds now load in under 1.3 seconds on our platform.",
    bullets: [
      "LiteSpeed Cache pre-installed and configured automatically",
      "PHP 8.3 with OPcache - fastest WordPress execution available",
      "HTTP/2 multiplexing for parallel asset loading",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">WordPress Speed Comparison</div>
          <div className="space-y-2.5">
            {[["Generic Hosting","4.2s","oklch(0.65 0.22 27)"],["Nisc WP Hosting","1.1s","oklch(0.60 0.22 235)"]].map(([host, time, color]) => (
              <div key={String(host)}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{host}</span>
                  <span className="font-bold" style={{ color: String(color) }}>{time}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: String(host).includes("Generic") ? "85%" : "22%", background: String(color) }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center text-xs font-bold text-primary">3x faster - same WordPress site</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">300+</div>
            <div className="text-[10px] text-muted-foreground">WP sites managed</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">Free</div>
            <div className="text-[10px] text-muted-foreground">Migration included</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Staging and Safety",
    headline: "Test everything. Break nothing.",
    body: "One-click staging environments let you test plugin updates, redesigns, and new features on a full clone of your live site. Push to production only when you are 100% confident. Available on Business and Agency plans.",
    bullets: [
      "One-click staging site creation - no technical setup required",
      "Auto WordPress updates tested on staging before going live",
      "30-day backup retention - restore any version in one click",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Staging Environment</div>
          <div className="p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-2.5">
              <span className="font-semibold text-green-700 dark:text-green-300">yourbusiness.co.ke</span>
              <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">LIVE</span>
            </div>
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2.5">
              <span className="font-semibold text-blue-700 dark:text-blue-300">staging.yourbusiness.co.ke</span>
              <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">TESTING</span>
            </div>
            <div className="bg-muted/40 rounded-xl p-2.5 text-muted-foreground">
              <div className="font-semibold mb-1 text-foreground">Last push to live:</div>
              <div>WooCommerce 8.5.0 - tested ✓</div>
              <div>Elementor Pro 3.21 - tested ✓</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function WordPressHostingPage() {
  return (
    <ServicePageShell
      badge="WordPress Hosting"
      headline={<>WordPress Hosting <span className="text-primary">Built for Kenya</span> - Fast, Secure and Managed</>}
      subtext="Purpose-built WordPress infrastructure with auto-updates, daily backups, and a staging environment. Focus on your business - we handle the technical complexity."
      serviceType="hosting"
      plansUnderHero
      customPlansSection={<WordPressPricingSection />}
      heroIllustration={<WordPressIllustration />}
      heroTrustBadge={{ line1: "PHP 8.3 and LiteSpeed Cache", line2: "3x faster than generic hosting" }}
      trustStats={[
        { value: "300+", label: "WordPress Sites Managed" },
        { value: "99.9%", label: "Uptime Guarantee" },
        { value: "3x", label: "Faster Than Generic Hosting" },
        { value: "24/7", label: "WordPress Expert Support" },
      ]}
      features={[
        {
          icon: <Globe size={20} />,
          title: "WordPress-Optimised Stack",
          desc: "PHP 8.3, MariaDB 10.11, OPcache, and LiteSpeed - every layer is tuned for WordPress. Your site loads fast whether you have 10 or 10,000 visitors per day.",
        },
        {
          icon: <Zap size={20} />,
          title: "Built-In WP Caching",
          desc: "LiteSpeed Cache plugin pre-installed and configured. Static pages served directly from cache - dramatically reducing server load and page load times.",
        },
        {
          icon: <Shield size={20} />,
          title: "WordPress Firewall and Malware Scanning",
          desc: "Dedicated WordPress WAF blocks common attacks like SQL injection, XSS, and brute-force login attempts before they reach your site.",
        },
        {
          icon: <Code2 size={20} />,
          title: "One-Click Staging Environment",
          desc: "Test plugin updates, theme changes, and new features on a full copy of your live site. Push to production with a single click when you are satisfied.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Automatic WordPress Updates",
          desc: "Core WordPress updates are applied automatically during low-traffic hours. We test on your staging environment first, so updates never break your live site.",
        },
        {
          icon: <BarChart2 size={20} />,
          title: "Performance Dashboard",
          desc: "Monitor your WordPress site's speed, uptime, database health, and resource usage from one clean dashboard. Get alerted before problems affect visitors.",
        },
        {
          icon: <Lock size={20} />,
          title: "Free SSL and HTTP/2",
          desc: "Free SSL certificate provisioned instantly. HTTP/2 multiplexing means multiple resources load in parallel - critical for WordPress sites with many assets.",
        },
        {
          icon: <Headphones size={20} />,
          title: "WordPress Expert Support",
          desc: "Our Nairobi support team are certified WordPress developers. We solve plugin conflicts, theme issues, and performance problems - not just server tickets.",
        },
      ]}
      plans={[]}
      addons={[
        { id: "wp-addon-woocommerce", label: "WooCommerce Performance Pack", price: 500, period: "mo" },
        { id: "wp-addon-backup-premium", label: "Premium Backups (6-month retention)", price: 350, period: "mo" },
        { id: "wp-addon-cdn", label: "Global CDN (50+ edge locations)", price: 400, period: "mo" },
      ]}
      process={[
        { num: "01", title: "Pick Your Plan", desc: "Choose based on how many sites you need. WP Business is perfect for most Kenyan businesses - includes staging and malware scanning." },
        { num: "02", title: "WordPress Auto-Installed", desc: "Within 15 minutes, a clean WordPress installation is ready with your chosen domain, free SSL, and LiteSpeed Cache pre-configured." },
        { num: "03", title: "We Migrate Your Existing Site", desc: "Already have a WordPress site? Our team migrates it for free - database, files, plugins, and all - with under 10 minutes of downtime." },
        { num: "04", title: "Optimise and Launch", desc: "We run a performance audit, configure caching, and make sure your site loads under 2 seconds before handing over the keys." },
      ]}
      whyPoints={[
        { title: "Managed So You Don't Have To", desc: "Updates, backups, security patches - we handle all of it automatically. You focus on content and customers, not server administration." },
        { title: "WooCommerce Ready Out of the Box", desc: "Sell products online with WooCommerce on infrastructure optimised for e-commerce. M-Pesa payment gateway integration support included." },
        { title: "Nairobi Data Centre - Low Latency", desc: "Kenyan visitors experience sub-50ms server response times. Your WooCommerce checkout is fast, reducing cart abandonment." },
        { title: "Free Expert Migration", desc: "We have migrated over 200 WordPress sites to Nisc Cloud with zero data loss. Our team handles the entire process while your current site stays live." },
        { title: "Real WordPress Developers on Support", desc: "When something breaks, you reach a WordPress developer - not a first-line agent reading from a script. Problems get solved, not escalated endlessly." },
        { title: "Scales to 100,000 Monthly Visitors", desc: "Our WordPress plans handle traffic spikes gracefully. Black Friday, product launches, viral posts - your site stays up." },
      ]}
      faqs={[
        { q: "Can you migrate my existing WordPress site?", a: "Yes, and it is completely free. Our WordPress migration team will move your entire site including all plugins, themes, media, and database with minimal downtime. We typically complete migrations within 24 hours." },
        { q: "Will my WooCommerce store work?", a: "Absolutely. Our hosting is fully compatible with WooCommerce. The WP Agency plan is specifically optimised for e-commerce with enhanced database caching and connection pooling for busy stores." },
        { q: "Do you support M-Pesa integration?", a: "Yes. We have extensive experience helping Kenyan businesses integrate M-Pesa payment gateways (WooCommerce M-Pesa plugins) and can advise on the best solutions for your store setup." },
        { q: "What happens if a plugin update breaks my site?", a: "With staging environments (available on Business and Agency plans), updates are tested on a clone of your site first. If something breaks, nothing happens to your live site." },
        { q: "Can I use my own custom WordPress theme?", a: "Yes. You have full access to your WordPress admin and can install any theme or plugin. We don't restrict what you can build." },
        { q: "Is PHP version configurable?", a: "Yes. You can switch between PHP 7.4, 8.1, 8.2, and 8.3 from your control panel. We recommend PHP 8.3 for best WordPress performance." },
      ]}
      pricingNote="All prices in KES. Annual billing saves 20%. Free migration included on all plans."
      ctaHeadline="Power Your WordPress Site with Kenya's Best Managed Hosting"
      ctaSubtext="Stop fighting with slow, unreliable hosting. Get a WordPress platform that is fast, secure, and supported by people who actually know WordPress."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
