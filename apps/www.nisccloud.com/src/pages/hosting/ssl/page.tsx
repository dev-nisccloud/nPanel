import ServicePageShell from "@/pages/_components/ServicePageShell.tsx";
import { SSL_PLANS, SERVICE_PACKAGE_NOTES } from "@/lib/service-packages.ts";
import { Lock, Shield, Globe, Award, Zap, Eye, CheckCircle, Server } from "lucide-react";
import type { ShowcaseBlock } from "@/pages/_components/ServiceShowcaseSection.tsx";
import { useCurrency } from "@/components/providers/currency.tsx";
import { convertKesForDisplay, formatCurrency } from "@/lib/currency.ts";

// ─── Hero Illustration ────────────────────────────────────────────────────────

function SslIllustration() {
  const { currency, kesToCurrencyRate } = useCurrency();
  const displayPrice = (amount: number) =>
    kesToCurrencyRate == null
      ? "Updating…"
      : `${formatCurrency(
          convertKesForDisplay(amount, currency, kesToCurrencyRate),
          currency,
        )}/yr`;
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
              <div className="text-lg font-extrabold text-primary">256-bit</div>
              <div className="text-[9px] text-muted-foreground">Encryption</div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-center">
              <div className="text-lg font-extrabold text-primary">Padlock</div>
              <div className="text-[9px] text-muted-foreground">Visitor trust</div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificate types */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-md p-4">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Certificate Types</div>
        <div className="space-y-2">
          {[
            { type: "DV Certificate", use: "Blogs and brochure sites", price: 1500, badge: "Fast" },
            { type: "OV Certificate", use: "Business websites", price: 3500, badge: "Popular" },
            { type: "EV Certificate", use: "E-commerce and fintech", price: 8000, badge: "Highest Trust" },
          ].map(({ type, use, price, badge }) => (
            <div key={type} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-muted/40 border border-border/30">
              <div>
                <div className="font-semibold flex items-center gap-1.5">
                  {type}
                  <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>
                </div>
                <div className="text-muted-foreground mt-0.5">{use}</div>
              </div>
              <span className="font-bold text-primary shrink-0 ml-2">{displayPrice(price)}</span>
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
    headline: "The padlock that builds visitor trust",
    body: "HTTPS and the padlock icon show visitors that your site is safe. Customers look for that signal before entering payment or personal information.",
    bullets: [
      "Padlock appears in all major browsers within 1 hour of issuance",
      "Google treats HTTPS as a ranking signal",
      "256-bit AES encryption, the same standard used by banks",
    ],
    mockupRight: true,
    visual: "trust",
  },
  {
    tag: "Payment Ready",
    headline: "SSL is required for secure online payments",
    body: "Any site that collects payment or personal data needs HTTPS with a valid SSL certificate. We help you install it correctly so checkout and forms stay protected.",
    bullets: [
      "Required for secure payment and form flows",
      "Helps meet PCI-DSS expectations for payment pages",
      "Free installation included. We configure your server for you",
    ],
    mockupRight: false,
    visual: "security",
  },
];

export default function SslPage() {
  return (
    <ServicePageShell
      badge="SSL Certificates"
      headline={<>Secure your website. <span className="text-primary">Earn your visitors' trust.</span></>}
      subtext="SSL certificates encrypt customer data, support better search visibility, and display the padlock that tells visitors your site is safe. Essential for every business website and online store."
      serviceType="hosting"
      checkoutServiceType="ssl_certificate"
      checkoutProductName="SSL Certificate"
      heroIllustration={<SslIllustration />}
      heroTrustBadge={{ line1: "256-bit AES Encryption", line2: "Issued in under 1 hour" }}
      trustStats={[
        { value: "Sectigo", label: "Certificate Authority" },
        { value: "256-bit", label: "Encryption Strength" },
        { value: "Free", label: "Installation Help" },
        { value: "< 1hr", label: "Average Issuance Time" },
      ]}
      features={[
        {
          icon: <Lock size={20} />,
          title: "256-bit encryption",
          desc: "Industry-standard 256-bit AES encryption protects all data transmitted between your visitors' browsers and your server, the same strength used by banks and governments.",
        },
        {
          icon: <Shield size={20} />,
          title: "Malware and phishing warnings removed",
          desc: "Google Chrome and Firefox display scary warnings for sites without SSL. An SSL certificate removes these warnings and shows the trusted padlock instead.",
        },
        {
          icon: <Globe size={20} />,
          title: "Google SEO ranking support",
          desc: "Google has confirmed HTTPS as a ranking signal. Secure sites are better positioned in search results, which helps your online visibility.",
        },
        {
          icon: <Award size={20} />,
          title: "Issued by Sectigo",
          desc: "Our SSL certificates are issued by Sectigo, a globally recognised certificate authority. Compatible with nearly all browsers and mobile devices.",
        },
        {
          icon: <Zap size={20} />,
          title: "Fast issuance and installation",
          desc: "Domain Validated (DV) certificates issue in under 1 hour. For Business and Extended Validation certificates, we guide you through the verification process step by step.",
        },
        {
          icon: <Eye size={20} />,
          title: "Extended validation (EV)",
          desc: "EV SSL is the strictest validation level. Your verified company details appear in the certificate information. Suited to e-commerce, financial services, and government sites.",
        },
        {
          icon: <CheckCircle size={20} />,
          title: "Wildcard and multi-domain support",
          desc: "Secure unlimited subdomains with one Wildcard certificate. Multi-Domain (SAN) certificates cover multiple sites under a single certificate, reducing cost and complexity.",
        },
        {
          icon: <Server size={20} />,
          title: "Free SSL installation assistance",
          desc: "Not technical? Our team installs and configures your SSL certificate on your server free of charge. We test HTTPS enforcement and fix mixed-content issues before handing over.",
        },
      ]}
      plans={SSL_PLANS}
      addons={[
        { id: "ssl-addon-wildcard", label: "Wildcard Upgrade (unlimited subdomains)", price: 2000, period: "yr" },
        { id: "ssl-addon-san", label: "Multi-Domain SAN (up to 5 domains)", price: 2500, period: "yr" },
      ]}
      process={[
        { num: "01", title: "Choose certificate type", desc: "Select DV for a basic padlock, OV to show your company name in certificate details, or EV for the highest visible trust level on e-commerce and banking sites." },
        { num: "02", title: "Domain verification", desc: "For DV certificates, verify domain ownership via email or DNS record. For OV/EV, we guide you through business document submission." },
        { num: "03", title: "Certificate issued", desc: "DV certificates issue in under 1 hour. OV takes 1 to 3 business days. EV takes 3 to 5 business days after document verification is complete." },
        { num: "04", title: "We install and test for you", desc: "Our team installs the certificate on your server, enforces HTTPS redirects, fixes mixed-content warnings, and confirms the padlock appears correctly in all browsers." },
      ]}
      whyPoints={[
        { title: "HTTPS is no longer optional", visual: "security", desc: "Google marks all HTTP websites as 'Not Secure'. Without SSL, you lose visitor trust, search visibility, and customers who see the warning and leave." },
        { title: "Protects your customers' data", visual: "ownership", desc: "SSL encrypts credit card numbers, personal details, and login credentials in transit. A practical obligation for any website that collects user data." },
        { title: "Builds checkout confidence", visual: "payment", desc: "Visitors feel safer entering details when they see the padlock. Secure sites support smoother, more trusted form and payment flows." },
        { title: "Installation support included", visual: "support", desc: "Our team can help install the certificate, enforce HTTPS and resolve mixed-content warnings within the agreed hosting setup." },
        { title: "Expiry reminders, never go unsecured", visual: "automation", desc: "You will receive email and SMS alerts at 60, 30, and 7 days before expiry. We also offer auto-renewal so your site is never accidentally left without a valid certificate." },
        { title: "Works across common hosting setups", visual: "integrate", desc: "Sectigo certificates support common web-server and cloud configurations. We confirm compatibility with your environment before installation." },
      ]}
      faqs={[
        { q: "What is the difference between DV, OV, and EV certificates?", a: "DV (Domain Validated) proves you control the domain and issues in minutes. OV (Organisation Validated) also verifies your business details. EV (Extended Validation) provides the highest trust level. For most business websites, OV is a strong choice." },
        { q: "My hosting already includes a free SSL. Why would I buy one?", a: "Free Let's Encrypt SSL is great for basic sites. Paid certificates offer higher warranty coverage, OV/EV business verification, better customer support, and compatibility with legacy systems that don't trust Let's Encrypt." },
        { q: "Will you install the SSL on my server?", a: "Yes. Free installation is included on every SSL certificate purchase. We handle the complete installation, HTTPS redirection setup, and mixed-content testing regardless of your hosting platform." },
        { q: "What is a Wildcard SSL certificate?", a: "A Wildcard SSL (available as an add-on) secures your main domain plus all its subdomains. For example, *.yourbusiness.co.ke covers shop.yourbusiness.co.ke, mail.yourbusiness.co.ke, and any other subdomain you create." },
        { q: "Is SSL required for accepting online payments?", a: "Yes. Sites that collect payment or personal information need HTTPS with a valid SSL certificate. It is a basic requirement for secure checkout and forms." },
        { q: "What happens if my SSL expires?", a: "An expired SSL certificate causes browsers to show a full-page security warning that blocks most visitors. We send reminders well in advance and can set up auto-renewal so this never happens to you." },
      ]}
      pricingNote={SERVICE_PACKAGE_NOTES.SSL}
      ctaHeadline="Secure your website today"
      ctaSubtext="Get the padlock, protect customer data, and keep your site looking safe in the browser."
      showcaseBlocks={showcaseBlocks}
    />
  );
}
