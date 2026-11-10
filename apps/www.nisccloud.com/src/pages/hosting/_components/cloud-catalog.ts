import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  ArrowRightLeft,
  Briefcase,
  Building2,
  Combine,
  Cpu,
  Globe,
  HardDrive,
  LayoutGrid,
  LayoutTemplate,
  Mail,
  MonitorSmartphone,
  Repeat,
  Server,
  ServerCog,
  ShieldCheck,
  Store,
  UsersRound,
} from "lucide-react";

export type ProductKey =
  | "shared"
  | "wordpress"
  | "agency"
  | "vps"
  | "vds"
  | "dedicated"
  | "domains"
  | "ssl"
  | "transfer"
  | "email"
  | "hybrid"
  | "m365"
  | "workspace";

export type CloudProduct = {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  /** `plans` products can be bought online; `quote` products are scoped first. */
  action: "plans" | "quote";
  isNew?: boolean;
};

export const PRODUCTS: Record<ProductKey, CloudProduct> = {
  shared: { title: "Web Hosting", desc: "Managed hosting for business websites, with tools in nPanel.", href: "/hosting/web-hosting", icon: Server, action: "plans" },
  wordpress: { title: "Managed WordPress Hosting", desc: "WordPress-ready hosting with updates and backups handled by plan.", href: "/hosting/wordpress", icon: LayoutTemplate, action: "plans" },
  agency: { title: "Agency Hosting", desc: "Host client websites and manage each client from one account.", href: "/hosting/agency", icon: Building2, action: "quote", isNew: true },
  vps: { title: "VPS Servers", desc: "Plan-defined virtual compute, with root access where included.", href: "/hosting/vps", icon: Cpu, action: "plans" },
  vds: { title: "VDS Hosting", desc: "Virtual dedicated servers with reserved resources set in your quotation.", href: "/hosting/vds", icon: ServerCog, action: "quote" },
  dedicated: { title: "Dedicated Servers", desc: "Bare-metal configurations allocated to a single customer.", href: "/hosting/dedicated-servers", icon: HardDrive, action: "quote" },
  domains: { title: "Domain Registration", desc: "Search, register and renew .co.ke, .ke and global domains.", href: "/hosting/domains", icon: Globe, action: "plans" },
  ssl: { title: "SSL Certificates", desc: "HTTPS and the browser padlock for your website.", href: "/hosting/ssl", icon: ShieldCheck, action: "plans" },
  transfer: { title: "Transfer Hosting", desc: "A planned move of your website to Nisc Cloud.", href: "/hosting/transfer", icon: Repeat, action: "quote" },
  email: { title: "Business Email", desc: "Professional email on your own domain with Nisc Mail.", href: "/hosting/email", icon: Mail, action: "plans" },
  hybrid: { title: "Enterprise Hybrid Email", desc: "Nisc Mail alongside Microsoft 365 or Google Workspace on one domain.", href: "/hosting/hybrid-email", icon: Combine, action: "quote", isNew: true },
  m365: { title: "Microsoft 365", desc: "Licences, Outlook and Office apps supplied through Nisc Cloud.", href: "/hosting/microsoft-365", icon: LayoutGrid, action: "quote" },
  workspace: { title: "Google Workspace", desc: "Business Gmail and collaboration tools for your team.", href: "/hosting/google-workspace", icon: UsersRound, action: "quote" },
};

export const ACTION_LABEL: Record<CloudProduct["action"], string> = {
  plans: "View plans",
  quote: "Get a quote",
};

export const GROUPS: { id: string; title: string; intro: string; cols: string; items: ProductKey[] }[] = [
  {
    id: "websites",
    title: "Website hosting",
    intro: "Best for business websites, WordPress sites and agencies hosting client work.",
    cols: "lg:grid-cols-3",
    items: ["shared", "wordpress", "agency"],
  },
  {
    id: "servers",
    title: "Cloud & dedicated servers",
    intro: "Best for applications, high-traffic sites and workloads that need more control.",
    cols: "lg:grid-cols-3",
    items: ["vps", "vds", "dedicated"],
  },
  {
    id: "domains",
    title: "Domains, SSL & migration",
    intro: "Best for claiming your name, securing your site and moving from another provider.",
    cols: "lg:grid-cols-3",
    items: ["domains", "ssl", "transfer"],
  },
  {
    id: "email",
    title: "Business email & productivity",
    intro: "Best for professional email on your domain and the tools your team works in.",
    cols: "lg:grid-cols-4",
    items: ["email", "hybrid", "m365", "workspace"],
  },
];

