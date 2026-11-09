import { useState } from "react";

import { Link } from "react-router-dom";
import { prefetchServerPlans } from "@/lib/prefetch-server-plans.ts";

import {
  AppWindow,
  ArrowRight,
  Search,
  ArrowLeftRight,
  BarChart2,
  Blocks,
  Bot,
  Briefcase,
  Bug,
  Code2,
  Cpu,
  Film,
  FolderInput,
  Globe,
  HardDrive,
  Lock,
  Mail,
  Mails,
  Megaphone,
  Monitor,
  MonitorSmartphone,
  Palette,
  Send,
  Server,
  ServerCog,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Target,
  Wrench,
  Zap,
} from "lucide-react";

export const productFamilies = [
  {
    label: "Cloud & Hosting",
    icon: Server,
    href: "/hosting",
    title: "A stronger foundation for your next move.",
    description:
      "Explore hosting, business email and server resources for your business.",
    groups: [
      {
        label: "Websites",
        items: [
          {
            label: "Website Hosting",
            desc: "A dependable home for your website.",
            href: "/hosting/shared",
            icon: AppWindow,
          },
          {
            label: "Managed WordPress Hosting",
            desc: "Hosting for your WordPress website.",
            href: "/hosting/wordpress",
            icon: Zap,
          },
          {
            label: "Agency Hosting",
            desc: "Hosting for your portfolio of client websites.",
            href: "/hosting/agency",
            icon: Briefcase,
          },
        ],
      },
      {
        label: "Email",
        items: [
          {
            label: "Business Email · Nisc Mail",
            desc: "Professional email on your own domain.",
            href: "/hosting/email",
            icon: Mail,
          },
          {
            label: "Enterprise Hybrid Email",
            desc: "Nisc Mail with Google Workspace or Microsoft 365.",
            href: "/hosting/hybrid-email",
            icon: Mails,
          },
        ],
      },
      {
        label: "Cloud Servers",
        items: [
          {
            label: "VPS Hosting",
            desc: "Your own server space with root access and room to grow.",
            href: "/hosting/vps",
            icon: Cpu,
          },
          {
            label: "VDS Hosting",
            desc: "Reserved CPU and memory that no neighbour can touch.",
            href: "/hosting/vds",
            icon: HardDrive,
          },
          {
            label: "Dedicated Servers",
            desc: "A whole machine, every core working only for you.",
            href: "/hosting/dedicated-servers",
            icon: ServerCog,
          },
        ],
      },
      {
        label: "Workspaces and transfers",
        items: [
          {
            label: "Microsoft 365 (Office 365)",
            desc: "Business email and Microsoft productivity tools.",
            href: "/hosting/microsoft-365",
            icon: Monitor,
          },
          {
            label: "Google Workspace",
            desc: "Gmail and collaboration for your organisation.",
            href: "/hosting/google-workspace",
            icon: Blocks,
          },
          {
            label: "Transfer Hosting",
            desc: "Move your website and emails with a planned migration.",
            href: "/hosting/transfer",
            icon: FolderInput,
          },
        ],
      },
    ],
  },

  {
    label: "Domains",
    icon: Globe,
    href: "/hosting/domains",
    title: "Your business starts with a name.",
    description: "Register, transfer and look up domains.",
    items: [
      {
        label: "Domain Registration",
        desc: "Find your next business name.",
        href: "/hosting/domains",
        icon: Globe,
      },
      {
        label: "Domain Transfer",
        desc: "Move an existing domain to Nisc Cloud.",
        href: "/domain-transfer",
        icon: ArrowLeftRight,
      },
      {
        label: "WHOIS Lookup",
        desc: "Look up public domain registration information.",
        href: "/whois",
        icon: Search,
      },
    ],
  },

  {
    label: "Security",
    icon: ShieldCheck,
    href: "/security",
    title: "Keep your website safe and working.",
    description:
      "SSL, malware cleanup and ongoing care for WordPress and custom-coded websites.",
    items: [
      {
        label: "SSL Certificates",
        desc: "Lock in trust, secure your site with Sectigo SSL.",
        href: "/security/ssl",
        icon: Lock,
      },
      {
        label: "Website Malware Removal",
        desc: "Fix and protect a hacked WordPress or custom-coded site.",
        href: "/security/malware-removal",
        icon: Bug,
      },
      {
        label: "Website Maintenance",
        desc: "Expert support and ongoing security for your website.",
        href: "/security/website-maintenance",
        icon: Wrench,
      },
    ],
  },

  {
    label: "Websites & Applications",
    icon: MonitorSmartphone,
    href: "/services/website-design",
    title: "Bring your next idea to life.",
    description:
      "Start with your goals. Define the scope, then build the experience your customers need.",
    items: [
      {
        label: "Website Design",
        desc: "Business websites built for action.",
        href: "/services/website-design",
        icon: MonitorSmartphone,
      },

      {
        label: "E-commerce Websites",
        desc: "A clearer path from browsing to buying.",
        href: "/services/ecommerce",
        icon: ShoppingCart,
      },

      {
        label: "Web Applications",
        desc: "Discuss your custom application.",
        href: "/contact?service=web-application",
        icon: Code2,
      },

      {
        label: "Mobile Applications",
        desc: "Bring your service closer to customers.",
        href: "/contact?service=mobile-application",
        icon: Smartphone,
      },

      {
        label: "AI & Automation",
        desc: "Explore smarter everyday workflows.",
        href: "/services/zeepo-ai",
        icon: Bot,
      },
    ],
  },

  {
    label: "Brand & Marketing",
    icon: Palette,
    href: "/services",
    title: "Build your brand. Reach your next customer.",
    description:
      "Connect strategy, creative production and marketing around your business goals.",
    items: [
      {
        label: "Brand Strategy & Identity",
        desc: "Positioning, logos and full brand kits.",
        href: "/services/brand-identity",
        icon: Target,
      },

      {
        label: "Creative & Content Production",
        desc: "Business video, design and content.",
        href: "/contact?service=creative-production",
        icon: Film,
      },

      {
        label: "Social Media Management",
        desc: "A consistent, active brand presence.",
        href: "/services/social-media",
        icon: Share2,
      },

      {
        label: "Media Buying & PPC",
        desc: "Reach the people who matter to you.",
        href: "/services/paid-ads",
        icon: Megaphone,
      },

      {
        label: "SEO, AEO & GEO",
        desc: "Visibility across search and AI answers.",
        href: "/services/seo",
        icon: BarChart2,
      },

      {
        label: "Email Marketing",
        desc: "Keep your audience connected.",
        href: "/services/email-marketing",
        icon: Send,
      },
    ],
  },
];

