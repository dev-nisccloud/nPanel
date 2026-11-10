import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import AccreditationStrip from "./AccreditationStrip.tsx";

type FooterLinkItem = {
  label: string;
  href: string;
};

type FooterSection = {
  title: string;
  links: FooterLinkItem[];
};

const footerSections: FooterSection[] = [
  {
    title: "Cloud",
    links: [
      { label: "Domain Registration", href: "/hosting/domains" },
      { label: "Web Hosting", href: "/hosting/shared" },
      { label: "WordPress Hosting", href: "/hosting/wordpress" },
      { label: "VPS Servers", href: "/hosting/vps" },
      { label: "Business Email", href: "/hosting/email" },
      { label: "Enterprise Hybrid Email · New", href: "/hosting/hybrid-email" },
      { label: "SSL Certificates", href: "/hosting/ssl" },
      { label: "Website Security", href: "/security" },
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
      { label: "About Us", href: "/about" },
      { label: "Our Work", href: "/work" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Help Centre", href: "/help" },
      { label: "WHOIS Checker", href: "/whois" },
      { label: "Domain Transfer", href: "/domain-transfer" },
      { label: "Contact", href: "/contact" },
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

const legalLinks = [
  ["Privacy Policy", "/privacy"],
  ["Terms of Service", "/terms"],
  ["Cookie Policy", "/cookies"],
] as const;

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
            <p className="max-w-md text-2xl font-bold leading-tight tracking-tight text-white md:text-[1.75rem]">
              Technology, infrastructure and growth for{" "}
              <span className="bg-linear-to-r/oklch from-primary from-30% to-brand-orange bg-clip-text text-transparent">modern businesses.</span>
            </p>
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
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
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
        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h4 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-brand-orange">Follow us</h4>
            <p className="mb-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Follow Nisc Cloud for product updates and news.
            </p>
            <div className="flex items-center gap-2.5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/15 hover:text-primary"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-primary">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="group inline-flex cursor-pointer items-center gap-1 text-left text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                      <ArrowUpRight
                        aria-hidden
                        className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-brand-orange group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <AccreditationStrip />
      </div>

      {/* Oversized wordmark */}
      <p
        aria-hidden
        className="pointer-events-none mx-auto -mb-[0.22em] max-w-7xl select-none px-4 text-center text-[17vw] font-black leading-none tracking-tighter text-transparent md:px-8 lg:text-[12rem]"
        style={{ WebkitTextStroke: "1px rgb(56 182 255 / 0.18)", backgroundImage: "linear-gradient(to bottom, rgb(56 182 255 / 0.10), transparent 75%)", WebkitBackgroundClip: "text", backgroundClip: "text" }}
      >
        Nisc Cloud
      </p>

      <div className="relative border-t border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-4 text-sm text-slate-400 md:px-8">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <span>© {new Date().getFullYear()} Nisc Cloud Limited. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
              {legalLinks.map(([label, href], i) => (
                <span key={href} className="flex items-center gap-3">
                  {i > 0 ? <span aria-hidden className="text-brand-orange">·</span> : null}
                  <Link
                    to={href}
                    className="cursor-pointer rounded-sm text-slate-300 transition-colors hover:text-brand-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
                  >
                    {label}
                  </Link>
                </span>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 md:text-left">
            Registered Data Controller · ODPC Reg. No. 160-3417-5D07 · Kenya Data Protection Act, 2019
          </p>
        </div>
      </div>
    </footer>
  );
}