export type StackLayer = "domain" | "ssl" | "hosting" | "server" | "email" | "move";

export type FinderChoice = {
  id: string;
  label: string;
  icon: LucideIcon;
  summary: string;
  products: ProductKey[];
  stack: { layer: StackLayer; label: string }[];
  extra?: { label: string; href: string };
};

export const FINDER_CHOICES: FinderChoice[] = [
  {
    id: "website",
    label: "A business website",
    icon: MonitorSmartphone,
    summary: "A domain and web hosting get you online, SSL secures the site, and email on your domain builds trust.",
    products: ["domains", "shared", "ssl", "email"],
    stack: [
      { layer: "domain", label: "Your domain" },
      { layer: "ssl", label: "SSL certificate" },
      { layer: "hosting", label: "Web hosting" },
      { layer: "email", label: "Business email" },
    ],
  },
  {
    id: "wordpress",
    label: "A WordPress site",
    icon: LayoutTemplate,
    summary: "WordPress-ready hosting with updates handled by plan, plus your domain, SSL and email.",
    products: ["domains", "wordpress", "ssl", "email"],
    stack: [
      { layer: "domain", label: "Your domain" },
      { layer: "ssl", label: "SSL certificate" },
      { layer: "hosting", label: "WordPress hosting" },
      { layer: "email", label: "Business email" },
    ],
  },
  {
    id: "store",
    label: "An online store",
    icon: Store,
    summary: "Run your store on WordPress hosting with SSL protecting checkout. If you need the store built, our e-commerce team can help.",
    products: ["domains", "wordpress", "ssl", "email"],
    stack: [
      { layer: "domain", label: "Your store's domain" },
      { layer: "ssl", label: "SSL for checkout" },
      { layer: "hosting", label: "Store hosting" },
      { layer: "email", label: "Order and customer email" },
    ],
    extra: { label: "E-commerce websites", href: "/services/ecommerce" },
  },
  {
    id: "apps",
    label: "An app or high-traffic site",
    icon: AppWindow,
    summary: "More power and control: start on a VPS, then move to VDS or dedicated hardware as demand grows.",
    products: ["vps", "vds", "dedicated", "domains", "ssl"],
    stack: [
      { layer: "domain", label: "Your domain" },
      { layer: "ssl", label: "SSL certificate" },
      { layer: "server", label: "VPS, VDS or dedicated" },
    ],
  },
  {
    id: "email",
    label: "Business email only",
    icon: Mail,
    summary: "Email on your own domain with Nisc Mail, Microsoft 365, Google Workspace or a mix of them.",
    products: ["email", "hybrid", "m365", "workspace", "domains"],
    stack: [
      { layer: "domain", label: "Your domain" },
      { layer: "email", label: "Nisc Mail" },
      { layer: "email", label: "Microsoft 365 or Google Workspace" },
    ],
  },
  {
    id: "agency",
    label: "Client websites (agencies)",
    icon: Briefcase,
    summary: "Host client websites together and keep each client organised in nPanel, with VPS capacity for heavier sites.",
    products: ["agency", "wordpress", "vps", "domains"],
    stack: [
      { layer: "domain", label: "Client domains" },
      { layer: "hosting", label: "Agency hosting" },
      { layer: "server", label: "VPS for heavier sites" },
    ],
  },
  {
    id: "move",
    label: "Moving from another provider",
    icon: ArrowRightLeft,
    summary: "Plan the website move with us, transfer your domain and choose the hosting it moves to.",
    products: ["transfer", "domains", "shared"],
    stack: [
      { layer: "move", label: "Planned website move" },
      { layer: "domain", label: "Domain transfer" },
      { layer: "hosting", label: "Your new hosting" },
    ],
    extra: { label: "Domain transfer", href: "/domain-transfer" },
  },
];