export function productSections(family: (typeof productFamilies)[number]) {
  if ("groups" in family && family.groups) return family.groups;
  if ("items" in family && family.items) return [{ label: "", items: family.items }];
  return [];
}

export default function ProductsMegaMenu({
  onClose,
  onMouseEnter,
  onMouseLeave,
}: {
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [selected, setSelected] = useState(0);

  const family = productFamilies[selected];

  const sections = productSections(family);
  const grouped = sections.some((section) => section.label);

  const renderLink = (item: (typeof sections)[number]["items"][number]) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.label}
        to={item.href}
        onClick={onClose}
        onPointerEnter={() => prefetchServerPlans(item.href)}
        onFocus={() => prefetchServerPlans(item.href)}
        className="group flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Icon
          size={18}
          strokeWidth={1.6}
          className="mt-0.5 shrink-0 text-primary"
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-snug group-hover:text-primary">
            {item.label}
            {["/hosting/hybrid-email", "/hosting/agency"].includes(item.href) && (
              <span className="ml-1.5 rounded-md bg-brand-orange/20 px-1.5 py-0.5 text-[10px] text-foreground">
                New
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
            {item.desc}
          </span>
        </span>
      </Link>
    );
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="glass-surface-strong fixed left-1/2 top-16 z-50 max-h-[calc(100dvh-88px)] w-[min(80vw,1440px)] -translate-x-1/2 overflow-y-auto rounded-2xl text-popover-foreground"
    >
      <div className="grid grid-cols-[260px_minmax(0,1fr)] gap-6 p-6">
        <div className="border-r border-border pr-4">
          <p className="mb-3 px-3 text-xs text-muted-foreground">
            Explore our products
          </p>
          {productFamilies.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-primary ${selected === index ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"}`}
              >
                <Icon size={18} strokeWidth={1.6} className="shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="min-w-0">
          <div className="mb-4 px-3">
            <p className="text-base font-semibold text-foreground">{family.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {family.description}
            </p>
          </div>
          {grouped ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {sections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 pb-1 text-xs font-semibold text-muted-foreground">
                    {section.label}
                  </p>
                  <div className="flex flex-col">
                    {section.items.map((item) => renderLink(item))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6">
              {sections[0]?.items.map((item) => renderLink(item))}
            </div>
          )}
          <Link
            to={family.href}
            onClick={onClose}
            className="mt-4 flex items-center justify-between border-t border-border px-3 pt-3 text-sm font-semibold text-primary"
          >
            View all {family.label}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
