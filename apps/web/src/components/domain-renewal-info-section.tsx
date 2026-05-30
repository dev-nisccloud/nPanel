"use client";

import { CalendarClock } from "lucide-react";
import { Spinner } from "@/components/npanel-ui/spinner";
import { useDomainRenewalQuote } from "@/hooks/use-domain-renewal-quote";
import { isKenicTld, parseFullDomain } from "@/routes/agency.domains/_components/kenic-card-schema";

/** Same formatting as buy-now domain product step renewal row */
function formatRenewalPrice(price?: number, currency?: string) {
  if (price === undefined || price === null || isNaN(price) || !isFinite(price)) {
    return "N/A";
  }
  const symbol =
    (currency || "KES") === "KES" ? "KSh" : currency === "USD" ? "$" : currency || "KSh";
  const n =
    typeof Intl !== "undefined" && Intl.NumberFormat
      ? new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price)
      : String(price);
  return `${symbol} ${n}`;
}

export type DomainRenewalInfoSectionProps = {
  /** Full domain, e.g. example.com */
  domain: string;
  /** Years from today for “renews on” date (buy-now: selected duration; transfer: 1) */
  yearsFromNow?: number;
  /**
   * KENIC only (buy-now): show renewal at this unit price.
   * Omit on transfer - KENIC renewal row is hidden via `hideForKenic`.
   */
  kenicUnitPrice?: number | null;
  kenicCurrency?: string;
  /** Buy-now sets true so KENIC shows the renewal row; transfer leaves false */
  showKenicRenewalQuote?: boolean;
  /** When true, do not render for KENIC TLDs (transfer flow) */
  hideForKenic?: boolean;
  className?: string;
};

/**
 * Renewal row used in buy-now and transfer UIs.
 * OpenProvider: getPricing(renew) → margin → currency conversion (useDomainRenewalQuote).
 * KENIC (buy-now only): same displayed unit price as registration.
 */
export function DomainRenewalInfoSection({
  domain,
  yearsFromNow = 1,
  kenicUnitPrice = null,
  kenicCurrency = "KES",
  showKenicRenewalQuote = false,
  hideForKenic = false,
  className,
}: DomainRenewalInfoSectionProps) {
  const parsed = parseFullDomain(domain);
  const isKenic = parsed ? isKenicTld(parsed.tld) : false;

  const { renewalDateLabel, renewalQuote, showRenewalQuote, isLoading } = useDomainRenewalQuote({
    domain,
    yearsFromNow,
    kenicUnitPrice: isKenic ? kenicUnitPrice : null,
    kenicCurrency,
    showKenicRenewalQuote,
    enabled: !(hideForKenic && isKenic),
  });

  if (hideForKenic && isKenic) {
    return null;
  }

  if (isKenic && !showRenewalQuote) {
    return null;
  }

  return (
    <div
      className={
        className ??
        "rounded-lg border border-dashed bg-muted/40 px-4 py-3"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background">
            <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Renewal</p>
            <p className="text-xs text-muted-foreground">
              Domain renews on {renewalDateLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          {isLoading ? (
            <Spinner className="h-4 w-4 text-muted-foreground" />
          ) : renewalQuote ? (
            <>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatRenewalPrice(renewalQuote.amount, renewalQuote.currency)}
              </p>
              <p className="text-xs text-muted-foreground">per year</p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Price unavailable</p>
          )}
        </div>
      </div>
    </div>
  );
}
