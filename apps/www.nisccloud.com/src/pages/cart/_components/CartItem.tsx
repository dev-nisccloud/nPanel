import { Trash2, Check } from "lucide-react";
import { ServiceIcon } from "./service-icon.tsx";
import { Button } from "@/components/ui/button.tsx";
import { formatCurrency } from "@/lib/currency.ts";
import { cn } from "@/lib/utils.ts";
import {
  billingCyclePeriodLabel,
  billingCycleShortSuffix,
  billingCycleToMonths,
  DOMAIN_BILLING_CYCLES,
  isOneTimeService,
  periodPrice,
  billingCyclesFor,
  type BillingCycle,
} from "@/lib/billing-cycle.ts";
import { SEO_CHECKOUT_SERVICE_TYPE, SEO_POLICY } from "@/lib/seo-ai-search.ts";

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
  { includedItems: string[] }
> = {
  web_hosting: {
    includedItems: [
      "Free SSL certificate included",
      "99.9% uptime target",
      "24/7 ticket support · email, chat and phone during working hours",
      "WordPress Toolkit and developer stack",
    ],
  },
  wordpress_hosting: {
    includedItems: [
      "Free SSL certificate included",
      "Automatic WordPress updates",
      "Malware scanning",
      "LiteSpeed cache",
    ],
  },
  email_hosting: {
    includedItems: [
      "Email on your own domain",
      "Anti-spam, anti-virus and anti-phishing",
      "IMAP/POP and secure SMTP",
      "Free migration from your current provider",
    ],
  },
  domain_registration: {
    includedItems: [
      "Free DNS management",
      "Renewal reminders before expiry",
      "Transfer lock",
      "Managed in your nPanel account",
    ],
  },
  domain_transfer: {
    includedItems: [
      "Includes 1 year renewal after transfer",
      "Free DNS management",
      "Transfer lock protection",
      "Support during transfer",
    ],
  },
  seo_reports: {
    includedItems: [
      "Keyword research and tracking",
      "Technical SEO audits",
      "On-page content optimisation",
      "Regular performance reports",
    ],
  },
  brand_identity: {
    includedItems: [
      "Logo design & brand guidelines",
      "Up to 3 revision rounds",
      "All source files included",
      "Social media kit",
    ],
  },
  website_design: {
    includedItems: [
      "Custom responsive design",
      "SEO-ready structure",
      "Contact & enquiry forms",
      "Post-launch handover",
    ],
  },
  ecommerce: {
    includedItems: [
      "Full online store setup",
      "Payment gateway integration",
      "Product catalogue management",
      "Order & inventory tracking",
    ],
  },
  vps: {
    includedItems: [
      "Full root access",
      "DDoS protection and backups",
      "Dedicated IPv4 address",
      "10TB bandwidth on a 1Gbps port",
    ],
  },
  vds: {
    includedItems: [
      "Dedicated vCPU cores",
      "10TB bandwidth on a 1Gbps port",
      "You manage the operating system",
      "Servers and billing in nPanel",
    ],
  },
  dedicated_servers: {
    includedItems: [
      "A physical server used only by you",
      "CPU, memory and disks as listed",
      "You manage the operating system",
      "Servers and billing in nPanel",
    ],
  },
  zeepo_ai: {
    includedItems: [
      "Credits added to your team's Zepo wallet after payment",
      "Use them in Zepo chat and email in nPanel",
    ],
  },
  email_marketing: {
    includedItems: [
      "Campaigns designed from your brand",
      "Logo and brand colours fetched from your domain",
      "Sending from your own domain",
      "Opens, clicks and bounces in nPanel",
    ],
  },
  paid_ads: {
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
      includedItems: ["Professional service", "Dedicated account manager", "Regular progress updates"],
    }
  );
}

function formatPrice(amount: number, currency: string) {
  return formatCurrency(amount, currency === "USD" ? "USD" : "KES");
}

function multiYearSaving(monthly: number, yearly: number, cycle: BillingCycle) {
  if (cycle === "MONTHLY") return null;
  const months = billingCycleToMonths(cycle);
  const fullMonthly = monthly * months;
  const period = periodPrice(monthly, yearly, cycle);
  const saved = fullMonthly - period;
  if (saved <= 0) return null;
  const pct = Math.round((saved / fullMonthly) * 100);
  return pct >= 1 ? { saved, pct } : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function billedLabel(cycle: BillingCycle): string {
  if (cycle === "MONTHLY") return "Billed monthly";
  if (cycle === "YEARLY") return "Billed yearly";
  return `Billed every ${billingCyclePeriodLabel(cycle)}`;
}

function TermOption({
  label,
  price,
  suffix,
  savePct,
  selected,
  onSelect,
}: {
  label: string;
  price: string;
  suffix: string;
  savePct: number | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-16 flex-col items-start justify-center rounded-xl border px-3 py-2.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        selected
          ? "border-primary bg-primary/[0.06] ring-1 ring-primary"
          : "border-border hover:border-foreground/30 hover:bg-muted/40",
      )}
    >
      {savePct != null && (
        <span className="absolute -top-2.5 right-2 rounded-full bg-brand-orange px-2 py-0.5 text-xs font-semibold text-brand-midnight">
          Save {savePct}%
        </span>
      )}
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {price}
        <span className="ml-0.5">/{suffix}</span>
      </span>
    </button>
  );
}

