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
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
    ],
  },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
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
                className="h-8 w-auto object-contain"
              />
            </button>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Kenya&apos;s all-in-one digital growth partner for cloud, branding,
              marketing, and automation.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-primary shrink-0" />
                <a
                  href="mailto:hello@nisccloud.com"
                  className="hover:text-foreground transition-colors"
                >
                  hello@nisccloud.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary shrink-0" />
                <a
                  href="tel:+254700000000"
                  className="hover:text-foreground transition-colors"
                >
                  +254 700 000 000
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>Nairobi, Kenya · Remote Worldwide</span>
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
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Nisc Cloud. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
