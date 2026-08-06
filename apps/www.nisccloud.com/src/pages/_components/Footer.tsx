import { Mail, MapPin, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    title: "Services",
    links: [
      { label: "Brand & Web Design", href: "/services/brand-identity" },
      { label: "Cloud Hosting", href: "/hosting" },
      { label: "SEO & Content", href: "/services/seo" },
      { label: "Paid Advertising", href: "/services/paid-ads" },
      { label: "AI Automation", href: "/services/zeepo-ai" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Work", href: "/work" },
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "WHOIS Checker", href: "/whois" },
      { label: "Domain Transfer", href: "/domain-transfer" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
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
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
        <path d="M14 13.5h2.5l.5-3H14v-1.5c0-.9.1-1.5 1.5-1.5H17V4.1c-.3 0-1.3-.1-2.5-.1C11.9 4 10 5.5 10 8.2V10.5H7.5v3H10V20h4v-6.5z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/nisccloud",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
        <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zm6.1-8.1a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0zM12 2.2c-2.67 0-3.01.01-4.06.06-2.66.12-4.0 1.45-4.12 4.12C3.67 7.43 3.66 7.77 3.66 10.44s.01 3.01.06 4.06c.12 2.66 1.45 4 4.12 4.12 1.05.05 1.39.06 4.06.06s3.01-.01 4.06-.06c2.66-.12 4-1.45 4.12-4.12.05-1.05.06-1.39.06-4.06s-.01-3.01-.06-4.06c-.12-2.66-1.45-4-4.12-4.12C15.01 2.21 14.67 2.2 12 2.2zm0 1.62c2.63 0 2.94.01 3.98.06 1.99.09 3.06 1.15 3.15 3.15.05 1.04.06 1.35.06 3.98s-.01 2.94-.06 3.98c-.09 1.99-1.16 3.06-3.15 3.15-1.04.05-1.35.06-3.98.06s-2.94-.01-3.98-.06c-2-.09-3.06-1.16-3.15-3.15-.05-1.04-.06-1.35-.06-3.98s.01-2.94.06-3.98c.09-2 1.16-3.06 3.15-3.15 1.04-.05 1.35-.06 3.98-.06z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/nisccloud",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
        <path d="M6.94 8.5H4.06V20h2.88V8.5zM5.5 7.17a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34zM20 20h-2.88v-5.6c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94V20H10.26V8.5h2.76v1.57h.04c.38-.73 1.32-1.5 2.72-1.5 2.91 0 3.45 1.91 3.45 4.4V20z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://www.twitter.com/nisccloud",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
        <path d="M17.5 3h2.8l-6.12 7 7.2 9.5h-5.64l-4.41-5.77L6.2 19.5H3.38l6.55-7.48L3 3h5.78l3.98 5.28L17.5 3zm-.98 14.9h1.55L7.55 4.52H5.89l10.63 13.38z" />
      </svg>
    ),
  },
] as const;

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <button
              className="flex items-center gap-2.5 mb-4 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img
                src="/nisccloud-logo.svg"
                alt="Nisc Cloud"
                className="h-11 w-auto object-contain"
              />
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Transforming businesses to stand out and succeed.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary shrink-0" />
                <a
                  href="mailto:sales@nisccloud.com"
                  className="hover:text-foreground transition-colors"
                >
                  sales@nisccloud.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary shrink-0" />
                <a
                  href="tel:+254748777666"
                  className="hover:text-foreground transition-colors"
                >
                  +254 748 777 666
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-primary/25 text-primary transition-colors hover:border-primary hover:bg-primary/10"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-mono font-bold text-primary tracking-widest mb-4 uppercase">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.href)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span>© {new Date().getFullYear()} Nisc Cloud Limited. All rights reserved.</span>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button onClick={() => navigate("/privacy")} className="hover:text-foreground transition-colors cursor-pointer">
                Privacy Policy
              </button>
              <span>·</span>
              <button onClick={() => navigate("/terms")} className="hover:text-foreground transition-colors cursor-pointer">
                Terms of Service
              </button>
              <span>·</span>
              <button onClick={() => navigate("/cookies")} className="hover:text-foreground transition-colors cursor-pointer">
                Cookie Policy
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 text-center md:text-left">
            Registered Data Controller · ODPC Reg. No. 160-3417-5D07 · Kenya Data Protection Act, 2019
          </p>
        </div>
      </div>
    </footer>
  );
}
