import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Globe, Search, Shield, RefreshCw, Lock, Award, Zap, MapPin } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

// ─── Hero Illustration ───────────────────────────────────────────────────────

function DomainsIllustration() {
  return (
    <div className="space-y-3 select-none">
      {/* Domain search bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border/50 shadow-lg overflow-hidden">
        <div className="bg-primary px-4 py-3 flex items-center gap-2">
          <Globe size={14} className="text-white" />
          <span className="text-white text-xs font-bold">Domain Availability Checker</span>
          <span className="ml-auto bg-white/20 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">KENIC Accredited</span>
        </div>
        <div className="p-4 flex items-center gap-2 border-b border-border/30">
          <div className="flex-1 bg-muted/50 rounded-xl px-3 py-2 text-xs text-muted-foreground font-mono">mybusiness</div>
          <div className="bg-primary text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer">Search →</div>
        </div>
        {/* Results */}
        <div className="p-3 space-y-2">
          {[
            { domain: "mybusiness.co.ke", status: "available", price: "KES 999/yr", highlight: true },
            { domain: "mybusiness.com", status: "available", price: "KES 1,200/yr", highlight: false },
            { domain: "mybusiness.ke", status: "taken", price: "", highlight: false },
            { domain: "mybusiness.africa", status: "available", price: "KES 1,500/yr", highlight: false },
          ].map(({ domain, status, price, highlight }) => (
            <div
              key={domain}
              className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${highlight ? "bg-primary/5 border border-primary/25" : "bg-muted/30"}`}
            >
              <span className={`font-mono font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>{domain}</span>
              {status === "available" ? (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-bold">{price}</span>
                  <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">ADD</span>
                </div>
              ) : (
                <span className="text-red-400 text-[10px] font-semibold">Taken</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Domain management mini card */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 space-y-1.5">
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Auto-Renewal</div>
          {["mybusiness.co.ke","mybusiness.com"].map((d) => (
            <div key={d} className="flex items-center justify-between text-[10px]">
              <span className="font-mono text-foreground">{d.replace("mybusiness.", "….")}</span>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">ON ✓</span>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3">
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Extensions</div>
          <div className="grid grid-cols-2 gap-1">
            {[".co.ke",".com",".org",".africa"].map((ext) => (
              <span key={ext} className="text-center text-[9px] font-mono font-bold bg-primary/10 text-primary rounded-lg py-1">{ext}</span>
            ))}
          </div>
        </div>
      </div>

      {/* DNS status */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow p-3">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">DNS Propagation Status</div>
        <div className="space-y-1.5">
          {[
            { record: "A Record → Nairobi Server", status: "Propagated", ok: true },
            { record: "MX → Email Server", status: "Propagated", ok: true },
            { record: "TXT → SPF / DKIM", status: "Propagated", ok: true },
          ].map(({ record, status, ok }) => (
            <div key={record} className="flex items-center justify-between text-[10px]">
              <span className="text-foreground font-medium">{record}</span>
              <span className={ok ? "text-green-500 font-semibold" : "text-yellow-500 font-semibold"}>{status}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[9px] text-muted-foreground">Global propagation in under 5 minutes via Anycast DNS</div>
      </div>
    </div>
  );
}

// ─── Showcase Blocks ─────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "Domain Search",
    headline: "Check 200+ extensions instantly",
    body: "Search for your perfect domain across .co.ke, .com, .org, .net, and 200+ extensions simultaneously. Get smart alternative suggestions if your first choice is taken.",
    bullets: [
      "KENIC-accredited .co.ke registrar - registered at source",
      "Instant activation upon M-Pesa payment confirmation",
      "Free WHOIS privacy protection on all eligible extensions",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-3 text-white text-sm font-bold">Domain Availability</div>
          <div className="p-4 space-y-2.5">
            {[
              { domain: "yourbusiness.co.ke", status: "available", price: "KES 999/yr" },
              { domain: "yourbusiness.com", status: "available", price: "KES 1,200/yr" },
              { domain: "yourbusiness.ke", status: "taken", price: "" },
              { domain: "yourbusiness.africa", status: "available", price: "KES 1,500/yr" },
            ].map(({ domain, status, price }) => (
              <div key={domain} className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold">{domain}</span>
                <div className="flex items-center gap-2">
                  {status === "available" ? (
                    <>
                      <span className="text-green-500 font-bold">{price}</span>
                      <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">ADD</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Taken</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Domain Management",
    headline: "Never lose a domain by accident",
    body: "Auto-renewal, email + SMS expiry alerts at 90, 30, and 7 days, and a 30-day grace period after expiry protect your most valuable digital asset from accidental loss.",
    bullets: [
      "Auto-renewal option - domain secured forever automatically",
      "Email + SMS alerts at 90, 30, and 7 days before expiry",
      "Full DNS management with 5-minute global propagation",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Domain Portfolio</div>
          <div className="p-4 space-y-2">
            {[
              { domain: "mybusiness.co.ke", expires: "Dec 2025", autorenew: true },
              { domain: "mybusiness.com", expires: "Jan 2026", autorenew: true },
              { domain: "mybrand.africa", expires: "Mar 2026", autorenew: false },
            ].map(({ domain, expires, autorenew }) => (
              <div key={domain} className="flex items-center justify-between text-xs p-2 rounded-xl bg-muted/30">
                <div>
                  <div className="font-semibold font-mono">{domain}</div>
                  <div className="text-muted-foreground">Expires {expires}</div>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${autorenew ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                  {autorenew ? "AUTO ✓" : "MANUAL"}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">5,000+</div>
            <div className="text-[10px] text-muted-foreground">Domains registered</div>
          </div>
          <div className="bg-white dark:bg-card rounded-xl border border-border/40 shadow p-3 text-center">
            <div className="text-xl font-extrabold text-primary">KENIC</div>
            <div className="text-[10px] text-muted-foreground">Accredited registrar</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "Domain Extensions",
    headline: "Every extension your Kenyan brand needs",
    body: "Register local Kenyan extensions for credibility with Kenyan customers, global extensions to protect your brand internationally, and niche extensions for specialized businesses - all from one dashboard.",
    bullets: [
      ".co.ke signals a Kenyan business - builds local trust instantly",
      "Bundle .co.ke + .com to protect your brand from copycats",
      "Resell or manage multiple extensions under one account",
    ],
    mockupRight: true,
    mockup: (
      <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
        <div className="bg-primary px-5 py-2.5 text-white text-sm font-bold">Domain Pricing (KES/yr)</div>
        <div className="p-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Kenyan Extensions</div>
          <div className="space-y-1.5 mb-4">
            {[["co.ke","999"],["or.ke","999"],["ac.ke","999"],["ke","1,199"]].map(([ext, price]) => (
              <div key={ext} className="flex justify-between text-xs">
                <span className="font-mono font-semibold text-foreground">.{ext}</span>
                <span className="font-bold text-primary">KES {price}</span>
              </div>
            ))}
          </div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Global Extensions</div>
          <div className="space-y-1.5">
            {[["com","1,200"],["org","1,099"],["net","1,099"],["africa","1,500"],["shop","2,200"]].map(([ext, price]) => (
              <div key={ext} className="flex justify-between text-xs">
                <span className="font-mono font-semibold text-foreground">.{ext}</span>
                <span className="font-bold text-primary">KES {price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DomainsPage() {
  return (
    <ServicePageShell
      badge="Domain Registration Kenya"
      headline={<>Register Your <span className="text-primary">.co.ke Domain</span> in Kenya Today</>}
      subtext="KENIC-accredited domain registrar in Kenya. Register .co.ke, .com, .org, and 200+ extensions with instant activation, free WHOIS privacy, and full DNS management. M-Pesa accepted - domain live in under 3 minutes."
      serviceType="hosting"
      plansUnderHero
      trustStats={[
        { value: "5,000+", label: "Domains Registered" },
        { value: "200+", label: "TLD Extensions Available" },
        { value: "KENIC", label: "Accredited Registrar" },
        { value: "Instant", label: "Domain Activation" },
      ]}
      heroIllustration={<DomainsIllustration />}
      heroTrustBadge={{ line1: "KENIC-Accredited Registrar", line2: "Instant M-Pesa Activation" }}
      features={[
        {
          icon: <Globe size={20} />,
          title: "KENIC-Accredited .co.ke Registrar",
          desc: "Nisc Cloud is an officially accredited KENIC registrar. Your .co.ke, .or.ke, .ac.ke, and .go.ke domains are registered directly with the Kenyan registry - no middlemen.",
        },
        {
          icon: <Search size={20} />,
          title: "Instant Domain Search - 200+ Extensions",
          desc: "Search your ideal domain across 200+ extensions simultaneously. Get smart alternative suggestions if your first choice is taken, including regional and niche extensions.",
        },
        {
          icon: <Shield size={20} />,
          title: "Free WHOIS Privacy Protection",
          desc: "Keep your personal details off the public WHOIS database. Free privacy protection prevents spam, protects your contact info, and is included on all eligible extensions.",
        },
        {
          icon: <RefreshCw size={20} />,
          title: "Auto-Renewal & Expiry Alerts",
          desc: "Never lose a domain by mistake. Set auto-renewal and receive email + SMS reminders at 90, 30, and 7 days before expiry. Essential protection for Kenyan brands.",
        },
        {
          icon: <Lock size={20} />,
          title: "Domain Lock & Transfer Protection",
          desc: "Registrar Lock prevents unauthorised transfers. Enable two-factor authentication on your account for an extra layer of domain security against hijacking.",
        },
        {
          icon: <Award size={20} />,
          title: "Free DNS Management - Anycast Speed",
          desc: "Full DNS control with a clean interface. Create A, CNAME, MX, TXT, SRV records. DNS propagates globally in under 5 minutes via our Anycast DNS network.",
        },
        {
          icon: <Zap size={20} />,
          title: "Instant Activation via M-Pesa",
          desc: "Domains activate immediately upon M-Pesa payment confirmation - 24/7. Your domain is live and resolving before you finish your M-Pesa transaction.",
        },
        {
          icon: <MapPin size={20} />,
          title: "Local Registrar for .go.ke & .ac.ke",
          desc: "As a Kenyan registrar, we handle government (.go.ke) and academic (.ac.ke) domain requirements. We manage KENIC documentation and liaison on your behalf.",
        },
      ]}
      plans={[
        {
          id: "domain-coke",
          name: ".co.ke Domain",
          price: 999,
          period: "yr",
          features: [
            "1-Year .co.ke Registration",
            "Free WHOIS Privacy",
            "Free DNS Management",
            "Domain Lock Enabled",
            "Auto-Renewal Option",
            "Email & SMS Expiry Alerts",
            "M-Pesa Payment Accepted",
            "KENIC-Accredited Registration",
            "24/7 Domain Support",
          ],
        },
        {
          id: "domain-com-popular",
          name: ".com Domain",
          price: 1200,
          period: "yr",
          features: [
            "1-Year .com Registration",
            "Free WHOIS Privacy",
            "Free DNS Management",
            "Domain Lock Enabled",
            "Auto-Renewal Option",
            "Email & SMS Expiry Alerts",
            "M-Pesa Payment Accepted",
            "ICANN-Accredited Registration",
            "200+ TLD Extensions Available",
            "24/7 Domain Support",
          ],
        },
        {
          id: "domain-bundle",
          name: "Business Bundle",
          price: 1800,
          period: "yr",
          features: [
            ".co.ke + .com Registered Together",
            "Both Domains Point to One Site",
            "Free WHOIS Privacy (Both)",
            "Free DNS Management (Both)",
            "Domain Lock on Both",
            "Auto-Renewal Option",
            "Email & SMS Expiry Alerts",
            "M-Pesa Payment Accepted",
            "Brand Protected in Kenya & Globally",
            "Priority Support",
            "Free Domain Forwarding Setup",
          ],
        },
      ]}
      addons={[
        { id: "domain-addon-ssl", label: "Basic SSL Certificate", price: 1500, period: "yr" },
        { id: "domain-addon-business-email", label: "Business Email (5 mailboxes)", price: 250, period: "mo" },
      ]}
      process={[
        { num: "01", title: "Search Your Domain", desc: "Enter your desired name and we'll instantly check availability across .co.ke, .com, .org, .net, and 200+ extensions." },
        { num: "02", title: "Choose & Pay via M-Pesa", desc: "Select your domain, choose registration period (1–5 years for better rates), and pay via M-Pesa, card, or bank transfer instantly." },
        { num: "03", title: "Instant Activation", desc: "Your domain is registered immediately. Email and SMS confirmation with nameservers and DNS management login arrives within minutes." },
        { num: "04", title: "Connect Your Website", desc: "Point DNS to your hosting, set up MX records for email, or connect to any website builder. Our team helps with configuration for free." },
      ]}
      whyPoints={[
        { title: "Official KENIC-Accredited Registrar Kenya", desc: "We are one of Kenya's few KENIC-accredited registrars. Your .co.ke registration is handled directly at the source - no third-party resellers." },
        { title: "KES Pricing - No USD Currency Shocks", desc: "All domain prices are in Kenyan Shillings. Pay what you see - no currency conversion fees, no hidden charges at renewal time." },
        { title: "M-Pesa Domain Registration in 3 Minutes", desc: "The only Kenyan domain registrar where you can register a domain entirely via M-Pesa in under 3 minutes - 24/7 including public holidays." },
        { title: "Expiry Protection & 30-Day Grace Period", desc: "Expired domains are held for 30 days before release. We exhaust every renewal attempt before any domain is lost." },
        { title: "Free DNS Hosting Included Forever", desc: "DNS hosting is included free with every domain - forever. No separate fees, no zone file complexity, just a clean interface." },
        { title: "Free Transfer Support - Fast & Easy", desc: "Moving a domain from another registrar? Our team handles the entire process for free. Most transfers complete in 5–7 days." },
      ]}
      faqs={[
        { q: "How do I register a .co.ke domain in Kenya?", a: "Register a .co.ke domain with Nisc Cloud - Kenya's KENIC-accredited registrar. Search your domain, pay via M-Pesa, and it's active in under 3 minutes. Cost: KES 999/year." },
        { q: "What documents are needed for .co.ke registration?", a: "Most .co.ke domains require only a valid Kenyan contact. For .or.ke you need NGO/org registration proof. For .ac.ke you need evidence of an educational institution. We guide you through all requirements." },
        { q: "Can I transfer my domain to Nisc Cloud?", a: "Yes. We accept transfers from any ICANN-accredited registrar. For .co.ke domains, we coordinate with KENIC directly. The process takes 5–7 days and we provide full transfer support at no charge." },
        { q: "What happens if my domain expires?", a: "You receive reminders at 90, 30, and 7 days before expiry. After expiry, your domain enters a 30-day grace period where you can still renew at the standard rate." },
        { q: "Can I register a .go.ke domain for a government entity?", a: "Yes. Government entities can register .go.ke domains through us. The process requires documentation confirming government status. We liaise with KENIC on your behalf." },
        { q: "Is WHOIS privacy available for .co.ke domains?", a: "WHOIS privacy for .co.ke domains follows KENIC policy. We provide maximum available privacy protection for all domain extensions we support." },
      ]}
      pricingNote="Prices in KES per year. Multi-year registration available at discounted rates. M-Pesa accepted. Instant activation."
      ctaHeadline="Secure Your .co.ke Domain Before Someone Else Does"
      ctaSubtext="Over 5,000 Kenyan businesses trust Nisc Cloud to protect and manage their domain names. Register yours today and own your Kenyan digital identity."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
