import {
  Globe, Mail, BarChart2, Palette, Monitor, Zap, ShoppingBag,
  Megaphone, Trash2, Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import {
  billingCyclePeriodLabel,
  billingCycleShortSuffix,
  billingCycleToMonths,
  DOMAIN_BILLING_CYCLES,
  periodPrice,
  SERVICE_BILLING_CYCLES,
  type BillingCycle,
} from "@/lib/billing-cycle.ts";

export type { BillingCycle };
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
      "99.99% uptime target",
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
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    includedItems: [
      "WHOIS privacy protection",
      "Free DNS management",
      "Free coming soon page",
      "Domain transfer lock",
    ],
  },
  domain_transfer: {
    icon: <Globe className="w-6 h-6" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    includedItems: [
      "Includes 1 year renewal after transfer",
      "Free DNS management",
      "Transfer lock protection",
      "24/7 support during transfer",
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

function multiYearSaving(monthly: number, yearly: number, cycle: BillingCycle) {
  if (cycle === "MONTHLY") return null;
  const months = billingCycleToMonths(cycle);
  const fullMonthly = monthly * months;
  const period = periodPrice(monthly, yearly, cycle);
  const saved = fullMonthly - period;
  if (saved <= 0) return null;
  const pct = Math.round((saved / fullMonthly) * 100);
  return { saved, pct };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CartItem({ item, onBillingCycleChange, onRemove }: CartItemProps) {
  const meta = getServiceMeta(item.serviceType);
  const isDomainRegistration = item.serviceType === "domain_registration";
  const isDomainTransfer = item.serviceType === "domain_transfer";
  const isDomain = isDomainRegistration || isDomainTransfer;
  const cycle = isDomainTransfer ? "YEARLY" : item.billingCycle;
  const displayPrice = periodPrice(item.monthlyPrice, item.yearlyPrice, cycle);
  const saving = !isDomain ? multiYearSaving(item.monthlyPrice, item.yearlyPrice, cycle) : null;
  const renewalPrice = isDomain || cycle !== "MONTHLY" ? item.yearlyPrice : item.monthlyPrice;
  const strikeThrough =
    !isDomain && cycle !== "MONTHLY"
      ? item.monthlyPrice * billingCycleToMonths(cycle)
      : null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
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

          {/* Billing cycle */}
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
            {isDomainTransfer ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Billing cycle</span>
                <span className="inline-flex items-center h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm font-medium text-foreground select-none">
                  1 year · Transfer + renewal
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">Billing cycle</span>
                <Select
                  value={cycle}
                  onValueChange={(v) => onBillingCycleChange(v as BillingCycle)}
                >
                  <SelectTrigger className="w-52 h-9 text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(isDomainRegistration ? DOMAIN_BILLING_CYCLES : SERVICE_BILLING_CYCLES).map(
                      (opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                          {opt.value === "YEARLY" && saving && !isDomainRegistration && (
                            <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              Save {saving.pct}%
                            </span>
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price display */}
            <div className="flex items-baseline gap-2">
              {strikeThrough != null && strikeThrough > displayPrice && (
                <span className="text-sm line-through text-muted-foreground">
                  {formatPrice(strikeThrough, item.currency)}
                </span>
              )}
              <span className="text-xl font-bold text-foreground">
                {formatPrice(displayPrice, item.currency)}
              </span>
              <span className="text-sm text-muted-foreground">
                /{billingCycleShortSuffix(cycle)}
              </span>
              {saving && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold">
                  Save {saving.pct}%
                </Badge>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-1.5">
            {isDomain
              ? `Renews at ${formatPrice(renewalPrice, item.currency)}/yr. Standard renewal applies.`
              : `Billed for ${billingCyclePeriodLabel(cycle)}. Renews at ${formatPrice(renewalPrice, item.currency)}/${billingCycleShortSuffix(cycle === "MONTHLY" ? "MONTHLY" : "YEARLY")}. Cancel anytime.`}
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
