import { breadcrumbJsonLd, faqJsonLd, type PageMeta } from "./seo.ts";
import { PRICING_FAQS } from "../pages/pricing/pricing-faqs.ts";

/**
 * Metadata for routes whose page component does not set its own.
 * Pages built on ServicePageShell, SecurityServiceLayout, the homepage, blog
 * posts and case studies manage their own metadata and are deliberately
 * absent here. Keys are exact pathnames.
 */
export const ROUTE_META: Record<string, PageMeta> = {
  "/services": {
    title: "Business Solutions: Brand, Web, Marketing and AI",
    description:
      "Brand identity, websites, ecommerce, SEO, paid advertising, social media, email marketing and Zepo AI automation from one team in Nairobi, Kenya.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Business Solutions", "/services"]]),
  },
  "/contact": {
    title: "Contact Nisc Cloud",
    description:
      "Talk to Nisc Cloud about hosting, websites, marketing or a tailored proposal. Email sales@nisccloud.com, call +254 748 777 666 or send a brief online.",
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Contact", "/contact"]]),
      { "@type": "ContactPage", name: "Contact Nisc Cloud", url: "https://nisccloud.com/contact" },
    ],
  },
  "/pricing": {
    title: "Pricing: Hosting, Domains, Email and Services",
    description:
      "Transparent pricing for web and WordPress hosting, VPS, VDS and dedicated servers, business email, SSL, websites, SEO, advertising and Zepo AI.",
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Pricing", "/pricing"]]),
      faqJsonLd(PRICING_FAQS.map((f) => ({ q: f.question, a: f.answer }))),
    ],
  },
  "/platform": {
    title: "Platform: nPanel and Zepo AI",
    description:
      "Manage domains, hosting, email, invoices and support in one nPanel account, with Zepo AI for customer conversations and follow-ups where it is available.",
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Platform", "/platform"]]),
      {
        "@type": "SoftwareApplication",
        name: "nPanel",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://nisccloud.com/platform",
        publisher: { "@type": "Organization", name: "Nisc Cloud" },
      },
    ],
  },
  "/about": {
    title: "About Nisc Cloud",
    description:
      "Nisc Cloud is a Nairobi-based team bringing cloud hosting, websites, marketing and automation together for businesses, developers and agencies.",
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["About", "/about"]]),
      { "@type": "AboutPage", name: "About Nisc Cloud", url: "https://nisccloud.com/about" },
    ],
  },
  "/work": {
    title: "Our Work: Clients and What We Deliver",
    description:
      "Businesses Nisc Cloud works with and the brand, web, hosting, marketing and automation services we deliver for them.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Work", "/work"]]),
  },
  "/blog": {
    title: "Blog: Hosting, Web and Growth Guides",
    description:
      "Practical guides on domains, hosting, business email, websites, SEO, advertising and automation for businesses in Kenya and beyond.",
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Blog", "/blog"]]),
      { "@type": "Blog", name: "Nisc Cloud Blog", url: "https://nisccloud.com/blog" },
    ],
  },
  "/hosting": {
    title: "Cloud Hosting, Domains, Email and Servers",
    description:
      "Website hosting, managed WordPress, business email, VPS, VDS and dedicated servers, domains and SSL, all managed together in nPanel.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Cloud Products", "/hosting"]]),
  },
  "/hosting/transfer": {
    title: "Transfer Your Hosting to Nisc Cloud",
    description:
      "Move your website, databases and email to Nisc Cloud with a planned migration. We review your current setup, agree the cutover and keep your site live.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Cloud Products", "/hosting"], ["Transfer Hosting", "/hosting/transfer"]]),
  },
  "/hosting/hybrid-email": {
    title: "Enterprise Hybrid Email with Microsoft 365 or Workspace",
    description:
      "Run Nisc Mail alongside Microsoft 365 or Google Workspace on one domain. Give every team member the right mailbox without paying for licences they do not need.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Cloud Products", "/hosting"], ["Enterprise Hybrid Email", "/hosting/hybrid-email"]]),
  },
  "/help": {
    title: "Help Centre",
    description:
      "Answers on domains, hosting, business email, SSL, billing and nPanel, plus how to reach the Nisc Cloud support team.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Help Centre", "/help"]]),
  },
  "/whois": {
    title: "WHOIS Domain Lookup",
    description:
      "Check who owns a domain, when it expires and which nameservers it uses with the Nisc Cloud WHOIS lookup.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["WHOIS Lookup", "/whois"]]),
  },
  "/security": {
    title: "Website and Email Security Services",
    description:
      "SSL certificates, email security, malware removal and website maintenance to keep your business site and inboxes protected.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Security", "/security"]]),
  },
  "/security/ssl": {
    title: "SSL Certificates: Get the HTTPS Padlock",
    description:
      "Sectigo SSL certificates with installation help, HTTPS enforcement and expiry reminders so visitors see the padlock and your data stays encrypted.",
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Security", "/security"], ["SSL Certificates", "/security/ssl"]]),
      {
        "@type": "Service",
        name: "SSL Certificates",
        serviceType: "Website Security",
        url: "https://nisccloud.com/security/ssl",
        provider: { "@type": "Organization", name: "Nisc Cloud", url: "https://nisccloud.com" },
      },
    ],
  },
  "/security/email": {
    title: "Email Security: Spam and Phishing Protection",
    description:
      "Filter spam, phishing and malicious attachments before they reach your team. Works with Microsoft 365, Google Workspace and hosted business email.",
    jsonLd: [
      breadcrumbJsonLd([["Home", "/"], ["Security", "/security"], ["Email Security", "/security/email"]]),
      {
        "@type": "Service",
        name: "Email Security",
        serviceType: "Email Security",
        url: "https://nisccloud.com/security/email",
        provider: { "@type": "Organization", name: "Nisc Cloud", url: "https://nisccloud.com" },
      },
    ],
  },
  "/cart": {
    title: "Your Cart",
    description: "Review your Nisc Cloud order before checkout.",
    noindex: true,
  },
  "/terms": {
    title: "Terms of Service",
    description: "The terms that govern Nisc Cloud hosting, domains, email, digital services and nPanel, including refunds and service availability.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How Nisc Cloud collects, uses and protects personal data under the Kenya Data Protection Act, 2019.",
  },
  "/cookies": {
    title: "Cookie Policy",
    description: "Which cookies nisccloud.com uses, why, and how to manage your preferences.",
  },
  "/sla": {
    title: "Service Level Agreement (SLA)",
    description: "Nisc Cloud's 99.9% monthly uptime commitment, 24/7 critical support, 60-day daily backups and service credits for hosting, email, servers and domains in Kenya.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Service Level Agreement", "/sla"]]),
  },
  "/acceptable-use": {
    title: "Acceptable Use Policy",
    description: "What you can and cannot host, send or run on Nisc Cloud hosting, email, servers and domains, and how we enforce it.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Acceptable Use Policy", "/acceptable-use"]]),
  },
  "/dpa": {
    title: "Data Processing Addendum",
    description: "How Nisc Cloud processes your customers' personal data as a data processor under the Kenya Data Protection Act, 2019.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Data Processing Addendum", "/dpa"]]),
  },
  "/careers": {
    title: "Careers",
    description: "Open roles at Nisc Cloud. Apply with your CV, location, LinkedIn profile and salary range.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Careers", "/careers"]]),
  },
  "/compare": {
    title: "Compare hosting and email",
    description: "Links to the hosting and email comparisons already published on the product pages.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Compare", "/compare"]]),
  },
  "/status": {
    title: "Status",
    description: "Nisc Cloud does not publish a live status board. Contact the team if a service you use is unavailable.",
    jsonLd: breadcrumbJsonLd([["Home", "/"], ["Status", "/status"]]),
  },
};

export const NOT_FOUND_META: PageMeta = {
  title: "Page not found",
  description: "The page you requested does not exist on nisccloud.com.",
  noindex: true,
};
