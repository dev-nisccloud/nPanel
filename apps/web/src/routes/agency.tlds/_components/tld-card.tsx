"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { OpenproviderTld } from "@/types/openprovider";

interface TldCardProps {
  tld: OpenproviderTld;
  onClick?: () => void;
}

const formatPrice = (price?: number, currency?: string) => {
  if (!price) return "N/A";

  // Currency symbols mapping
  const currencySymbols: Record<string, string> = {
    USD: "$",
    KES: "KSh",
    EUR: "€",
    GBP: " ?",
    CAD: "C$",
    AUD: "A$",
    JPY: " ?",
    INR: "₹",
    ZAR: "R",
    NGN: "₦",
  };

  const symbol = currencySymbols[currency || "USD"] || currency || "$";
  // Format with thousand separators (e.g., 1,000.00)
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  return `${symbol} ${formattedNumber}`;
};

export function TldCard({ tld, onClick }: TldCardProps) {
  const registrationPrice =
    tld.prices?.create_price?.reseller?.price ??
    tld.prices?.create_price?.product?.price;
  const registrationCurrency =
    tld.prices?.create_price?.reseller?.currency ??
    tld.prices?.create_price?.product?.currency ??
    "USD";

  const renewPrice =
    tld.prices?.renew_price?.reseller?.price ??
    tld.prices?.renew_price?.product?.price;
  const renewCurrency =
    tld.prices?.renew_price?.reseller?.currency ??
    tld.prices?.renew_price?.product?.currency ??
    "USD";

  return (
    <div
      className="flex flex-col p-3 bg-card border border-border rounded-lg hover:border-border/80 hover:shadow-sm transition-all cursor-pointer"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {/* Header: TLD name and status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm text-card-foreground truncate block">
            {tld.name.toUpperCase()}
          </span>
        </div>
        <Badge
          variant={tld.status === "ACT" ? "default" : "secondary"}
          className="text-xs"
        >
          {tld.status}
        </Badge>
      </div>

      {/* Price Section */}
      {registrationPrice && (
        <div className="mb-2">
          <div className="text-lg font-bold text-card-foreground">
            {formatPrice(registrationPrice, registrationCurrency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Registration
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="mt-auto pt-2 space-y-1">
        {renewPrice && (
          <div className="text-xs text-muted-foreground">
            Renewal: {formatPrice(renewPrice, renewCurrency)}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Period: {tld.min_period}-{tld.max_period} years
        </div>
        {tld.transfer_available && (
          <div className="text-xs text-muted-foreground">Transfer Available</div>
        )}
        {tld.dnssec_allowed && (
          <div className="text-xs text-muted-foreground">DNSSEC Allowed</div>
        )}
      </div>
    </div>
  );
}
