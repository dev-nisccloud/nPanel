import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { Lock, Shield, Globe, Award, Zap, Eye, CheckCircle, Server } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";

// ─── Hero Illustration ────────────────────────────────────────────────────────

function SslIllustration() {
  return (
    <div className="space-y-3 select-none">
      {/* Browser address bar mockup */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-lg overflow-hidden">
        <div className="bg-muted/70 px-4 py-2.5 flex items-center gap-2 border-b border-border/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          </div>
          <div className="flex-1 mx-3 bg-white dark:bg-background border border-border/40 rounded-lg px-3 py-1 flex items-center gap-2">
            <Lock size={11} className="text-green-500 shrink-0" />
            <span className="font-mono text-green-600 font-semibold text-[11px]">https://</span>
            <span className="font-mono text-muted-foreground text-[11px]">yourbusiness.co.ke</span>
            <span className="ml-auto bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Secure</span>
          </div>
        </div>
        <div className="p-4 space-y-2.5">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-xs">
            <div className="font-bold text-green-700 dark:text-green-300 mb-1.5 flex items-center gap-1.5">
              <CheckCircle size={13} /> Certificate Valid
            </div>
            <div className="text-green-600 dark:text-green-400 space-y-0.5">
              <div>Issued to: Your Business Ltd</div>
              <div>Valid until: 15 May 2026</div>
              <div>Encryption: TLS 1.3 / 256-bit AES</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center">
              <div className="text-lg font-extrabold text-primary">+30%</div>
              <div className="text-[9px] text-muted-foreground">Conversions</div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center">
              <div className="text-lg font-extrabold text-primary">SEO+</div>
              <div className="text-[9px] text-muted-foreground">Google Boost</div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate types */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-md p-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Certificate Types</div>
        <div className="space-y-2">
          {[
            { type: "DV Certificate", use: "Blogs and brochure sites", price: "KES 1,500/yr", badge: "Fast" },
            { type: "OV Certificate", use: "Business websites", price: "KES 3,500/yr", badge: "Popular" },
            { type: "EV Certificate", use: "E-commerce and fintech", price: "KES 8,000/yr", badge: "Highest Trust" },
          ].map(({ type, use, price, badge }) => (
            <div key={type} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-muted/40 border border-border/30">
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  {type}
                  <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                </div>
                <div className="text-muted-foreground mt-0.5">{use}</div>
              </div>
              <span className="font-bold text-primary shrink-0 ml-2">{price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Showcase blocks ──────────────────────────────────────────────────────────

const showcaseBlocks: ShowcaseBlock[] = [
  {
    tag: "SSL in Action",
    headline: "The padlock that makes customers buy",
    body: "Studies show that HTTPS and the padlock icon increase conversion rates by up to 30% on e-commerce sites. Customers check for the padlock before entering any payment or personal information.",
    bullets: [
      "Padlock appears in all major browsers within 1 hour of issuance",
      "Google confirms HTTPS as a ranking signal with direct SEO benefit",
      "256-bit AES encryption, the same standard used by banks",
    ],
    mockupRight: true,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl border border-border/40 shadow-md overflow-hidden">
          <div className="bg-muted/60 px-4 py-2.5 flex items-center gap-2.5 text-xs border-b border-border/40">
            <Lock size={12} className="text-green-500 shrink-0" />
            <span className="font-mono text-green-600 font-semibold">https://</span>
            <span className="font-mono text-muted-foreground">yourbusiness.co.ke</span>
            <span className="ml-auto bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Secure</span>
          </div>
          <div className="p-4 space-y-2.5">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-xs">
              <div className="font-bold text-green-700 dark:text-green-300 mb-1">Certificate Valid</div>
              <div className="text-green-600 space-y-0.5">
                <div>Issued to: Nisc Cloud Ltd</div>
                <div>Valid until: 15 May 2026</div>
                <div>Encryption: TLS 1.3 / 256-bit</div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-muted/40 rounded-xl p-2 text-center text-xs">
                <div className="font-bold text-primary">+30%</div>
                <div className="text-muted-foreground text-[10px]">Conversions</div>
              </div>
              <div className="flex-1 bg-muted/40 rounded-xl p-2 text-center text-xs">
                <div className="font-bold text-primary">SEO+</div>
                <div className="text-muted-foreground text-[10px]">Google boost</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    tag: "M-Pesa Requirement",
    headline: "SSL is mandatory for M-Pesa integration",
    body: "Safaricom requires all M-Pesa API callback URLs to use HTTPS with a valid SSL certificate. If you plan to accept M-Pesa payments online, SSL is not optional - it is a hard technical requirement.",
    bullets: [
      "Required by Safaricom Daraja API for all M-Pesa integrations",
      "PCI-DSS compliance mandates HTTPS for any payment data",
      "Free installation included - we configure your server for you",
    ],
    mockupRight: false,
    mockup: (
      <div className="space-y-3">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/40 shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">SSL Certificate Types</div>
          <div className="space-y-2.5">
            {[
              { type: "DV Certificate", use: "Blogs and brochure sites", price: "KES 1,500/yr", color: "text-primary" },
              { type: "OV Certificate", use: "Business websites", price: "KES 3,500/yr", color: "text-primary" },
              { type: "EV Certificate", use: "E-commerce and fintech", price: "KES 8,000/yr", color: "text-primary" },
            ].map(({ type, use, price, color }) => (
              <div key={type} className="flex items-start justify-between text-xs p-2 rounded-xl bg-muted/30">
                <div>
                  <div className="font-semibold">{type}</div>
                  <div className="text-muted-foreground">{use}</div>
                </div>
                <span className={`font-bold shrink-0 ml-2 ${color}`}>{price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/40 shadow text-center">
          <div className="text-xl font-extrabold text-primary">1,000+</div>
          <div className="text-[10px] text-muted-foreground">Certificates issued to Kenyan sites</div>
        </div>
      </div>
    ),
  },
];

export default function SslPage() {
  return (
    <ServicePageShell
      badge="SSL Certificates"
      headline={<>Secure Your Website. <span className="text-primary">Earn Your Visitors' Trust.</span></>}
      subtext="SSL certificates encrypt customer data, boost your Google ranking, and display the padlock that tells visitors your site is safe. Essential for every Kenyan business website and online store."
      serviceType="hosting"
      heroIllustration={<SslIllustration />}
      heroTrustBadge={{ line1: "256-bit AES Encryption", line2: "Issued in under 1 hour" }}
      trustStats={[
        { value: "1,000+", label: "Certificates Issued" },
        { value: "256-bit", label: "Encryption Strength" },
        { value: "99.9%", label: "Browser Compatibility" },
        { value: "< 1hr", label: "Average Issuance Time" },
      ]}
      features={[
        {
          icon: <Lock size={20} />,
          title: "256-Bit Encryption",
          desc: "Industry-standard 256-bit AES encryption protects all data transmitted between your visitors' browsers and your server - the same strength used by banks and governments.",
        },
        {
          icon: <Shield size={20} />,
          title: "Malware and Phishing Warnings Removed",
          desc: "Google Chrome and Firefox display scary warnings for sites without SSL. An SSL certificate removes these warnings instantly and shows the trusted padlock instead.",
        },
        {
          icon: <Globe size={20} />,
          title: "Google SEO Ranking Boost",
          desc: "Google has confirmed HTTPS as a ranking signal. Secure sites rank higher in Kenyan and global search results - a direct, measurable benefit to your online visibility.",
        },
        {
          icon: <Award size={20} />,
          title: "Globally Trusted Certificate Authorities",
          desc: "Our SSL certificates are issued by DigiCert, Sectigo, and GlobalSign - the most trusted CAs in the world. Compatible with 99.9% of browsers and mobile devices.",
        },
        {
          icon: <Zap size={20} />,
          title: "Fast Issuance and Installation",
          desc: "Domain Validated (DV) certificates issue in under 1 hour. For Business and Extended Validation certificates, we guide you through the verification process step by step.",
        },
        {
          icon: <Eye size={20} />,
          title: "Extended Validation (EV) Green Bar",
          desc: "EV SSL certificates display your company name in the browser address bar, providing maximum visual trust. Ideal for e-commerce, financial services, and government sites.",
        },
        {
          icon: <CheckCircle size={20} />,
          title: "Wildcard and Multi-Domain Support",
          desc: "Secure unlimited subdomains with one Wildcard certificate. Multi-Domain (SAN) certificates cover multiple sites under a single certificate - reducing cost and complexity.",
        },
        {
          icon: <Server size={20} />,
          title: "Free SSL Installation Assistance",
          desc: "Not technical? Our team installs and configures your SSL certificate on your server free of charge. We test HTTPS enforcement and fix mixed-content issues before handing over.",
        },
      ]}
      plans={[
        {
          id: "ssl-dv",
          name: "Domain Validation (DV)",
          price: 1500,
          period: "yr",
          features: [
            "Single Domain Protection",
            "256-Bit Encryption",
            "Issued in under 1 Hour",
            "Free Installation Support",
            "Padlock in Browser Address Bar",
            "Google SEO Boost",
            "99.9% Browser Compatibility",
            "KES 500,000 Warranty",
            "Ideal for Blogs and Brochure Sites",
          ],
        },
        {
          id: "ssl-ov-popular",
          name: "Organisation Validation (OV)",
          price: 3500,
          period: "yr",
          features: [
            "Single Domain Protection",
            "256-Bit Encryption",
            "Issued in under 3 Business Days",
            "Free Installation Support",
            "Company Name in Certificate Details",
            "Padlock in Browser Address Bar",
            "Google SEO Boost",
            "99.9% Browser Compatibility",
            "KES 1,500,000 Warranty",
            "Ideal for Business Websites",
            "Wildcard Option Available",
          ],
        },
        {
          id: "ssl-ev",
          name: "Extended Validation (EV)",
          price: 8000,
          period: "yr",
          features: [
            "Single Domain Protection",
            "256-Bit Encryption",
            "Issued in under 5 Business Days",
            "Free Installation Support",
            "Company Name Visible in Address Bar",
            "Highest Trust Level Available",
            "Google SEO Boost",
            "99.9% Browser Compatibility",
            "KES 5,000,000 Warranty",
            "Ideal for E-Commerce and Fintech",
            "Ideal for Banks and Government Portals",
            "Dedicated Validation Support",
          ],
        },
      ]}
      addons={[
        { id: "ssl-addon-wildcard", label: "Wildcard Upgrade (unlimited subdomains)", price: 2000, period: "yr" },
        { id: "ssl-addon-san", label: "Multi-Domain SAN (up to 5 domains)", price: 2500, period: "yr" },
      ]}
      process={[
        { num: "01", title: "Choose Certificate Type", desc: "Select DV for a basic padlock, OV to show your company name in certificate details, or EV for the highest visible trust level on e-commerce and banking sites." },
        { num: "02", title: "Domain Verification", desc: "For DV certificates, verify domain ownership via email or DNS record. For OV/EV, we guide you through business document submission." },
        { num: "03", title: "Certificate Issued", desc: "DV certificates issue in under 1 hour. OV takes 1 to 3 business days. EV takes 3 to 5 business days after document verification is complete." },
        { num: "04", title: "We Install and Test for You", desc: "Our team installs the certificate on your server, enforces HTTPS redirects, fixes mixed-content warnings, and confirms the padlock appears correctly in all browsers." },
      ]}
      whyPoints={[
        { title: "HTTPS is No Longer Optional", desc: "Google marks all HTTP websites as 'Not Secure'. Without SSL, you lose visitor trust, Google ranking, and customers who see the warning and leave immediately." },
        { title: "Protects Your Customers' Data", desc: "SSL encrypts credit card numbers, personal details, and login credentials in transit. A legal and ethical obligation for any website that collects user data in Kenya." },
        { title: "Increases Conversion Rates", desc: "Studies show that HTTPS and the padlock icon increase conversion rates by up to 30% on e-commerce sites. Customers buy more when they feel secure." },
        { title: "Free Installation Included", desc: "We don't just sell you a certificate - we install it. Our team configures Apache, Nginx, or cPanel to enforce HTTPS and resolve every mixed-content warning." },
        { title: "Expiry Reminders - Never Go Unsecured", desc: "You will receive email and SMS alerts at 60, 30, and 7 days before expiry. We also offer auto-renewal so your site is never accidentally left without a valid certificate." },
        { title: "Works on All Kenyan Business Websites", desc: "Our SSL certificates work on cPanel, Plesk, AWS, Azure, and standalone Linux/Windows servers. Whatever platform your Kenyan website runs on, we have you covered." },
      ]}
      faqs={[
        { q: "What is the difference between DV, OV, and EV certificates?", a: "DV (Domain Validated) proves you control the domain and issues in minutes. OV (Organisation Validated) also verifies your business details. EV (Extended Validation) provides the highest trust level. For most Kenyan business websites, OV is the recommended choice." },
        { q: "My hosting already includes a free SSL - why would I buy one?", a: "Free Let's Encrypt SSL is great for basic sites. Paid certificates offer higher warranty coverage, OV/EV business verification, better customer support, and compatibility with legacy systems that don't trust Let's Encrypt." },
        { q: "Will you install the SSL on my server?", a: "Yes - free installation is included on every SSL certificate purchase. We handle the complete installation, HTTPS redirection setup, and mixed-content testing regardless of your hosting platform." },
        { q: "What is a Wildcard SSL certificate?", a: "A Wildcard SSL (available as an add-on) secures your main domain plus all its subdomains - e.g. *.yourbusiness.co.ke covers shop.yourbusiness.co.ke, mail.yourbusiness.co.ke, and any other subdomain you create." },
        { q: "Is SSL required for accepting M-Pesa payments?", a: "Yes. Safaricom's M-Pesa API requires your callback URLs to use HTTPS with a valid SSL certificate. Any website collecting payment information must have SSL - it is non-negotiable." },
        { q: "What happens if my SSL expires?", a: "An expired SSL certificate causes browsers to show a full-page security warning that blocks most visitors. We send reminders well in advance and can set up auto-renewal so this never happens to you." },
      ]}
      pricingNote="Prices shown are per year. Multi-year discounts available. Free installation included on all plans."
      ctaHeadline="Secure Your Website Today"
      ctaSubtext="Over 1,000 Kenyan websites trust Nisc Cloud SSL certificates. Get the padlock, boost your Google ranking, and protect your customers' data."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
