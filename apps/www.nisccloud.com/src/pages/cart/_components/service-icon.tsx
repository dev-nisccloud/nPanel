import {
  ArrowLeftRight,
  BarChart2,
  Cloud,
  Cpu,
  Globe,
  HardDrive,
  Link2,
  Mail,
  Megaphone,
  MessageSquare,
  Monitor,
  Package,
  Palette,
  PanelsTopLeft,
  Send,
  Server,
  Share2,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";

/** "domain_existing" is the cart-only case of a domain the customer connects, not buys. */
const SERVICE_ICONS: Record<string, LucideIcon> = {
  web_hosting: Server,
  wordpress_hosting: PanelsTopLeft,
  email_hosting: Mail,
  vps: Cloud,
  vds: Cpu,
  dedicated_servers: HardDrive,
  domain_registration: Globe,
  domain_transfer: ArrowLeftRight,
  domain_existing: Link2,
  email_marketing: Send,
  zeepo_ai: MessageSquare,
  seo_reports: BarChart2,
  brand_identity: Palette,
  website_design: Monitor,
  ecommerce: ShoppingBag,
  paid_ads: Megaphone,
  social_media: Share2,
};

export const SERVICE_LABELS: Record<string, string> = {
  web_hosting: "Web Hosting",
  wordpress_hosting: "WordPress Hosting",
  email_hosting: "Business Email",
  vps: "VPS",
  vds: "VDS",
  dedicated_servers: "Dedicated Server",
  email_marketing: "Nisc Outreach",
};

const DOMAIN_SERVICE_TYPES = new Set(["domain_registration", "domain_transfer", "domain_existing"]);

/**
 * "Web Hosting · Launch plan" rather than a bare "Launch". Domains are already
 * named by the domain itself, and names that include the product stay as they are.
 */
export function cartLineTitle(serviceType: string, productName: string, planName: string): string {
  if (DOMAIN_SERVICE_TYPES.has(serviceType)) return planName;
  const product = SERVICE_LABELS[serviceType] ?? productName;
  if (!product || planName.toLowerCase().includes(product.toLowerCase())) return planName;
  const plan = /\b(plan|pack|package)\b/i.test(planName) ? planName : `${planName} plan`;
  return `${product} · ${plan}`;
}

const SIZES = {
  sm: { tile: "size-8 rounded-lg", icon: "size-4" },
  md: { tile: "size-10 rounded-xl", icon: "size-5" },
  lg: { tile: "size-12 rounded-xl", icon: "size-6" },
} as const;

export function ServiceIcon({
  serviceType,
  size = "sm",
  className,
}: {
  serviceType: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const Icon = SERVICE_ICONS[serviceType] ?? Package;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary/10 text-primary",
        SIZES[size].tile,
        className,
      )}
    >
      <Icon className={SIZES[size].icon} />
    </span>
  );
}
