"use client";

import * as React from "react";
import { Check, HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DomainRenewalInfoSection } from "@/components/domain-renewal-info-section";
import type { DomainSearchResult } from "@/hooks/use-domain-search";
import { isKenicTld, parseFullDomain } from "@/routes/agency.domains/_components/kenic-card-schema";

const formatPrice = (price?: number, currency?: string) => {
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
};

type AddOnProduct = {
  product: { id: string; name: string };
  plans: Array<{ id: string; name: string; price: string | null; currency: string }>;
};

export type BuyNowDomainProductStepProps = {
  productName: string;
  domain: DomainSearchResult;
  duration: number;
  onDurationChange: (years: number) => void;
  domainDisplayPrice: number;
  domainTotal: number;
  displayCurrency: string;
  addOnsData: AddOnProduct[];
  selectedAddOns: Array<{ productId: string }>;
  onToggleAddOn: (
    productId: string,
    productName: string,
    planId: string,
    planName: string,
    price: number,
    currency: string,
  ) => void;
};

export function BuyNowDomainProductStep({
  productName,
  domain,
  duration,
  onDurationChange,
  domainDisplayPrice,
  domainTotal,
  displayCurrency,
  addOnsData,
  selectedAddOns,
  onToggleAddOn,
}: BuyNowDomainProductStepProps) {
  const parsed = React.useMemo(() => parseFullDomain(domain.domain), [domain.domain]);
  const isKenic = parsed ? isKenicTld(parsed.tld) : false;

  const hasAddOns = addOnsData.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1 text-center">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          Register {domain.domain}
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose registration length for this {productName.toLowerCase()} purchase
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Domain
            </p>
            <div className="flex items-center gap-1.5">
              <p className="truncate text-base font-semibold text-foreground">{domain.domain}</p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Registration period help"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Registration period starts after successful payment and provisioning.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <Select
              value={duration.toString()}
              onValueChange={(v) => onDurationChange(parseInt(v, 10))}
            >
              <SelectTrigger className="h-9 w-[7.5rem] bg-background">
                <SelectValue>
                  {duration} {duration === 1 ? "year" : "years"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 10].map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y} year{y > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="min-w-[5.5rem] text-right text-lg font-semibold tabular-nums text-foreground">
              {formatPrice(domainTotal, displayCurrency)}
            </p>
          </div>
        </div>

        {duration > 1 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {formatPrice(domainDisplayPrice, displayCurrency)} per year × {duration} years
          </p>
        ) : null}
      </div>

      {hasAddOns ? (
        <ScrollArea className="max-h-[220px] w-full">
          <div className="space-y-2 pr-3">
            <p className="text-sm font-medium text-foreground">Optional add-ons</p>
            {addOnsData.map(({ product, plans: addonPlans }) => {
              const plan = addonPlans[0];
              const price = plan ? parseFloat(plan.price ?? "0") : 0;
              const currency = plan?.currency ?? "KES";
              const isSelected = selectedAddOns.some((a) => a.productId === product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() =>
                    plan &&
                    onToggleAddOn(
                      product.id,
                      product.name,
                      plan.id,
                      plan.name,
                      price,
                      currency,
                    )
                  }
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        ) : null}
                      </div>
                      <span className="text-sm font-medium tabular-nums">
                        {price === 0 ? "Free" : formatPrice(price, currency)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      ) : null}

      <DomainRenewalInfoSection
        domain={domain.domain}
        yearsFromNow={duration}
        kenicUnitPrice={isKenic ? domainDisplayPrice : null}
        kenicCurrency={displayCurrency}
        showKenicRenewalQuote
      />
    </div>
  );
}
