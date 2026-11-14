import { ArrowUp, ArrowUpRight, ChevronDown, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils.ts";
import { FooterCredentials } from "./HeroCredentials.tsx";

const DOCS_URL = import.meta.env.VITE_DOCS_URL || "https://docs.nisccloud.com";

type FooterLinkItem = { label: string; href: string; external?: boolean };

type FooterSection = {
  title: string;
  /** Hub page for the column, when one exists. */
  href?: string;
  links: FooterLinkItem[];
};

const footerSections: FooterSection[] = [
  {
    title: "Hosting",
    href: "/hosting",
    links: [
      { label: "Web Hosting", href: "/hosting/web-hosting" },
      { label: "WordPress Hosting", href: "/hosting/wordpress" },
      { label: "Agency Hosting", href: "/hosting/agency" },
      { label: "VPS Servers", href: "/hosting/vps" },
      { label: "Dedicated Servers", href: "/hosting/dedicated-servers" },
      { label: "SSL Certificates", href: "/hosting/ssl" },
      { label: "Migration", href: "/hosting/transfer" },
    ],
  },
  {
    title: "Domains & Email",
    links: [
      { label: "Domain Registration", href: "/hosting/domains" },
      { label: "Domain Transfer", href: "/domain-transfer" },
      { label: "WHOIS Checker", href: "/whois" },
      { label: "Business Email", href: "/hosting/email" },
      { label: "Hybrid Email", href: "/hosting/hybrid-email" },
      { label: "Microsoft 365", href: "/hosting/microsoft-365" },
      { label: "Google Workspace", href: "/hosting/google-workspace" },
    ],
  },
  {
    title: "Services",
    href: "/services",
    links: [
      { label: "Brand Identity", href: "/services/brand-identity" },
      { label: "Website Design", href: "/services/website-design" },
      { label: "E-commerce Websites", href: "/services/ecommerce" },
      { label: "Custom software", href: "/services/software" },
      { label: "SEO & Content", href: "/services/seo" },
      { label: "Paid Advertising", href: "/services/paid-ads" },
      { label: "Social Media", href: "/services/social-media" },
      { label: "Email Marketing", href: "/services/email-marketing" },
      { label: "AI Automation", href: "/services/zepo-ai" },
    ],
  },
  {
    title: "Company",
    href: "/about",
    links: [
      { label: "About", href: "/about" },
      { label: "Customers", href: "/work" },
      { label: "nPanel platform", href: "/platform" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "All services", href: "/services" },
      { label: "Compare", href: "/compare" },
      { label: "Help centre", href: "/help" },
      { label: "Docs", href: DOCS_URL, external: true },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    href: "/legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "SLA", href: "/sla" },
      { label: "Acceptable Use", href: "/acceptable-use" },
      { label: "Data Processing (DPA)", href: "/dpa" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];
/** Same profiles as email template footer branding. */
const socialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/nisccloud",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-5"
        aria-hidden
      >
        <path d="M14 13.5h2.5l.5-3H14v-1.5c0-.9.1-1.5 1.5-1.5H17V4.1c-.3 0-1.3-.1-2.5-.1C11.9 4 10 5.5 10 8.2V10.5H7.5v3H10V20h4v-6.5z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/nisccloud",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-5"
        aria-hidden
      >
        <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zm6.1-8.1a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0zM12 2.2c-2.67 0-3.01.01-4.06.06-2.66.12-4.0 1.45-4.12 4.12C3.67 7.43 3.66 7.77 3.66 10.44s.01 3.01.06 4.06c.12 2.66 1.45 4 4.12 4.12 1.05.05 1.39.06 4.06.06s3.01-.01 4.06-.06c2.66-.12 4-1.45 4.12-4.12.05-1.05.06-1.39.06-4.06s-.01-3.01-.06-4.06c-.12-2.66-1.45-4-4.12-4.12C15.01 2.21 14.67 2.2 12 2.2zm0 1.62c2.63 0 2.94.01 3.98.06 1.99.09 3.06 1.15 3.15 3.15.05 1.04.06 1.35.06 3.98s-.01 2.94-.06 3.98c-.09 1.99-1.16 3.06-3.15 3.15-1.04.05-1.35.06-3.98.06s-2.94-.01-3.98-.06c-2-.09-3.06-1.16-3.15-3.15-.05-1.04-.06-1.35-.06-3.98s.01-2.94.06-3.98c.09-2 1.16-3.06 3.15-3.15 1.04-.05 1.35-.06 3.98-.06z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/nisccloud",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-5"
        aria-hidden
      >
        <path d="M6.94 8.5H4.06V20h2.88V8.5zM5.5 7.17a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34zM20 20h-2.88v-5.6c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94V20H10.26V8.5h2.76v1.57h.04c.38-.73 1.32-1.5 2.72-1.5 2.91 0 3.45 1.91 3.45 4.4V20z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://www.twitter.com/nisccloud",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-5"
        aria-hidden
      >
        <path d="M17.5 3h2.8l-6.12 7 7.2 9.5h-5.64l-4.41-5.77L6.2 19.5H3.38l6.55-7.48L3 3h5.78l3.98 5.28L17.5 3zm-.98 14.9h1.55L7.55 4.52H5.89l10.63 13.38z" />
      </svg>
    ),
  },
] as const;

const contactLinks = [
  { icon: Mail, value: "sales@nisccloud.com", href: "mailto:sales@nisccloud.com" },
  { icon: Phone, value: "+254 748 777 666", href: "tel:+254748777666" },
] as const;

const linkClass =
  "group inline-flex cursor-pointer items-center gap-1 rounded-sm text-left text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";

function FooterLinkRow({ link, className }: { link: FooterLinkItem; className?: string }) {
  const classes = cn(linkClass, className);
  const arrow = (
    <ArrowUpRight
      aria-hidden
      className="size-3.5 -translate-x-1 opacity-0 transition-[transform,opacity,color] group-hover:translate-x-0 group-hover:text-brand-orange group-hover:opacity-100"
    />
  );
  if (link.external) {
    return (
      <a href={link.href} className={classes} target="_blank" rel="noopener noreferrer">
        {link.label}
        {arrow}
      </a>
    );
  }
  return (
    <Link to={link.href} className={classes}>
      {link.label}
      {arrow}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="dark relative isolate overflow-hidden bg-[#02070A] text-foreground">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-linear-to-r/oklch from-transparent via-primary to-brand-orange" />
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-40 -z-10 size-[28rem] rounded-full bg-primary/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 right-0 -z-10 size-[26rem] rounded-full bg-brand-orange/10 blur-3xl" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #38b6ff 1px, transparent 0)",
          backgroundSize: "26px 26px",
          maskImage: "linear-gradient(to bottom, black, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
          <Link to="/" className="flex w-fit items-center rounded-lg transition-opacity hover:opacity-85" aria-label="Nisc Cloud home">
            <img loading="lazy" decoding="async" src="/nisccloud-logo.svg" alt="Nisc Cloud" className="h-9 w-auto object-contain" />
          </Link>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {contactLinks.map(({ icon: Icon, value, href }) => (
              <a
                key={value}
                href={href}
                className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-white transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
              >
                <Icon size={16} className="text-primary" aria-hidden />
                {value}
              </a>
            ))}
            <div className="flex items-center gap-1.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        <nav aria-label="Footer" className="py-4 lg:grid lg:grid-cols-6 lg:gap-x-6 lg:py-10">
          {footerSections.map((section) => (
            <details key={section.title} className="group/section border-b border-white/10 lg:hidden">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-white [&::-webkit-details-marker]:hidden">
                <span className="type-label">{section.title}</span>
                <ChevronDown
                  aria-hidden
                  className="size-4 text-slate-400 transition-transform group-open/section:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pb-4">
                {section.href && !section.links.some((link) => link.href === section.href) ? (
                  <li>
                    <Link to={section.href} className={cn(linkClass, "min-h-11")}>
                      Overview
                    </Link>
                  </li>
                ) : null}
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkRow link={link} className="min-h-11" />
                  </li>
                ))}
              </ul>
            </details>
          ))}
          {footerSections.map((section) => (
            <div key={section.title} className="hidden lg:block">
              {section.href ? (
                <Link
                  to={section.href}
                  className="group mb-3 flex h-6 w-fit items-center gap-1 rounded-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  <span className="type-label">{section.title}</span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-3.5 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  />
                </Link>
              ) : (
                <p className="type-label mb-3 flex h-6 items-center text-white">{section.title}</p>
              )}
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkRow link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="relative border-t border-white/10 bg-black/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-5 text-sm text-slate-400 md:px-8 xl:flex-row xl:justify-between xl:gap-6 xl:py-4">
          <FooterCredentials className="shrink-0 xl:order-2" />
          <p className="min-w-0 text-center leading-relaxed xl:order-1 xl:text-left">
            © {new Date().getFullYear()} Nisc Cloud Limited. All rights reserved.
            <span className="block text-xs text-slate-500">
              Technology, Cloud infrastructure and Digital growth for businesses.
            </span>
          </p>
          <button
            type="button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
              })
            }
            className="group inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-3 text-sm xl:order-3 font-semibold text-white transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            Back to top
            <ArrowUp size={15} className="transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none" aria-hidden />
          </button>
        </div>
      </div>
    </footer>
  );
}