export function CartItem({ item, onBillingCycleChange, onRemove }: CartItemProps) {
  const meta = getServiceMeta(item.serviceType);
  const isDomainRegistration = item.serviceType === "domain_registration";
  const isDomainTransfer = item.serviceType === "domain_transfer";
  const isDomain = isDomainRegistration || isDomainTransfer;
  const isOneTime = isOneTimeService(item.serviceType);
  const cycle = isDomainTransfer ? "YEARLY" : isOneTime ? "MONTHLY" : item.billingCycle;
  const displayPrice = periodPrice(item.monthlyPrice, item.yearlyPrice, cycle);
  const saving = !isDomain && !isOneTime ? multiYearSaving(item.monthlyPrice, item.yearlyPrice, cycle) : null;
  // Domains renew at the annual rate; services renew at the selected term price.
  const renewalPrice = isDomain
    ? item.yearlyPrice
    : periodPrice(item.monthlyPrice, item.yearlyPrice, cycle);
  const strikeThrough = saving ? item.monthlyPrice * billingCycleToMonths(cycle) : null;
  const termOptions = isDomainRegistration ? DOMAIN_BILLING_CYCLES : billingCyclesFor(item.serviceType);
  const showTermPicker = !isDomainTransfer && !isOneTime && termOptions.length > 1;

  const termNote = isOneTime
    ? "One-time payment. Nothing renews; buy another pack when you run low."
    : isDomain
      ? `Renews at ${formatPrice(renewalPrice, item.currency)}/yr. Standard renewal applies.`
      : `${billedLabel(cycle)}. Renews at ${formatPrice(renewalPrice, item.currency)}/${billingCycleShortSuffix(cycle)}. ${
          item.serviceType === SEO_CHECKOUT_SERVICE_TYPE || item.serviceType === "social_media"
            ? SEO_POLICY.commitment
            : "Cancel anytime."
        }`;

  return (
    <section aria-label={`${item.productName}: ${item.planName}`} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4">
        <ServiceIcon serviceType={item.serviceType} size="lg" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{item.productName}</p>
              <h2 className="mt-0.5 break-words text-lg font-semibold leading-snug text-foreground">{item.planName}</h2>
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <div className="text-right">
                {strikeThrough != null && strikeThrough > displayPrice && (
                  <p className="text-xs text-muted-foreground line-through tabular-nums">
                    {formatPrice(strikeThrough, item.currency)}
                  </p>
                )}
                <p className="text-xl font-bold text-foreground tabular-nums">{formatPrice(displayPrice, item.currency)}</p>
                <p className="text-xs text-muted-foreground">
                  {isOneTime
                    ? "one-time"
                    : isDomainTransfer
                      ? "1 year"
                      : cycle === "MONTHLY"
                        ? "per month"
                        : billingCyclePeriodLabel(cycle)}
                </p>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1 -mt-1 size-8 min-h-0 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                  aria-label={`Remove ${item.planName}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTermPicker && (
        <div className="mt-5">
          <p id="cart-term-label" className="text-sm font-semibold text-foreground">
            {isDomainRegistration ? "Registration period" : "Billing term"}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="cart-term-label"
            className={cn(
              "mt-2.5 grid gap-2",
              termOptions.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : termOptions.length === 3 ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            {termOptions.map((opt) => {
              const optSaving = isDomain ? null : multiYearSaving(item.monthlyPrice, item.yearlyPrice, opt.value);
              return (
                <TermOption
                  key={opt.value}
                  label={opt.label}
                  price={formatPrice(periodPrice(item.monthlyPrice, item.yearlyPrice, opt.value), item.currency)}
                  suffix={billingCycleShortSuffix(opt.value)}
                  savePct={optSaving?.pct ?? null}
                  selected={opt.value === cycle}
                  onSelect={() => onBillingCycleChange(opt.value)}
                />
              );
            })}
          </div>
        </div>
      )}

      {isDomainTransfer && (
        <p className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-foreground">
          1 year · Transfer + renewal
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{termNote}</p>

      <ul className="mt-4 grid grid-cols-1 gap-1.5 border-t border-border pt-4 sm:grid-cols-2">
        {meta.includedItems.map((feat) => (
          <li key={feat} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span className="text-sm text-muted-foreground">{feat}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
