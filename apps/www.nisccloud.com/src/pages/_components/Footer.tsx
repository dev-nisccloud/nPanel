import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { openCookieSettings } from "@/lib/cookie-settings.ts";
import AccreditationStrip from "./AccreditationStrip.tsx";

const DOCS_URL = import.meta.env.VITE_DOCS_URL || "https://docs.nisccloud.com";

type FooterLinkItem =
  | { label: string; href: string; external?: boolean }
  | { label: string; action: "cookie-settings" };

type FooterSection = {
  title: string;
  links: FooterLinkItem[];
};

const footerSections: FooterSection[] = [
  {
    title: "Cloud",
    links: [
      { label: "Domain Registration", href: "/hosting/domains" },
      { label: "Web Hosting", href: "/hosting/web-hosting" },
      { label: "WordPress Hosting", href: "/hosting/wordpress" },
      { label: "VPS Servers", href: "/hosting/vps" },
      { label: "Business Email", href: "/hosting/email" },
      { label: "Enterprise Hybrid Email · New", href: "/hosting/hybrid-email" },
      { label: "SSL Certificates", href: "/hosting/ssl" },
      { label: "WHOIS Checker", href: "/whois" },
      { label: "Domain Transfer", href: "/domain-transfer" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Brand Identity", href: "/services/brand-identity" },
      { label: "Website Design", href: "/services/website-design" },
      { label: "E-commerce Websites", href: "/services/ecommerce" },
      { label: "SEO & Content", href: "/services/seo" },
      { label: "Paid Advertising", href: "/services/paid-ads" },
      { label: "Social Media", href: "/services/social-media" },
      { label: "Email Marketing", href: "/services/email-marketing" },
      { label: "AI Automation", href: "/services/zepo-ai" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Customers", href: "/work" },
      { label: "Compare", href: "/compare" },
      { label: "Help centre", href: "/help" },
      { label: "Status", href: "/status" },
      { label: "Solutions", href: "/services" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: DOCS_URL, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & conditions", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cookies", href: "/cookies" },
      { label: "Cookie settings", action: "cookie-settings" },
      { label: "Security", href: "/security" },
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

const contactTiles = [
  { icon: Mail, label: "Email sales", value: "sales@nisccloud.com", href: "mailto:sales@nisccloud.com" },
  { icon: Phone, label: "Call us", value: "+254 748 777 666", href: "tel:+254748777666" },
  { icon: MapPin, label: "Visit", value: "Nairobi, Kenya" },
] as const;

const linkClass =
  "group inline-flex cursor-pointer items-center gap-1 rounded-sm text-left text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange";

function FooterLinkRow({ link }: { link: FooterLinkItem }) {
  const arrow = (
    <ArrowUpRight
      aria-hidden
      className="size-3.5 -translate-x-1 opacity-0 transition-[transform,opacity,color] group-hover:translate-x-0 group-hover:text-brand-orange group-hover:opacity-100"
    />
  );
  if ("action" in link) {
    return (
      <button type="button" className={linkClass} onClick={openCookieSettings}>
        {link.label}
        {arrow}
      </button>
    );
  }
  if (link.external) {
    return (
      <a href={link.href} className={linkClass} target="_blank" rel="noopener noreferrer">
        {link.label}
        {arrow}
      </a>
    );
  }
  return (
    <Link to={link.href} className={linkClass}>
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

      <div className="mx-auto max-w-7xl px-4 pt-14 md:px-8 md:pt-16">
        {/* Brand statement + contact tiles */}
        <div className="grid gap-8 border-b border-white/10 pb-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] xl:items-end">
          <div>
            <Link to="/" className="mb-5 flex w-fit items-center rounded-lg transition-opacity hover:opacity-85" aria-label="Nisc Cloud home">
              <img src="/nisccloud-logo.svg" alt="Nisc Cloud" className="h-11 w-auto object-contain" />
            </Link>
            <p className="type-h3 max-w-md text-white">
              Technology, infrastructure and growth for{" "}
              <span className="text-primary">modern businesses.</span>
            </p>
            <p className="type-label mb-4 mt-8 text-white">Follow us</p>
            <div className="flex items-center gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-[color,background-color,border-color,transform] hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/15 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
            {contactTiles.map(({ icon: Icon, label, value, ...rest }) => {
              const href = "href" in rest ? rest.href : undefined;
              const inner = (
                <>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25 transition-colors group-hover:bg-brand-orange/15 group-hover:text-brand-orange group-hover:ring-brand-orange/30">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-medium text-slate-400">{label}</span>
                    <span className="block text-sm font-semibold text-white [overflow-wrap:anywhere]">{value}</span>
                  </span>
                </>
              );
              const tile =
                "group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur transition-colors";
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} className={`${tile} hover:border-brand-orange/40 hover:bg-white/[0.07]`}>
                      {inner}
                    </a>
                  ) : (
                    <div className={tile}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 sm:grid-cols-3 xl:grid-cols-6">
          {footerSections.map((section) => (
            <div key={section.title}>
              <p className="type-label mb-4 text-white">{section.title}</p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkRow link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AccreditationStrip />
      </div>

      <div className="relative border-t border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-4 text-sm text-slate-400 md:px-8">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <span>© {new Date().getFullYear()} Nisc Cloud Limited. All rights reserved.</span>
          </div>
          <p className="text-center text-xs text-slate-500 md:text-left">
            Registered Data Controller · ODPC Reg. No. 160-3417-5D07 · Kenya Data Protection Act, 2019
          </p>
        </div>
      </div>
    </footer>
  );
}