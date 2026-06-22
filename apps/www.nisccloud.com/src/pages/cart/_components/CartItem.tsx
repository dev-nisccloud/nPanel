import {
  Globe, Mail, BarChart2, Palette, Monitor, Zap, ShoppingBag,
  Megaphone, Trash2, Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CartServiceType =
  | "web_hosting"
  | "wordpress_hosting"
  | "email_hosting"
  | "domain_registration"
  | "seo_reports"
  | "brand_identity"
  | "website_design"
  | "ecommerce"
  | "paid_ads"
  | "social_media"
  | "email_marketing"
  | string;

export type BillingCycle = "MONTHLY" | "YEARLY";

export interface CartItemData {
  planName: string;
  productName: string;
  serviceType: CartServiceType;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  billingCycle: BillingCycle;
}

interface CartItemProps {
  item: CartItemData;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onRemove?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SERVICE_META: Record<
  string,
  { icon: React.ReactNode; color: string; bgColor: string; includedItems: string[] }
> = {
  web_hosting: {
    icon: <Globe className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "Free SSL certificate included",
      "99.9% uptime guarantee",
      "24/7 customer support",
      "One-click app installer",
    ],
  },
  wordpress_hosting: {
    icon: <Globe className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "WordPress pre-installed",
      "Free SSL certificate included",
      "Auto-updates & backups",
      "WP performance optimised",
    ],
  },
  email_hosting: {
    icon: <Mail className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "5 GB mailbox storage per account",
      "Spam & virus protection",
      "Webmail & mobile access",
      "Custom domain email address",
    ],
  },
  domain_registration: {
    icon: <Globe className="w-6 h-6" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    includedItems: [
      "FREE WHOIS privacy protection",
      "Free DNS management",
      "Free coming soon page",
      "Domain transfer lock",
    ],
  },
  seo_reports: {
    icon: <BarChart2 className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "Monthly SEO audit reports",
      "Live keyword position tracking",
      "Google Search Console integration",
      "GA4 analytics connection",
    ],
  },
  brand_identity: {
    icon: <Palette className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "Logo design & brand guidelines",
      "Up to 3 revision rounds",
      "All source files included",
      "Social media kit",
    ],
  },
  website_design: {
    icon: <Monitor className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "Custom responsive design",
      "SEO-ready structure",
      "Contact & enquiry forms",
      "30-day post-launch support",
    ],
  },
  ecommerce: {
    icon: <ShoppingBag className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "Full online store setup",
      "Payment gateway integration",
      "Product catalogue management",
      "Order & inventory tracking",
    ],
  },
  paid_ads: {
    icon: <Megaphone className="w-6 h-6" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    includedItems: [
      "Google & Meta Ads management",
      "Monthly performance report",
      "Ad creative included",
      "Budget optimisation",
    ],
  },
};

function getServiceMeta(serviceType: string) {
  return (
    SERVICE_META[serviceType] ?? {
      icon: <Zap className="w-6 h-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      includedItems: ["Professional service", "Dedicated account manager", "Regular progress updates"],
    }
  );
}

function formatPrice(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0 })}`;
}

function yearlySaving(monthly: number, yearly: number) {
  const totalMonthly = monthly * 12;
  const saved = totalMonthly - yearly;
  if (saved <= 0) return null;
  const pct = Math.round((saved / totalMonthly) * 100);
  return { saved, pct };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CartItem({ item, onBillingCycleChange, onRemove }: CartItemProps) {
  const meta = getServiceMeta(item.serviceType);
  const isDomain = item.serviceType === "domain_registration";
  // Domains are always billed annually
  const isYearly = isDomain ? true : item.billingCycle === "YEARLY";
  const displayPrice = isYearly ? item.yearlyPrice : item.monthlyPrice;
  const saving = isYearly && !isDomain ? yearlySaving(item.monthlyPrice, item.yearlyPrice) : null;
  const renewalPrice = isYearly
    ? item.yearlyPrice
    : item.monthlyPrice;

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      {/* Header row */}
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl shrink-0", meta.bgColor)}>
          <span className={meta.color}>{meta.icon}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {item.productName}
              </p>
              <h3 className="text-base font-bold text-foreground mt-0.5 leading-tight">
                {item.planName}
              </h3>
            </div>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive -mt-1 -mr-1 shrink-0"
                onClick={onRemove}
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Billing period */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
            {isDomain ? (
              /* Domains: fixed 1-year period — no selector */
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Period</span>
                <span className="inline-flex items-center h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm font-medium text-foreground select-none">
                  1 year · Annual registration
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Period</span>
                <Select
                  value={item.billingCycle}
                  onValueChange={(v) => onBillingCycleChange(v as BillingCycle)}
                >
                  <SelectTrigger className="w-52 h-9 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">1 month</SelectItem>
                    <SelectItem value="YEARLY">
                      12 months
                      {saving && (
                        <span className="ml-2 text-xs text-emerald-600 font-semibold">
                          Save {saving.pct}%
                        </span>
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price display */}
            <div className="flex items-baseline gap-2">
              {isYearly && !isDomain && (
                <span className="text-sm line-through text-muted-foreground">
                  {formatPrice(item.monthlyPrice * 12, item.currency)}
                </span>
              )}
              <span className="text-xl font-bold text-foreground">
                {formatPrice(displayPrice, item.currency)}
              </span>
              <span className="text-sm text-muted-foreground">
                /{isDomain ? "yr" : isYearly ? "yr" : "mo"}
              </span>
              {saving && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-semibold">
                  Save {saving.pct}%
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-1.5">
            {isDomain
              ? `Renews at ${formatPrice(renewalPrice, item.currency)}/yr. Standard renewal applies.`
              : `Renews at ${formatPrice(renewalPrice, item.currency)}/${isYearly ? "yr" : "mo"}. Cancel anytime.`}
          </p>
        </div>
      </div>

      {/* Included items */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {meta.includedItems.map((feat) => (
          <div key={feat} className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-sm text-muted-foreground">{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
